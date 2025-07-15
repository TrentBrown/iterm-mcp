import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

// Store window IDs for each client
const clientWindows = new Map<string, number>();

export class WindowManager {
    static async ensureiTermIsRunning(): Promise<void> {
        try {
            // Check if iTerm2 is running
            const checkScript = `
                tell application "System Events"
                    return (name of processes) contains "iTerm2"
                end tell
            `;
            
            const { stdout } = await execPromise(`osascript -e '${checkScript}'`);
            const isRunning = stdout.trim() === 'true';
            
            if (!isRunning) {
                // Launch iTerm2 using open command and wait for it to be ready
                await execPromise('open -a iTerm');
                
                // Wait for iTerm2 to fully launch
                let attempts = 0;
                while (attempts < 10) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const { stdout: checkResult } = await execPromise(`osascript -e '
                        tell application "System Events"
                            return (name of processes) contains "iTerm2"
                        end tell
                    '`);
                    
                    if (checkResult.trim() === 'true') {
                        // Give iTerm2 a moment to fully initialize
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        break;
                    }
                    attempts++;
                }
                
                if (attempts >= 10) {
                    throw new Error('iTerm2 failed to launch within timeout');
                }
            }
        } catch (error: unknown) {
            throw new Error(`Failed to ensure iTerm2 is running: ${(error as Error).message}`);
        }
    }

    static async ensureWindowExists(clientName: string, profileName?: string): Promise<void> {
        try {
            // First ensure iTerm2 is running
            await this.ensureiTermIsRunning();
            
            // Check if we already have a window for this client
            if (clientWindows.has(clientName)) {
                const windowId = clientWindows.get(clientName)!;
                // Verify the window still exists
                const checkScript = `
                    tell application "iTerm2"
                        try
                            get window id ${windowId}
                            return "exists"
                        on error
                            return "missing"
                        end try
                    end tell
                `;
                
                const { stdout } = await execPromise(`osascript -e '${checkScript}'`);
                if (stdout.trim() === 'exists') {
                    return; // Window still exists, we're good
                } else {
                    clientWindows.delete(clientName); // Clean up stale reference
                }
            }
            
            // Create new window for this client with specified profile
            const profileClause = profileName ? `profile "${profileName}"` : 'default profile';
            const escapedClientName = clientName.replace(/["\\]/g, '\\$&');
            const createScript = `
                tell application "iTerm2"
                    set newWindow to (create window with ${profileClause})
                    tell current session of current tab of newWindow
                        set name to "${escapedClientName}"
                    end tell
                    return id of newWindow
                end tell
            `;
            
            const { stdout } = await execPromise(`osascript -e '${createScript}'`);
            const windowId = parseInt(stdout.trim());
            clientWindows.set(clientName, windowId);
        } catch (error: unknown) {
            throw new Error(`Failed to ensure window exists: ${(error as Error).message}`);
        }
    }

    static buildAppleScriptForSession(clientName: string | undefined, operation: string): string {
        if (clientName) {
            const windowId = clientWindows.get(clientName);
            if (!windowId) {
                throw new Error(`No window found for client '${clientName}'. Window may have been closed.`);
            }
            
            return `tell application "iTerm2" to tell current session of current tab of window id ${windowId} to ${operation}`;
        } else {
            return `tell application "iTerm2" to tell current session of current tab of current window to ${operation}`;
        }
    }
}