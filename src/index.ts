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
