import * as fs from 'fs';
import * as path from 'path';
import { ConnectionGraph, normalizePath } from '../graph.js';
import { serializeConnectionMap } from '../serialize.js';
import { renderMarkdown } from '../renderer/markdown-renderer.js';
import { JsTsAnalyzer } from '../analyzer/js-ts-analyzer.js';
import { registerDataArtifacts } from '../data/formats.js';
import { getGitCommitHash } from './git-utils.js';
import { loadBalkConfig, filterFilesWithConfig, applyExplicitLineage } from '../config/index.js';
import type { ConnectionMap } from '../types.js';

export interface GenerateOptions {
  /** Target root directory to analyze (default: process.cwd()) */
  readonly cwd?: string;
  /** Output directory or base file path (default: "connection-map") */
  readonly output?: string;
  /** Custom timestamp string for testing */
  readonly timestamp?: string;
}

export interface GenerateResult {
  readonly jsonPath: string;
  readonly mdPath: string;
  readonly map: ConnectionMap;
}

const DEFAULT_EXCLUDES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.github',
  '.idea',
  '.vscode',
  'connection-map.json',
  'connection-map.md',
]);

/**
 * Scan a repository, construct the ConnectionGraph, and generate connection-map.json & connection-map.md.
 */
export function generateConnectionMap(options: GenerateOptions = {}): GenerateResult {
  const rootDir = path.resolve(options.cwd ?? process.cwd());
  const balkConfig = loadBalkConfig(rootDir);
  const jsTsAnalyzer = new JsTsAnalyzer();
  const graph = new ConnectionGraph();

  // 1. Scan directory for repository files & apply config filters
  const rawFiles = scanFiles(rootDir);
  const allRelativeFiles = filterFilesWithConfig(
    rawFiles,
    balkConfig?.include,
    balkConfig?.exclude,
  );

  // 2. Register data artifacts
  registerDataArtifacts(allRelativeFiles, graph);

  // 3. Apply explicit data lineage rules from .balk.json
  if (balkConfig?.data?.lineage) {
    applyExplicitLineage(balkConfig.data.lineage, graph);
  }

  // 4. Analyze code files
  for (const relFile of allRelativeFiles) {
    if (jsTsAnalyzer.canAnalyze(relFile)) {
      const fullPath = path.join(rootDir, relFile);
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        jsTsAnalyzer.analyzeFile(relFile, content, graph, {
          rootDir,
          knownFiles: allRelativeFiles,
        });
      } catch {
        // Skip unreadable files gracefully
      }
    }
  }

  // 5. Build connection map
  const commit = getGitCommitHash(rootDir);
  const generatedAt = options.timestamp ?? new Date().toISOString();

  const map = graph.build({
    ...(commit ? { commit } : {}),
    generatedAt,
  });

  // 6. Determine output file paths
  const outputTarget = options.output ?? balkConfig?.output;
  const { jsonPath, mdPath } = resolveOutputPaths(rootDir, outputTarget);

  // Ensure output directory exists
  const jsonDir = path.dirname(jsonPath);
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  // 6. Serialize and write artifacts
  const jsonContent = serializeConnectionMap(map);
  const mdContent = renderMarkdown(map);

  fs.writeFileSync(jsonPath, jsonContent, 'utf8');
  fs.writeFileSync(mdPath, mdContent, 'utf8');

  return { jsonPath, mdPath, map };
}

// ── Helpers ─────────────────────────────────────────────────────────

function scanFiles(dir: string, baseDir: string = dir): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (DEFAULT_EXCLUDES.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = normalizePath(path.relative(baseDir, fullPath));

    if (entry.isDirectory()) {
      results.push(...scanFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push(relPath);
    }
  }

  return results.sort();
}

function resolveOutputPaths(
  rootDir: string,
  outputOption?: string,
): { jsonPath: string; mdPath: string } {
  if (!outputOption) {
    return {
      jsonPath: path.join(rootDir, 'connection-map.json'),
      mdPath: path.join(rootDir, 'connection-map.md'),
    };
  }

  const resolved = path.resolve(rootDir, outputOption);

  if (resolved.endsWith('.json')) {
    const basePath = resolved.slice(0, -5);
    return { jsonPath: resolved, mdPath: `${basePath}.md` };
  }

  if (resolved.endsWith('.md')) {
    const basePath = resolved.slice(0, -3);
    return { jsonPath: `${basePath}.json`, mdPath: resolved };
  }

  // Treat as directory or base name prefix
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    return {
      jsonPath: path.join(resolved, 'connection-map.json'),
      mdPath: path.join(resolved, 'connection-map.md'),
    };
  }

  // Check if target directory exists or parent exists
  if (path.extname(resolved) === '') {
    return {
      jsonPath: path.join(resolved, 'connection-map.json'),
      mdPath: path.join(resolved, 'connection-map.md'),
    };
  }

  return {
    jsonPath: path.join(rootDir, 'connection-map.json'),
    mdPath: path.join(rootDir, 'connection-map.md'),
  };
}
