import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Get the current short Git commit hash if in a git repository.
 */
export function getGitCommitHash(cwd: string = process.cwd()): string | undefined {
  try {
    const hash = execSync('git rev-parse --short HEAD', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
    return hash || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Check if the given directory is inside a Git repository.
 */
export function isGitRepository(cwd: string = process.cwd()): boolean {
  try {
    const gitDir = path.join(cwd, '.git');
    return fs.existsSync(gitDir);
  } catch {
    return false;
  }
}
