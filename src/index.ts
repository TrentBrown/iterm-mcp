#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import CommandExecutor from "./CommandExecutor.js";
import TtyOutputReader from "./TtyOutputReader.js";
import SendControlCharacter from "./SendControlCharacter.js";
import { WindowManager } from "./WindowManager.js";

// Parse command line arguments
function parseArgs(): { agentName?: string; profileName?: string; createWindowOnly?: boolean } {
  const args = process.argv.slice(2);
  let agentName: string | undefined = undefined; // Default uses current window
  let profileName: string | undefined = undefined; // Default uses default profile
  let createWindowOnly: boolean = false; // Default starts MCP server
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--agent" && i + 1 < args.length) {
      agentName = args[i + 1];
      i++; // Skip the next argument since we consumed it
    } else if (args[i] === "--profile" && i + 1 < args.length) {
      profileName = args[i + 1];
      i++; // Skip the next argument since we consumed it
    } else if (args[i] === "--create-window") {
      createWindowOnly = true;
    }
  }
  
  return { agentName, profileName, createWindowOnly };
}

const config = parseArgs();

const server = new Server(
  {
    name: "iterm-mcp",
    version: "1.6.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "write_to_terminal",
        description: "Writes text to the active iTerm terminal - often used to run a command in the terminal",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The command to run or text to write to the terminal"
            },
          },
          required: ["command"]
        }
      },
      {
        name: "read_terminal_output",
        description: "Reads the output from the active iTerm terminal",
        inputSchema: {
          type: "object",
          properties: {
            linesOfOutput: {
              type: "integer",
              description: "The number of lines of output to read."
            },
          },
          required: ["linesOfOutput"]
        }
      },
      {
        name: "send_control_character",
        description: "Sends a control character to the active iTerm terminal (e.g., Control-C, or special sequences like ']' for telnet escape)",
        inputSchema: {
          type: "object",
          properties: {
            letter: {
              type: "string",
              description: "The letter corresponding to the control character (e.g., 'C' for Control-C, ']' for telnet escape)"
            },
          },
          required: ["letter"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "write_to_terminal": {
      let executor = new CommandExecutor(config.agentName, config.profileName);
      const ttyReader = new TtyOutputReader(config.agentName, config.profileName);
      const command = String(request.params.arguments?.command);
      const beforeCommandBuffer = await ttyReader.retrieveBuffer();
      const beforeCommandBufferLines = beforeCommandBuffer.split("\n").length;
      
      await executor.executeCommand(command);
      
      const afterCommandBuffer = await ttyReader.retrieveBuffer();
      const afterCommandBufferLines = afterCommandBuffer.split("\n").length;
      const outputLines = afterCommandBufferLines - beforeCommandBufferLines

      return {
        content: [{
          type: "text",
          text: `${outputLines} lines were output after sending the command to the terminal. Read the last ${outputLines} lines of terminal contents to orient yourself. Never assume that the command was executed or that it was successful.`
        }]
      };
    }
    case "read_terminal_output": {
      const ttyReader = new TtyOutputReader(config.agentName, config.profileName);
      const linesOfOutput = Number(request.params.arguments?.linesOfOutput) || 25
      const output = await ttyReader.call(linesOfOutput)

      return {
        content: [{
          type: "text",
          text: output
        }]
      };
    }
    case "send_control_character": {
      const ttyControl = new SendControlCharacter(config.agentName, config.profileName);
      const letter = String(request.params.arguments?.letter);
      await ttyControl.send(letter);
      
      return {
        content: [{
          type: "text",
          text: `Sent control character: Control-${letter.toUpperCase()}`
        }]
      };
    }
    default:
      throw new Error("Unknown tool");
  }
});

// Standalone function to create and activate a window
async function createWindow(agentName: string, profileName?: string) {
  try {
    if (!agentName) {
      console.error("Error: --agent parameter is required when using --create-window");
      process.exit(1);
    }
    
    await WindowManager.ensureWindowExists(agentName, profileName);
    console.log(`Window created for agent: ${agentName}${profileName ? ` with profile: ${profileName}` : ''}`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating window:", error);
    process.exit(1);
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Check if we should create a window only or start the MCP server
if (config.createWindowOnly) {
  createWindow(config.agentName!, config.profileName);
} else {
  main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
