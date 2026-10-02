import type {
  FileNode,
  SymbolNode,
  SymbolType,
  ArtifactNode,
  ArtifactFormat,
  Relationship,
  RelationshipType,
  Confidence,
  ConnectionMap,
  RepositoryMetadata,
} from './types.js';

/**
 * Mutable graph builder for constructing a ConnectionMap.
 *
 * Usage:
 *   const graph = new ConnectionGraph();
 *   graph.addFile('src/main.ts', 'typescript');
 *   graph.addRelationship('imports', 'src/main.ts', 'src/util.ts');
 *   const map = graph.build(metadata);
 */
export class ConnectionGraph {
  private readonly files = new Map<string, FileNode>();
  private readonly symbols = new Map<string, SymbolNode>();
  private readonly artifacts = new Map<string, ArtifactNode>();
  private readonly relationships: Relationship[] = [];

  /**
   * Add a code file node to the graph.
   * If a file with the same path already exists, it is replaced.
   */
  addFile(path: string, language?: string): FileNode {
    const normalized = normalizePath(path);
    const node: FileNode = { kind: 'file', path: normalized, ...(language ? { language } : {}) };
    this.files.set(normalized, node);
    return node;
  }

  /**
   * Add a code symbol node to the graph.
   * The symbol id is constructed as "filePath:symbolName".
   */
  addSymbol(filePath: string, name: string, symbolType: SymbolType): SymbolNode {
    const normalizedPath = normalizePath(filePath);
    const id = `${normalizedPath}:${name}`;
    const node: SymbolNode = { kind: 'symbol', id, filePath: normalizedPath, name, symbolType };
    this.symbols.set(id, node);
    return node;
  }

  /**
   * Add a data artifact node to the graph.
   */
  addArtifact(path: string, format: ArtifactFormat): ArtifactNode {
    const normalized = normalizePath(path);
    const node: ArtifactNode = { kind: 'artifact', path: normalized, format };
    this.artifacts.set(normalized, node);
    return node;
  }

  /**
   * Add a typed relationship to the graph.
   * The from/to identifiers are normalized.
   */
  addRelationship(
    type: RelationshipType,
    from: string,
    to: string,
    confidence: Confidence = 'high',
  ): Relationship {
    const rel: Relationship = {
      type,
      from: normalizePath(from),
      to: normalizePath(to),
      confidence,
    };
    this.relationships.push(rel);
    return rel;
  }

  /** Returns true if a file node exists for the given path. */
  hasFile(path: string): boolean {
    return this.files.has(normalizePath(path));
  }

  /** Returns true if a symbol node exists for the given id. */
  hasSymbol(id: string): boolean {
    return this.symbols.has(id);
  }

  /** Returns true if an artifact node exists for the given path. */
  hasArtifact(path: string): boolean {
    return this.artifacts.has(normalizePath(path));
  }

  /** Returns the file node for the given path, or undefined. */
  getFile(path: string): FileNode | undefined {
    return this.files.get(normalizePath(path));
  }

  /** Returns the symbol node for the given id, or undefined. */
  getSymbol(id: string): SymbolNode | undefined {
    return this.symbols.get(id);
  }

  /** Returns the artifact node for the given path, or undefined. */
  getArtifact(path: string): ArtifactNode | undefined {
    return this.artifacts.get(normalizePath(path));
  }

  /** Returns all relationships, optionally filtered by a node identifier. */
  getRelationships(nodeId?: string): readonly Relationship[] {
    if (!nodeId) return this.relationships;
    const normalized = normalizePath(nodeId);
    return this.relationships.filter((r) => r.from === normalized || r.to === normalized);
  }

  /** Returns the count of all nodes in the graph. */
  get nodeCount(): number {
    return this.files.size + this.symbols.size + this.artifacts.size;
  }

  /** Returns the count of all relationships in the graph. */
  get relationshipCount(): number {
    return this.relationships.length;
  }

  /**
   * Build the immutable ConnectionMap from the current graph state.
   * Output is deterministic: nodes are sorted by key, relationships
   * are sorted by (type, from, to).
   */
  build(metadata: RepositoryMetadata): ConnectionMap {
    return {
      version: 1,
      repository: metadata,
      files: sortedRecord(this.files),
      symbols: sortedRecord(this.symbols),
      artifacts: sortedRecord(this.artifacts),
      relationships: [...this.relationships].sort(compareRelationships),
    };
  }
}

// ── Helpers ─────────────────────────────────────────────────

/** Normalize a path to forward slashes and remove leading ./ */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

/** Sort a Map's entries by key and return a plain object. */
function sortedRecord<T>(map: Map<string, T>): Record<string, T> {
  const entries = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries) as Record<string, T>;
}

/** Comparator for deterministic relationship ordering. */
function compareRelationships(a: Relationship, b: Relationship): number {
  return a.type.localeCompare(b.type) || a.from.localeCompare(b.from) || a.to.localeCompare(b.to);
}
