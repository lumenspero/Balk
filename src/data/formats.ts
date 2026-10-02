import type { ArtifactFormat } from '../types.js';
import { normalizePath } from '../graph.js';
import type { ConnectionGraph } from '../graph.js';

/**
 * Mapping of file extensions to ArtifactFormat.
 */
const EXTENSION_FORMAT_MAP: Record<string, ArtifactFormat> = {
  '.json': 'json',
  '.jsonl': 'jsonl',
  '.ndjson': 'jsonl',
  '.csv': 'csv',
  '.tsv': 'tsv',
  '.parquet': 'parquet',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  '.sqlite': 'sqlite',
  '.sqlite3': 'sqlite',
  '.db': 'sqlite',
};

/**
 * Supported data file extensions.
 */
export const SUPPORTED_DATA_EXTENSIONS: readonly string[] = Object.keys(EXTENSION_FORMAT_MAP);

/**
 * Detect the ArtifactFormat of a file path based on its extension.
 */
export function detectArtifactFormat(filePath: string): ArtifactFormat | undefined {
  const norm = normalizePath(filePath).toLowerCase();
  for (const [ext, format] of Object.entries(EXTENSION_FORMAT_MAP)) {
    if (norm.endsWith(ext)) {
      return format;
    }
  }
  return undefined;
}

/**
 * Check if a file path is a recognized data artifact.
 */
export function isDataArtifact(filePath: string): boolean {
  return detectArtifactFormat(filePath) !== undefined;
}

/**
 * Scan a list of file paths and add all recognized data artifacts as ArtifactNodes to the graph.
 */
export function registerDataArtifacts(
  filePaths: readonly string[],
  graph: ConnectionGraph,
): string[] {
  const registered: string[] = [];
  for (const path of filePaths) {
    const format = detectArtifactFormat(path);
    if (format) {
      const norm = normalizePath(path);
      graph.addArtifact(norm, format);
      registered.push(norm);
    }
  }
  return registered;
}
