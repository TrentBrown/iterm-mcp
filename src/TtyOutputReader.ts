import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { WindowManager } from './WindowManager.js';

const execPromise = promisify(exec);

export default class TtyOutputReader {
  private _agentName?: string;
  private _profileName?: string;

  constructor(agentName?: string, profileName?: string) {
    this._agentName = agentName;
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
    // Ensure window exists if agentName is specified
    if (this._agentName) {
      await WindowManager.ensureWindowExists(this._agentName, this._profileName);
    }
    
    const ascript = WindowManager.buildAppleScriptForSession(
      this._agentName, 
      'get contents'
    );
    
    const { stdout: finalContent } = await execPromise(`osascript -e '${ascript}'`);
    return finalContent.trim();
  }
}