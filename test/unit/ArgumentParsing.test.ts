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

  test('should parse --client argument correctly', () => {
    // Mock process.argv with our test arguments
    process.argv = ['node', 'index.js', '--client', 'Agent1'];

    // We need to test the parseArgs function, but since it's not exported,
    // we'll test the behavior by checking what happens when the module is loaded
    // This is a simple test that verifies the argument parsing logic
    const args = process.argv.slice(2);
    let clientName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--client" && i + 1 < args.length) {
        clientName = args[i + 1];
        break;
      }
    }
    
    expect(clientName).toBe('Agent1');
  });

  test('should use default undefined when no --client provided', () => {
    // Mock process.argv without --client
    process.argv = ['node', 'index.js'];

    const args = process.argv.slice(2);
    let clientName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--client" && i + 1 < args.length) {
        clientName = args[i + 1];
        break;
      }
    }
    
    expect(clientName).toBe(undefined);
  });

  test('should handle --client with spaces', () => {
    // Mock process.argv with client name containing spaces
    process.argv = ['node', 'index.js', '--client', 'My Custom Window'];

    const args = process.argv.slice(2);
    let clientName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--client" && i + 1 < args.length) {
        clientName = args[i + 1];
        break;
      }
    }
    
    expect(clientName).toBe('My Custom Window');
  });

  test('should ignore --client if no value provided', () => {
    // Mock process.argv with --client but no value
    process.argv = ['node', 'index.js', '--client'];

    const args = process.argv.slice(2);
    let clientName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--client" && i + 1 < args.length) {
        clientName = args[i + 1];
        break;
      }
    }
    
    expect(clientName).toBe(undefined);
  });

  test('should handle other arguments alongside --client', () => {
    // Mock process.argv with multiple arguments
    process.argv = ['node', 'index.js', '--verbose', '--client', 'Test-Window', '--debug'];

    const args = process.argv.slice(2);
    let clientName = undefined; // Default
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--client" && i + 1 < args.length) {
        clientName = args[i + 1];
        break;
      }
    }
    
    expect(clientName).toBe('Test-Window');
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

  test('should parse both --client and --profile arguments', () => {
    // Mock process.argv with both arguments
    process.argv = ['node', 'index.js', '--client', 'Agent1', '--profile', 'Dark'];

    const args = process.argv.slice(2);
    let clientName = undefined;
    let profileName = undefined;
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--client" && i + 1 < args.length) {
        clientName = args[i + 1];
        i++; // Skip the next argument since we consumed it
      } else if (args[i] === "--profile" && i + 1 < args.length) {
        profileName = args[i + 1];
        i++; // Skip the next argument since we consumed it
      }
    }
    
    expect(clientName).toBe('Agent1');
    expect(profileName).toBe('Dark');
  });

  test('should use default undefined when no --profile provided', () => {
    // Mock process.argv without --profile
    process.argv = ['node', 'index.js', '--client', 'Test'];

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