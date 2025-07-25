import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { WindowManager } from './WindowManager.js';

const execPromise = promisify(exec);

class SendControlCharacter {
  private _agentName?: string;
  private _profileName?: string;

  constructor(agentName?: string, profileName?: string) {
    this._agentName = agentName;
    this._profileName = profileName;
  }

  // This method is added for testing purposes
  protected async executeCommand(command: string): Promise<void> {
    await execPromise(command);
  }

  async send(letter: string): Promise<void> {
    // Ensure window exists if agentName is specified
    if (this._agentName) {
      await WindowManager.ensureWindowExists(this._agentName, this._profileName);
    }
    
    let controlCode: number;
    
    // Handle special cases for telnet escape sequences
    if (letter.toUpperCase() === ']') {
      // ASCII 29 (GS - Group Separator) - the telnet escape character
      controlCode = 29;
    } 
    // Add other special cases here as needed
    else if (letter.toUpperCase() === 'ESCAPE' || letter.toUpperCase() === 'ESC') {
      // ASCII 27 (ESC - Escape)
      controlCode = 27;
    }
    else {
      // Validate input for standard control characters
      letter = letter.toUpperCase();
      if (!/^[A-Z]$/.test(letter)) {
        throw new Error('Invalid control character letter');
      }
      
      // Convert to standard control code (A=1, B=2, etc.)
      controlCode = letter.charCodeAt(0) - 64;
    }

    // AppleScript to send the control character
    const ascript = WindowManager.buildAppleScriptForSession(
      this._agentName,
      `write text (ASCII character ${controlCode})`
    );

    try {
      await this.executeCommand(`osascript -e '${ascript}'`);
    } catch (error: unknown) {
      throw new Error(`Failed to send control character: ${(error as Error).message}`);
    }
  }
}

export default SendControlCharacter;