import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { WindowManager } from './WindowManager.js';

const execPromise = promisify(exec);

export default class TtyOutputReader {
  private _clientName?: string;
  private _profileName?: string;

  constructor(clientName?: string, profileName?: string) {
    this._clientName = clientName;
    this._profileName = profileName;
  }

  async call(linesOfOutput?: number) {
    const buffer = await this.retrieveBuffer();
    if (!linesOfOutput) {
      return buffer;
    }
    const lines = buffer.split('\n');
    return lines.slice(-linesOfOutput - 1).join('\n');
  }

  async retrieveBuffer(): Promise<string> {
    // Ensure window exists if clientName is specified
    if (this._clientName) {
      await WindowManager.ensureWindowExists(this._clientName, this._profileName);
    }
    
    const ascript = WindowManager.buildAppleScriptForSession(
      this._clientName, 
      'get contents'
    );
    
    const { stdout: finalContent } = await execPromise(`osascript -e '${ascript}'`);
    return finalContent.trim();
  }
}