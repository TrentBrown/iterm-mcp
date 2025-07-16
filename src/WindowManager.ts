import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

// Store window IDs for each client (for current session)
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

    static async ensureWindowExists(clientName: string, profileName?: string): Promise<{ created: boolean }> {
        try {
            // First ensure iTerm2 is running
            await this.ensureiTermIsRunning();
            
            // Check if we already have a window for this client (in current MCP session only)
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
                    // Window exists, no need to activate it
                    return { created: false }; // Window still exists
                } else {
                    clientWindows.delete(clientName); // Clean up stale reference
                }
            }
            
            // Always create new window (no cross-process search)
            const profileClause = profileName ? `profile "${profileName}"` : 'default profile';
            const escapedClientName = clientName.replace(/["\\]/g, '\\$&');
            const createScript = `
                tell application "iTerm2"
                    -- Store current frontmost application
                    tell application "System Events"
                        set frontApp to name of first application process whose frontmost is true
                    end tell
                    
                    -- Create window without stealing focus
                    set newWindow to (create window with ${profileClause})
                    tell current session of current tab of newWindow
                        set name to "${escapedClientName}"
                    end tell
                    
                    -- Return focus to previous application
                    tell application "System Events"
                        set frontmost of process frontApp to true
                    end tell
                    
                    return id of newWindow
                end tell
            `;
            
            const { stdout } = await execPromise(`osascript -e '${createScript}'`);
            const windowId = parseInt(stdout.trim());
            clientWindows.set(clientName, windowId);
            return { created: true }; // New window was created
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
            
            // For named windows, just operate on them without activating
            return `tell application "iTerm2" to tell current session of current tab of window id ${windowId} to ${operation}`;
        } else {
            return `tell application "iTerm2" to tell current session of current tab of current window to ${operation}`;
        }
    }
}