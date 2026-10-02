/**
 * Balk — Repository Connection Map
 *
 * Generate compact, deterministic connection maps designed
 * for AI-assisted interconnected code changes.
 */

export type {
  NodeKind,
  FileNode,
  SymbolNode,
  SymbolType,
  ArtifactNode,
  ArtifactFormat,
  GraphNode,
  CodeRelationship,
  DataRelationship,
  RelationshipType,
  Confidence,
  Relationship,
  RepositoryMetadata,
  ConnectionMap,
} from './types.js';

export { ConnectionGraph, normalizePath } from './graph.js';
export { serializeConnectionMap, deserializeConnectionMap } from './serialize.js';
export type { Analyzer, AnalyzerOptions } from './analyzer/index.js';
export { JsTsAnalyzer, PythonAnalyzer, resolveImportPath } from './analyzer/index.js';

export {
  SUPPORTED_DATA_EXTENSIONS,
  detectArtifactFormat,
  isDataArtifact,
  registerDataArtifacts,
  inferDataRelationshipType,
  addDataRelationship,
  type DataReference,
} from './data/index.js';

export {
  renderMarkdown,
  findConnectionPaths,
  type MarkdownOptions,
  type PathFinderOptions,
  type FormattedPath,
} from './renderer/index.js';

export {
  generateConnectionMap,
  installGitHook,
  uninstallGitHook,
  checkConnectionMap,
  getGitCommitHash,
  isGitRepository,
  type GenerateOptions,
  type GenerateResult,
  type HookResult,
  type CheckOptions,
  type CheckResult,
} from './cli/index.js';

export {
  loadBalkConfig,
  applyExplicitLineage,
  filterFilesWithConfig,
  matchPattern,
  type BalkConfig,
  type DataConfig,
  type DataLineageEntry,
} from './config/index.js';
