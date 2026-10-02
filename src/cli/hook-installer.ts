import * as fs from 'fs';
import * as path from 'path';
import { isGitRepository } from './git-utils.js';

const HOOK_START_MARKER = '# BEGIN BALK-GIT-HOOK';
const HOOK_END_MARKER = '# END BALK-GIT-HOOK';

const HOOK_CONTENT = `${HOOK_START_MARKER}
# Automatically regenerate connection map before commit
npx balk

if [ -f "connection-map.json" ] && [ -f "connection-map.md" ]; then
  git add connection-map.json connection-map.md 2>/dev/null || true
fi
${HOOK_END_MARKER}
`;

const STANDALONE_HOOK = `#!/bin/sh
${HOOK_CONTENT}`;

export interface HookResult {
  readonly success: boolean;
  readonly message: string;
  readonly hookPath?: string;
}

/**
 * Install the pre-commit git hook to automatically update connection map before commit.
 */
export function installGitHook(cwd: string = process.cwd()): HookResult {
  if (!isGitRepository(cwd)) {
    return {
      success: false,
      message: 'Not inside a Git repository (.git directory not found)',
    };
  }

  const hooksDir = path.join(cwd, '.git', 'hooks');
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const hookPath = path.join(hooksDir, 'pre-commit');

  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, 'utf8');
    if (existing.includes(HOOK_START_MARKER)) {
      return {
        success: true,
        message: 'Balk Git hook is already installed',
        hookPath,
      };
    }
    // Append to existing pre-commit hook
    fs.appendFileSync(hookPath, `\n${HOOK_CONTENT}`, 'utf8');
  } else {
    fs.writeFileSync(hookPath, STANDALONE_HOOK, { encoding: 'utf8', mode: 0o755 });
  }

  return {
    success: true,
    message: `Installed pre-commit Git hook at ${hookPath}`,
    hookPath,
  };
}

/**
 * Uninstall the pre-commit git hook.
 */
export function uninstallGitHook(cwd: string = process.cwd()): HookResult {
  if (!isGitRepository(cwd)) {
    return {
      success: false,
      message: 'Not inside a Git repository (.git directory not found)',
    };
  }

  const hookPath = path.join(cwd, '.git', 'hooks', 'pre-commit');
  if (!fs.existsSync(hookPath)) {
    return {
      success: true,
      message: 'No pre-commit Git hook found to uninstall',
      hookPath,
    };
  }

  const existing = fs.readFileSync(hookPath, 'utf8');
  if (!existing.includes(HOOK_START_MARKER)) {
    return {
      success: true,
      message: 'Pre-commit Git hook does not contain Balk hook',
      hookPath,
    };
  }

  const lines = existing.replace(/\r\n/g, '\n').split('\n');
  const remaining: string[] = [];
  let inBalkBlock = false;

  for (const line of lines) {
    if (line.includes(HOOK_START_MARKER)) {
      inBalkBlock = true;
      continue;
    }
    if (line.includes(HOOK_END_MARKER)) {
      inBalkBlock = false;
      continue;
    }
    if (!inBalkBlock) {
      remaining.push(line);
    }
  }

  const cleaned = remaining.join('\n').trim();

  if (cleaned.length === 0 || cleaned === '#!/bin/sh') {
    fs.unlinkSync(hookPath);
  } else {
    fs.writeFileSync(hookPath, cleaned, 'utf8');
  }

  return {
    success: true,
    message: `Uninstalled Balk Git hook from ${hookPath}`,
    hookPath,
  };
}
