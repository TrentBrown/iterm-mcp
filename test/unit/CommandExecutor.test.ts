// @ts-nocheck
const mockExecPromiseFn = jest.fn();

jest.mock('node:util', () => ({
  promisify: jest.fn().mockReturnValue(mockExecPromiseFn)
}));
jest.mock('node:child_process', () => ({
  exec: jest.fn()
}));
jest.mock('../../src/TtyOutputReader.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    retrieveBuffer: jest.fn().mockResolvedValue('Mocked terminal output')
  }))
}));
jest.mock('node:fs', () => ({
  openSync: jest.fn().mockReturnValue(1),
  closeSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true)
}));

import { jest, describe, expect, test, beforeEach } from '@jest/globals';

// Use dynamic import for ESM compatibility and to ensure mocks are in place

describe('CommandExecutor', () => {
  let CommandExecutor;
  let commandExecutor;
  let TtyOutputReader;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Dynamically import after mocks
    CommandExecutor = (await import('../../src/CommandExecutor.js')).default;
    TtyOutputReader = (await import('../../src/TtyOutputReader.js')).default;
    mockExecPromiseFn.mockImplementation((command) => {
      if (command.includes('get tty')) {
        return Promise.resolve({ stdout: '/dev/ttys000\n', stderr: '' });
      } else if (command.includes('get is processing')) {
        return Promise.resolve({ stdout: 'false\n', stderr: '' });
      } else {
        return Promise.resolve({ stdout: '', stderr: '' });
      }
    });
    // Inject the mockExecPromiseFn into CommandExecutor with default app name and mock function
    commandExecutor = new CommandExecutor("iTerm2", mockExecPromiseFn);
  });

  test('executeCommand passes the command to execPromise', async () => {
    const testCommand = 'echo "Hello World"';
    await commandExecutor.executeCommand(testCommand);
    // Find the call that contains osascript and the user's command (escaped)
    const calledWith = mockExecPromiseFn.mock.calls.find(call =>
      call[0].includes('osascript') && call[0].includes('Hello World')
    );
    expect(calledWith).toBeTruthy();
  });
});