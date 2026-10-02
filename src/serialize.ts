import type { ConnectionMap } from './types.js';

/**
 * Serialize a ConnectionMap to a deterministic JSON string.
 * Uses 2-space indentation for readability.
 */
export function serializeConnectionMap(map: ConnectionMap): string {
  return JSON.stringify(map, null, 2) + '\n';
}

/**
 * Deserialize a JSON string to a ConnectionMap.
 * Performs basic structural validation.
 */
export function deserializeConnectionMap(json: string): ConnectionMap {
  const parsed: unknown = JSON.parse(json);

  if (!isObject(parsed)) {
    throw new Error('Invalid connection map: expected an object');
  }

  const obj = parsed as Record<string, unknown>;

  if (obj['version'] !== 1) {
    throw new Error(`Unsupported connection map version: ${String(obj['version'])}`);
  }

  if (!isObject(obj['repository'])) {
    throw new Error('Invalid connection map: missing repository metadata');
  }

  if (!isObject(obj['files'])) {
    throw new Error('Invalid connection map: missing files');
  }

  if (!isObject(obj['symbols'])) {
    throw new Error('Invalid connection map: missing symbols');
  }

  if (!isObject(obj['artifacts'])) {
    throw new Error('Invalid connection map: missing artifacts');
  }

  if (!Array.isArray(obj['relationships'])) {
    throw new Error('Invalid connection map: missing relationships');
  }

  return parsed as unknown as ConnectionMap;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
