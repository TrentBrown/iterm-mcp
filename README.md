# iterm-mcp-multiple 
[![smithery badge](https://smithery.ai/badge/iterm-mcp-multiple)](https://smithery.ai/server/iterm-mcp-multiple)
A Model Context Protocol server that provides access to your iTerm session.

## Fork Attribution
This project is a fork of [iterm-mcp](https://github.com/ferrislucas/iterm-mcp) by [Ferris Lucas](https://github.com/ferrislucas). The original project provides excellent iTerm integration for MCP servers. This fork maintains the same functionality with a different package name to avoid conflicts in multi-agent scenarios.

**New**: Supports configurable iTerm application instances via `--app-name` for multi-agent scenarios.

![Main Image](.github/images/demo.gif)

### Features

**Efficient Token Use:** iterm-mcp gives the model the ability to inspect only the output that the model is interested in. The model typically only wants to see the last few lines of output even for long running commands. 

**Natural Integration:** You share iTerm with the model. You can ask questions about what's on the screen, or delegate a task to the model and watch as it performs each step.

**Full Terminal Control and REPL support:** The model can start and interact with REPL's as well as send control characters like ctrl-c, ctrl-z, etc.

**Easy on the Dependencies:** iterm-mcp-multiple is built with minimal dependencies and is runnable via npx. It's designed to be easy to add to Claude Desktop and other MCP clients. It should just work.


## Safety Considerations

* The user is responsible for using the tool safely.
* No built-in restrictions: iterm-mcp-multiple makes no attempt to evaluate the safety of commands that are executed.
* Models can behave in unexpected ways. The user is expected to monitor activity and abort when appropriate.
* For multi-step tasks, you may need to interrupt the model if it goes off track. Start with smaller, focused tasks until you're familiar with how the model behaves. 

### Tools
- `write_to_terminal` - Writes to the active iTerm terminal, often used to run a command. Returns the number of lines of output produced by the command.
- `read_terminal_output` - Reads the requested number of lines from the active iTerm terminal.
- `send_control_character` - Sends a control character to the active iTerm terminal.

### Requirements

* iTerm2 must be running
* Node version 18 or greater


## Installation

### Installing via Smithery

To install iTerm for Claude Desktop automatically via [Smithery](https://smithery.ai/server/iterm-mcp):

```bash
npx -y @smithery/cli install iterm-mcp-multiple --client claude
```

To use with Claude Desktop, add the server config:

On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "iterm-mcp-multiple": {
      "command": "npx",
      "args": [
        "-y",
        "iterm-mcp-multiple"
      ]
    }
  }
}
```

### Multiple Instances (for different AI agents)

To avoid conflicts between multiple AI agents, you can run separate iTerm applications and target them individually:

```json
{
  "mcpServers": {
    "iterm-agent1": {
      "command": "npx",
      "args": [
        "-y",
        "iterm-mcp-multiple",
        "--app-name",
        "iTerm-Agent1"
      ]
    },
    "iterm-agent2": {
      "command": "npx",
      "args": [
        "-y", 
        "iterm-mcp-multiple",
        "--app-name",
        "iTerm-Agent2"
      ]
    }
  }
}
```

**Note**: You'll need to create named copies of your iTerm application (e.g., duplicate iTerm.app and rename to "iTerm-Agent1.app") for this to work.


## Development

Install dependencies:
```bash
yarn install
```

Build the server:
```bash
yarn run build
```

For development with auto-rebuild:
```bash
yarn run watch
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
yarn run inspector
yarn debug <command>
```

The Inspector will provide a URL to access debugging tools in your browser.
