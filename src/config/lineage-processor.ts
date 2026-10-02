import type { ConnectionGraph } from '../graph.js';
import type { DataLineageEntry } from './balk-config.js';
import { addDataRelationship } from '../data/data-analyzer.js';

/**
 * Apply explicit data lineage rules from .balk.json configuration to the ConnectionGraph.
 */
export function applyExplicitLineage(
  lineageRules: readonly DataLineageEntry[],
  graph: ConnectionGraph,
): void {
  for (const entry of lineageRules) {
    // 1. Producer output (producer -> generates -> output)
    if (entry.producer && entry.output) {
      const outputs = toArray(entry.output);
      for (const out of outputs) {
        addDataRelationship(entry.producer, out, 'generates', graph, 'high');
      }
    }

    // 2. Producer input (producer -> consumes -> input)
    if (entry.producer && entry.input) {
      const inputs = toArray(entry.input);
      for (const inp of inputs) {
        addDataRelationship(entry.producer, inp, 'consumes', graph, 'high');
      }
    }

    // 3. Consumer input (consumer -> consumes -> input)
    if (entry.consumer && entry.input) {
      const inputs = toArray(entry.input);
      for (const inp of inputs) {
        addDataRelationship(entry.consumer, inp, 'consumes', graph, 'high');
      }
    }

    // 4. Consumer output (consumer -> generates -> output)
    if (entry.consumer && entry.output) {
      const outputs = toArray(entry.output);
      for (const out of outputs) {
        addDataRelationship(entry.consumer, out, 'generates', graph, 'high');
      }
    }
  }
}

function toArray(val: string | readonly string[]): readonly string[] {
  if (Array.isArray(val)) return val;
  return [val as string];
}
