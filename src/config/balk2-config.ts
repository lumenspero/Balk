import * as fs from 'fs';
import * as path from 'path';

export interface DataLineageEntry {
  /** Source code script/file that produces data output */
  readonly producer?: string;
  /** Source code component/file that consumes data input */
  readonly consumer?: string;
  /** Input data artifact path or array of paths */
  readonly input?: string | readonly string[];
  /** Output data artifact path or array of paths */
  readonly output?: string | readonly string[];
}

export interface DataConfig {
  /** Custom data file extensions to recognize (e.g. ['.json', '.parquet']) */
  readonly extensions?: readonly string[];
  /** Explicit data lineage rules */
  readonly lineage?: readonly DataLineageEntry[];
}

export interface Balk2Config {
  /** Glob or path patterns of files to include */
  readonly include?: readonly string[];
  /** Glob or path patterns of files to exclude */
  readonly exclude?: readonly string[];
  /** Output directory or base file path */
  readonly output?: string;
  /** Data artifact configuration */
  readonly data?: DataConfig;
}

/**
 * Load and parse .balk2.json configuration file if present.
 */
export function loadBalk2Config(
  cwd: string = process.cwd(),
  customPath?: string,
): Balk2Config | undefined {
  const configPath = customPath
    ? path.resolve(cwd, customPath)
    : path.join(path.resolve(cwd), '.balk2.json');

  if (!fs.existsSync(configPath)) {
    return undefined;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Balk2Config;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
