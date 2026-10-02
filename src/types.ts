/**
 * Core type definitions for the Balk2 connection map graph model.
 *
 * The graph supports three node types (files, symbols, artifacts)
 * and typed directional relationships between them.
 */

// ── Node Types ──────────────────────────────────────────────

export type NodeKind = 'file' | 'symbol' | 'artifact';

/**
 * A code file node in the graph.
 *
 * Examples: src/main.ts, scripts/build.js
 */
export interface FileNode {
  readonly kind: 'file';
  /** Repository-relative path (forward slashes, e.g. "src/main.ts") */
  readonly path: string;
  /** Detected language, if recognized */
  readonly language?: string;
}

/**
 * A code symbol node in the graph.
 *
 * Examples: src/state/state.ts:updateState, src/sim/sim.ts:step
 */
export interface SymbolNode {
  readonly kind: 'symbol';
  /** Unique identifier: "filePath:symbolName" */
  readonly id: string;
  /** Repository-relative path of the containing file */
  readonly filePath: string;
  /** Symbol name (function, class, method, etc.) */
  readonly name: string;
  /** Symbol type classification */
  readonly symbolType: SymbolType;
}

export type SymbolType = 'function' | 'class' | 'method' | 'type' | 'constant' | 'variable';

/**
 * A data artifact node in the graph.
 *
 * Examples: data/source.json, data/titles.parquet
 */
export interface ArtifactNode {
  readonly kind: 'artifact';
  /** Repository-relative path */
  readonly path: string;
  /** Recognized data format */
  readonly format: ArtifactFormat;
}

export type ArtifactFormat =
  'json' | 'jsonl' | 'csv' | 'tsv' | 'parquet' | 'yaml' | 'toml' | 'xml' | 'sqlite' | 'unknown';

export type GraphNode = FileNode | SymbolNode | ArtifactNode;

// ── Relationship Types ──────────────────────────────────────

/** Code relationships */
export type CodeRelationship =
  | 'imports'
  | 'importedBy'
  | 'calls'
  | 'calledBy'
  | 'extends'
  | 'implements'
  | 'references'
  | 'exports';

/** Data relationships */
export type DataRelationship =
  'generates' | 'generatedBy' | 'consumes' | 'consumedBy' | 'reads' | 'writes' | 'transforms';

export type RelationshipType = CodeRelationship | DataRelationship;

export type Confidence = 'high' | 'medium' | 'low';

/**
 * A typed, directional relationship between two graph nodes.
 */
export interface Relationship {
  /** The relationship type */
  readonly type: RelationshipType;
  /** The source node identifier (file path, symbol id, or artifact path) */
  readonly from: string;
  /** The target node identifier */
  readonly to: string;
  /** Confidence level of this relationship */
  readonly confidence: Confidence;
}

// ── Connection Map Schema ───────────────────────────────────

/**
 * Repository metadata included in the connection map.
 */
export interface RepositoryMetadata {
  /** Short commit hash, if available */
  readonly commit?: string;
  /** ISO 8601 timestamp of generation */
  readonly generatedAt: string;
}

/**
 * The canonical connection map — the complete graph representation.
 * Serialized directly to connection-map.json.
 */
export interface ConnectionMap {
  /** Schema version */
  readonly version: 1;
  /** Repository metadata */
  readonly repository: RepositoryMetadata;
  /** File nodes keyed by path */
  readonly files: Record<string, FileNode>;
  /** Symbol nodes keyed by id */
  readonly symbols: Record<string, SymbolNode>;
  /** Artifact nodes keyed by path */
  readonly artifacts: Record<string, ArtifactNode>;
  /** All relationships in the graph */
  readonly relationships: Relationship[];
}
