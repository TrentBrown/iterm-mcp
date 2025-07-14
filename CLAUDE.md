# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iterm-mcp-multiple is a Model Context Protocol (MCP) server that provides direct access to iTerm terminal sessions. It allows AI assistants to execute commands, read terminal output, and send control characters through three main tools: `write_to_terminal`, `read_terminal_output`, and `send_control_character`.

**Key Feature**: Supports configurable iTerm application instances via the `--app-name` argument, enabling multiple MCP servers to target different iTerm clones without interference.

## Development Commands

### Building and Testing
- `yarn install` - Install dependencies
- `yarn run build` - Build TypeScript to JavaScript in ./build directory and make executable
- `yarn run watch` - Build with auto-rebuild on file changes
- `yarn run test` - Run unit tests with Jest
- `yarn run test:watch` - Run tests in watch mode
- `yarn run test:coverage` - Run tests with coverage report
- `yarn run e2e` - Run end-to-end tests (requires iTerm2)

### Usage with Custom Application Names
- Default: `npx iterm-mcp-multiple` (targets "iTerm2")
- Custom app: `npx iterm-mcp-multiple --app-name "iTerm-Agent1"` (targets custom iTerm instance)

### Debugging
- `yarn run inspector` - Launch MCP Inspector for debugging the server
- Use MCP Inspector at provided URL for testing tools and debugging
- For custom apps: `yarn run inspector --app-name "iTerm-Agent1"`

### Publishing
- `yarn run prepublishOnly` - Automatically builds before publishing

## Architecture

### Core Components

**index.ts** - Main MCP server entry point that:
- Parses command-line arguments (supports `--app-name` for custom iTerm instances)
- Sets up the MCP server with three tools
- Handles tool execution requests
- Manages server lifecycle and error handling
- Passes application name to all component instances

**CommandExecutor.ts** - Handles command execution via AppleScript:
- Accepts configurable application name in constructor
- Executes commands in specified iTerm instance through AppleScript automation
- Handles multiline commands with special AppleScript string concatenation
- Waits for command completion using process tracking and TTY monitoring
- Manages AppleScript escaping for special characters

**TtyOutputReader.ts** - Reads terminal content:
- Instance-based class accepting application name in constructor
- Retrieves terminal buffer content via AppleScript from specified iTerm instance
- Supports reading specific number of lines from terminal output
- Returns formatted terminal content for AI consumption

**ProcessTracker.ts** - Advanced process monitoring system:
- Tracks active processes in terminal sessions using `ps` commands
- Calculates CPU and memory usage metrics
- Identifies foreground process groups and interesting processes
- Detects environment contexts (Rails console, REPLs, package managers)
- Builds process hierarchy chains for context

**SendControlCharacter.ts** - Sends control sequences:
- Accepts configurable application name in constructor
- Sends control characters (Ctrl-C, Ctrl-Z, etc.) to specified iTerm instance
- Handles special sequences like telnet escape characters

### Key Design Patterns

**AppleScript Integration**: All terminal interaction uses AppleScript to communicate with configurable iTerm instances, requiring careful string escaping and multiline handling.

**Configurable Application Targeting**: All components accept an application name parameter, enabling multiple instances to target different iTerm applications without interference.

**Process Monitoring**: CommandExecutor waits for command completion by monitoring both the target iTerm's processing state and analyzing active processes via ProcessTracker.

**MCP Tool Architecture**: Each tool returns structured responses with text content, following MCP protocol specifications.

## Testing Structure

- **Unit tests** (`test/unit/`): Test individual components in isolation, including argument parsing
- **E2E tests** (`test/e2e/`): Test full integration with actual iTerm instances
- Jest configuration supports ES modules with TypeScript compilation
- Coverage excludes main entry point (index.ts)
- Tests verify both default "iTerm2" behavior and custom application name functionality

## Dependencies

- **@modelcontextprotocol/sdk**: Core MCP protocol implementation
- **TypeScript**: Language and build tooling
- **Jest**: Testing framework with ES module support
- **Node.js 18+**: Runtime requirement

## Platform Requirements

- macOS only (uses AppleScript for iTerm automation)
- Target iTerm application must be running and accessible
- Requires proper iTerm accessibility permissions
- Supports multiple named iTerm instances for multi-agent scenarios

## Usage Examples

### Single Instance (Default)
```bash
npx iterm-mcp-multiple
```

### Multiple Instances for Different Agents
```json
{
  "mcpServers": {
    "iterm-agent1": {
      "command": "npx",
      "args": ["-y", "iterm-mcp-multiple", "--app-name", "iTerm-Agent1"]
    },
    "iterm-agent2": {
      "command": "npx", 
      "args": ["-y", "iterm-mcp-multiple", "--app-name", "iTerm-Agent2"]
    }
  }
}
```