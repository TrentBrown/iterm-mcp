# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iterm-mcp-multiple is a Model Context Protocol (MCP) server that provides direct access to iTerm terminal sessions. It allows AI assistants to execute commands, read terminal output, and send control characters through three main tools: `write_to_terminal`, `read_terminal_output`, and `send_control_character`.

**Key Feature**: Supports configurable window targeting via the `--client` argument, enabling multiple MCP servers to target different windows within iTerm2 without interference.

## Development Commands

### Building and Testing
- `yarn install` - Install dependencies
- `yarn run build` - Build TypeScript to JavaScript in ./build directory and make executable
- `yarn run watch` - Build with auto-rebuild on file changes
- `yarn run test` - Run unit tests with Jest
- `yarn run test:watch` - Run tests in watch mode
- `yarn run test:coverage` - Run tests with coverage report
- `yarn run e2e` - Run end-to-end tests (requires iTerm2)

### Usage with Client Windows and Profiles
- Default: `npx iterm-mcp-multiple` (targets current window with default profile)
- Custom window: `npx iterm-mcp-multiple --client "Agent1"` (creates window for "Agent1" with default profile)
- Custom profile: `npx iterm-mcp-multiple --profile "Dark"` (uses current window with "Dark" profile)
- Both: `npx iterm-mcp-multiple --client "Agent1" --profile "Dark"` (creates "Agent1" window with "Dark" profile)

### Debugging
- `yarn run inspector` - Launch MCP Inspector for debugging the server
- Use MCP Inspector at provided URL for testing tools and debugging
- For custom windows: `yarn run inspector --client "Agent1" --profile "Dark"`

### Publishing
- `yarn run prepublishOnly` - Automatically builds before publishing

## Architecture

### Core Components

**index.ts** - Main MCP server entry point that:
- Parses command-line arguments (supports `--client` for custom window targeting and `--profile` for custom iTerm2 profiles)
- Sets up the MCP server with three tools
- Handles tool execution requests
- Manages server lifecycle and error handling
- Passes client name and profile name to all component instances

**CommandExecutor.ts** - Handles command execution via AppleScript:
- Accepts configurable client name and profile name in constructor
- Executes commands in specified iTerm2 window through AppleScript automation
- Handles multiline commands with special AppleScript string concatenation
- Waits for command completion using process tracking and TTY monitoring
- Manages AppleScript escaping for special characters
- Creates windows automatically when client name is specified, using specified profile if provided

**TtyOutputReader.ts** - Reads terminal content:
- Instance-based class accepting client name in constructor
- Retrieves terminal buffer content via AppleScript from specified iTerm2 window
- Supports reading specific number of lines from terminal output
- Returns formatted terminal content for AI consumption

**ProcessTracker.ts** - Advanced process monitoring system:
- Tracks active processes in terminal sessions using `ps` commands
- Calculates CPU and memory usage metrics
- Identifies foreground process groups and interesting processes
- Detects environment contexts (Rails console, REPLs, package managers)
- Builds process hierarchy chains for context

**SendControlCharacter.ts** - Sends control sequences:
- Accepts configurable client name in constructor
- Sends control characters (Ctrl-C, Ctrl-Z, etc.) to specified iTerm2 window
- Handles special sequences like telnet escape characters

**WindowManager.ts** - Window management utilities:
- Creates iTerm2 windows with specified names and profiles when they don't exist
- Provides targeting utilities for AppleScript commands
- Ensures window exists before performing operations
- Supports custom iTerm2 profiles for different terminal configurations

### Key Design Patterns

**AppleScript Integration**: All terminal interaction uses AppleScript to communicate with iTerm2, requiring careful string escaping and multiline handling.

**Configurable Window Targeting**: All components accept a client name parameter, enabling multiple instances to target different iTerm2 windows without interference.

**Process Monitoring**: CommandExecutor waits for command completion by monitoring both the target iTerm's processing state and analyzing active processes via ProcessTracker.

**MCP Tool Architecture**: Each tool returns structured responses with text content, following MCP protocol specifications.

## Testing Structure

- **Unit tests** (`test/unit/`): Test individual components in isolation, including argument parsing
- **E2E tests** (`test/e2e/`): Test full integration with actual iTerm instances
- Jest configuration supports ES modules with TypeScript compilation
- Coverage excludes main entry point (index.ts)
- Tests verify both default current window behavior and custom client window functionality

## Dependencies

- **@modelcontextprotocol/sdk**: Core MCP protocol implementation
- **TypeScript**: Language and build tooling
- **Jest**: Testing framework with ES module support
- **Node.js 18+**: Runtime requirement

## Platform Requirements

- macOS only (uses AppleScript for iTerm automation)
- iTerm2 application must be running and accessible
- Requires proper iTerm accessibility permissions
- Supports multiple named windows within iTerm2 for multi-agent scenarios

## Usage Examples

### Single Instance (Default)
```bash
npx iterm-mcp-multiple
```

### Multiple Instances for Different Windows and Profiles
```json
{
  "mcpServers": {
    "iterm-agent1": {
      "command": "npx",
      "args": ["-y", "iterm-mcp-multiple", "--client", "Agent1", "--profile", "Dark"]
    },
    "iterm-agent2": {
      "command": "npx", 
      "args": ["-y", "iterm-mcp-multiple", "--client", "Agent2", "--profile", "Light"]
    },
    "iterm-dev": {
      "command": "npx",
      "args": ["-y", "iterm-mcp-multiple", "--client", "Development", "--profile", "Hotkey Window"]
    }
  }
}
```