import * as fs from 'fs';
import * as path from 'path';
import { deserializeConnectionMap, serializeConnectionMap } from '../serialize.js';
import { ConnectionGraph } from '../graph.js';
import { JsTsAnalyzer, PythonAnalyzer, type Analyzer } from '../analyzer/index.js';
import { registerDataArtifacts } from '../data/formats.js';
import { normalizePath } from '../graph.js';
import { loadBalkConfig, filterFilesWithConfig, applyExplicitLineage } from '../config/index.js';

export interface CheckOptions {
  readonly cwd?: string;
  readonly output?: string;
}

export interface CheckResult {
  readonly isCurrent: boolean;
  readonly message: string;
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
 * Validate configuration and check whether the generated connection map is current.
 */
export function checkConnectionMap(options: CheckOptions = {}): CheckResult {
  const rootDir = path.resolve(options.cwd ?? process.cwd());
  const balkConfig = loadBalkConfig(rootDir);
  const jsonPath = path.join(rootDir, 'connection-map.json');

  if (!fs.existsSync(jsonPath)) {
    return {
      isCurrent: false,
      message: 'connection-map.json does not exist. Run "balk" to generate.',
    };
  }

  try {
    const existingContent = fs.readFileSync(jsonPath, 'utf8');
    const existingMap = deserializeConnectionMap(existingContent);

    // Build fresh graph
    const analyzers: Analyzer[] = [new JsTsAnalyzer(), new PythonAnalyzer()];
    const graph = new ConnectionGraph();
    const rawFiles = scanFiles(rootDir);
    const allFiles = filterFilesWithConfig(rawFiles, balkConfig?.include, balkConfig?.exclude);

    registerDataArtifacts(allFiles, graph);

    if (balkConfig?.data?.lineage) {
      applyExplicitLineage(balkConfig.data.lineage, graph);
    }

    for (const relFile of allFiles) {
      for (const analyzer of analyzers) {
        if (analyzer.canAnalyze(relFile)) {
          try {
            const content = fs.readFileSync(path.join(rootDir, relFile), 'utf8');
            analyzer.analyzeFile(relFile, content, graph, { knownFiles: allFiles });
          } catch {
            // ignore
          }
        }
      }
    }

    const freshMap = graph.build({
      commit: existingMap.repository.commit,
      generatedAt: existingMap.repository.generatedAt,
    });

    const freshJson = serializeConnectionMap(freshMap);

    if (existingContent.trim() === freshJson.trim()) {
      return {
        isCurrent: true,
        message: 'connection-map.json is current with repository state.',
      };
    } else {
      return {
        isCurrent: false,
        message: 'connection-map.json is out of date. Run "balk" to regenerate.',
      };
    }
  } catch (err) {
    return {
      isCurrent: false,
      message: `Failed to read or parse existing connection map: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

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
