// @ts-nocheck
import { jest, describe, expect, test } from '@jest/globals';

describe('CommandExecutor', () => {
  test('should be instantiable', async () => {
    // Mock all dependencies inline for this simple test
    jest.unstable_mockModule('node:child_process', () => ({
      exec: jest.fn()
    }));
    
    jest.unstable_mockModule('node:util', () => ({
      promisify: jest.fn(() => jest.fn())
    }));
    
    jest.unstable_mockModule('../../src/TtyOutputReader.js', () => ({
      default: jest.fn()
    }));
    
    jest.unstable_mockModule('../../src/ProcessTracker.js', () => ({
      default: jest.fn()
    }));
    
    jest.unstable_mockModule('../../src/WindowManager.js', () => ({
      WindowManager: {
        ensureWindowExists: jest.fn(),
        buildAppleScriptForSession: jest.fn()
      }
    }));
    
    const { default: CommandExecutor } = await import('../../src/CommandExecutor.js');
    
    const executor = new CommandExecutor();
    expect(executor).toBeDefined();
  });
});