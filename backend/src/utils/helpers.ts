import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID (UUID v4).
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Returns current ISO 8601 timestamp string.
 */
export function isoNow(): string {
  return new Date().toISOString();
}

/**
 * Build a composite DynamoDB key segment.
 * Example: buildKey('USER', '123') => 'USER#123'
 */
export function buildKey(prefix: string, value: string): string {
  return `${prefix}#${value}`;
}

/**
 * Sort two user IDs alphabetically for deterministic connection keys.
 * Ensures USER#A → CONN#B is always stored the same way regardless of who sends.
 */
export function sortedUserPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Picks defined (non-undefined) properties from an object.
 */
export function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/** DynamoDB table name constant */
export const TABLE_NAME = 'AlumniConnectData';
