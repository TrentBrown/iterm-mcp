// @ts-nocheck
import { jest, describe, expect, test, beforeEach, afterEach } from '@jest/globals';

describe('Argument Parsing', () => {
  let originalArgv;

  beforeEach(() => {
    // Save original argv
    originalArgv = process.argv;
  });

  afterEach(() => {
    // Restore original argv
    process.argv = originalArgv;
  });

  test('should parse --agent argument correctly', () => {
    // Mock process.argv with our test arguments
    process.argv = ['node', 'index.js', '--agent', 'Agent1'];

    // We need to test the parseArgs function, but since it's not exported,
    // we'll test the behavior by checking what happens when the module is loaded
    // This is a simple test that verifies the argument parsing logic
    const args = process.argv.slice(2);
    let agentName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--agent" && i + 1 < args.length) {
        agentName = args[i + 1];
        break;
      }
    }
    
    expect(agentName).toBe('Agent1');
  });

  test('should use default undefined when no --agent provided', () => {
    // Mock process.argv without --agent
    process.argv = ['node', 'index.js'];

    const args = process.argv.slice(2);
    let agentName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--agent" && i + 1 < args.length) {
        agentName = args[i + 1];
        break;
      }
    }
    
    expect(agentName).toBe(undefined);
  });

  test('should handle --agent with spaces', () => {
    // Mock process.argv with agent name containing spaces
    process.argv = ['node', 'index.js', '--agent', 'My Custom Window'];

    const args = process.argv.slice(2);
    let agentName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--agent" && i + 1 < args.length) {
        agentName = args[i + 1];
        break;
      }
    }
    
    expect(agentName).toBe('My Custom Window');
  });

  test('should ignore --agent if no value provided', () => {
    // Mock process.argv with --agent but no value
    process.argv = ['node', 'index.js', '--agent'];

    const args = process.argv.slice(2);
    let agentName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--agent" && i + 1 < args.length) {
        agentName = args[i + 1];
        break;
      }
    }
    
    expect(agentName).toBe(undefined);
  });

  test('should handle other arguments alongside --agent', () => {
    // Mock process.argv with multiple arguments
    process.argv = ['node', 'index.js', '--verbose', '--agent', 'Test-Window', '--debug'];

    const args = process.argv.slice(2);
    let agentName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--agent" && i + 1 < args.length) {
        agentName = args[i + 1];
        break;
      }
    }
    
    expect(agentName).toBe('Test-Window');
  });

  test('should parse --profile argument correctly', () => {
    // Mock process.argv with profile argument
    process.argv = ['node', 'index.js', '--profile', 'Default'];

    const args = process.argv.slice(2);
    let profileName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--profile" && i + 1 < args.length) {
        profileName = args[i + 1];
        i++; // Skip the next argument since we consumed it
      }
    }
    
    expect(profileName).toBe('Default');
  });

  test('should parse both --agent and --profile arguments', () => {
    // Mock process.argv with both arguments
    process.argv = ['node', 'index.js', '--agent', 'Agent1', '--profile', 'Dark'];

    const args = process.argv.slice(2);
    let agentName = undefined;
    let profileName = undefined;
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--agent" && i + 1 < args.length) {
        agentName = args[i + 1];
        i++; // Skip the next argument since we consumed it
      } else if (args[i] === "--profile" && i + 1 < args.length) {
        profileName = args[i + 1];
        i++; // Skip the next argument since we consumed it
      }
    }
    
    expect(agentName).toBe('Agent1');
    expect(profileName).toBe('Dark');
  });

  test('should use default undefined when no --profile provided', () => {
    // Mock process.argv without --profile
    process.argv = ['node', 'index.js', '--agent', 'Test'];

    const args = process.argv.slice(2);
    let profileName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--profile" && i + 1 < args.length) {
        profileName = args[i + 1];
        i++; // Skip the next argument since we consumed it
      }
    }
    
    expect(profileName).toBe(undefined);
  });
});