/**
 * In-Memory DynamoDB-compatible adapter.
 *
 * Drop-in replacement for DynamoDBDocumentClient when DynamoDB Local is not running.
 * Implements: PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand.
 *
 * All existing services import `dynamoDb` from `../config/db` and call `dynamoDb.send(command)`.
 * This adapter matches that exact interface so zero service changes are needed.
 */

import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

// ─── In-Memory Store ────────────────────────────────────────────────────────

type Item = Record<string, any>;

// Store: TableName → array of items
const tables: Map<string, Item[]> = new Map();

function getTable(tableName: string): Item[] {
  if (!tables.has(tableName)) {
    tables.set(tableName, []);
  }
  return tables.get(tableName)!;
}

// ─── Expression Parser (supports basic DynamoDB expressions) ────────────────

function evaluateCondition(
  item: Item,
  expression: string,
  attrValues: Record<string, any> = {},
  attrNames: Record<string, string> = {}
): boolean {
  if (!expression) return true;

  // Resolve attribute name aliases
  let expr = expression;
  for (const [alias, name] of Object.entries(attrNames)) {
    expr = expr.replace(new RegExp(alias.replace('#', '\\#'), 'g'), name);
  }

  // Split on AND
  const conditions = expr.split(/\s+AND\s+/i);

  return conditions.every((cond) => {
    cond = cond.trim();

    // begins_with(field, :val)
    const beginsWith = cond.match(/begins_with\s*\(\s*(\w+)\s*,\s*(:\w+)\s*\)/);
    if (beginsWith) {
      const field = beginsWith[1];
      const val = attrValues[beginsWith[2]];
      return typeof item[field] === 'string' && item[field].startsWith(val);
    }

    // contains(field, :val)
    const containsMatch = cond.match(/contains\s*\(\s*(\w+)\s*,\s*(:\w+)\s*\)/);
    if (containsMatch) {
      const field = containsMatch[1];
      const val = attrValues[containsMatch[2]];
      const fieldVal = item[field];
      if (Array.isArray(fieldVal)) return fieldVal.includes(val);
      if (typeof fieldVal === 'string') return fieldVal.includes(val);
      return false;
    }

    // attribute_exists(field)
    const attrExists = cond.match(/attribute_exists\s*\(\s*(\w+)\s*\)/);
    if (attrExists) {
      return item[attrExists[1]] !== undefined;
    }

    // attribute_not_exists(field)
    const attrNotExists = cond.match(/attribute_not_exists\s*\(\s*(\w+)\s*\)/);
    if (attrNotExists) {
      return item[attrNotExists[1]] === undefined;
    }

    // field = :val
    const eq = cond.match(/(\w+)\s*=\s*(:\w+)/);
    if (eq) {
      return item[eq[1]] === attrValues[eq[2]];
    }

    // field <> :val
    const neq = cond.match(/(\w+)\s*<>\s*(:\w+)/);
    if (neq) {
      return item[neq[1]] !== attrValues[neq[2]];
    }

    // field < :val
    const lt = cond.match(/(\w+)\s*<\s*(:\w+)/);
    if (lt) {
      return item[lt[1]] < attrValues[lt[2]];
    }

    // field > :val
    const gt = cond.match(/(\w+)\s*>\s*(:\w+)/);
    if (gt) {
      return item[gt[1]] > attrValues[gt[2]];
    }

    return true; // unknown conditions pass
  });
}

function applyUpdateExpression(
  item: Item,
  updateExpr: string,
  attrValues: Record<string, any> = {},
  attrNames: Record<string, string> = {}
): Item {
  const updated = { ...item };

  // Resolve attribute names
  let expr = updateExpr;
  for (const [alias, name] of Object.entries(attrNames)) {
    expr = expr.replace(new RegExp(alias.replace('#', '\\#'), 'g'), name);
  }

  // Parse SET clauses
  const setMatch = expr.match(/SET\s+(.+?)(?:\s+REMOVE|\s+ADD|\s+DELETE|$)/i);
  if (setMatch) {
    const setClauses = setMatch[1].split(/,\s*/);
    for (const clause of setClauses) {
      const trimmed = clause.trim();

      // field = field + :val (increment)
      const addMatch = trimmed.match(/(\w+)\s*=\s*(\w+)\s*\+\s*(:\w+)/);
      if (addMatch) {
        const [, field, source, valRef] = addMatch;
        updated[field] = (updated[source] || 0) + (attrValues[valRef] || 0);
        continue;
      }

      // field = field - :val (decrement)
      const subMatch = trimmed.match(/(\w+)\s*=\s*(\w+)\s*-\s*(:\w+)/);
      if (subMatch) {
        const [, field, source, valRef] = subMatch;
        updated[field] = (updated[source] || 0) - (attrValues[valRef] || 0);
        continue;
      }

      // field = :val (simple set)
      const simpleSet = trimmed.match(/(\w+)\s*=\s*(:\w+)/);
      if (simpleSet) {
        updated[simpleSet[1]] = attrValues[simpleSet[2]];
        continue;
      }
    }
  }

  // Parse REMOVE clauses
  const removeMatch = expr.match(/REMOVE\s+(.+?)(?:\s+SET|\s+ADD|\s+DELETE|$)/i);
  if (removeMatch) {
    const removeFields = removeMatch[1].split(/,\s*/);
    for (const field of removeFields) {
      delete updated[field.trim()];
    }
  }

  // Parse ADD clauses (for sets/numbers)
  const addClauseMatch = expr.match(/ADD\s+(.+?)(?:\s+SET|\s+REMOVE|\s+DELETE|$)/i);
  if (addClauseMatch) {
    const addClauses = addClauseMatch[1].split(/,\s*/);
    for (const clause of addClauses) {
      const parts = clause.trim().match(/(\w+)\s+(:\w+)/);
      if (parts) {
        const val = attrValues[parts[2]];
        if (typeof val === 'number') {
          updated[parts[1]] = (updated[parts[1]] || 0) + val;
        }
      }
    }
  }

  return updated;
}

// ─── Memory DynamoDB Client ────────────────────────────────────────────────

export class MemoryDynamoClient {
  async send(command: any): Promise<any> {
    if (command instanceof PutCommand) return this.handlePut(command);
    if (command instanceof GetCommand) return this.handleGet(command);
    if (command instanceof QueryCommand) return this.handleQuery(command);
    if (command instanceof UpdateCommand) return this.handleUpdate(command);
    if (command instanceof DeleteCommand) return this.handleDelete(command);
    if (command instanceof ScanCommand) return this.handleScan(command);

    // Fallback for unknown commands
    console.warn('[MemoryDB] Unknown command type:', command.constructor.name);
    return { Items: [], Item: undefined };
  }

  private handlePut(cmd: PutCommand): any {
    const input = cmd.input;
    const table = getTable(input.TableName!);
    const item = input.Item as Item;

    // Check ConditionExpression (e.g., attribute_not_exists)
    if (input.ConditionExpression) {
      const existing = table.find((i) => i.PK === item.PK && i.SK === item.SK);
      if (existing) {
        const attrValues = (input.ExpressionAttributeValues || {}) as Record<string, any>;
        const attrNames = (input.ExpressionAttributeNames || {}) as Record<string, string>;
        const passes = evaluateCondition(existing, input.ConditionExpression, attrValues, attrNames);
        if (!passes) {
          const err: any = new Error('ConditionalCheckFailedException');
          err.name = 'ConditionalCheckFailedException';
          throw err;
        }
      }
    }

    // Upsert: replace if PK+SK match
    const idx = table.findIndex(
      (i) => i.PK === item.PK && i.SK === item.SK
    );
    if (idx >= 0) {
      table[idx] = item;
    } else {
      table.push(item);
    }

    return {};
  }

  private handleGet(cmd: GetCommand): any {
    const input = cmd.input;
    const table = getTable(input.TableName!);
    const key = input.Key as Item;
    const item = table.find(
      (i) => i.PK === key.PK && i.SK === key.SK
    );

    return { Item: item || undefined };
  }

  private handleQuery(cmd: QueryCommand): any {
    const input = cmd.input;
    const table = getTable(input.TableName!);
    const attrValues = (input.ExpressionAttributeValues || {}) as Record<string, any>;
    const attrNames = (input.ExpressionAttributeNames || {}) as Record<string, string>;
    const indexName = input.IndexName;
    const keyExpr = input.KeyConditionExpression || '';
    const filterExpr = input.FilterExpression || '';
    const limit = input.Limit;
    const forward = input.ScanIndexForward !== false;
    const selectCount = input.Select === 'COUNT';

    // Determine which PK/SK fields to use based on index
    let pkField = 'PK';
    let skField = 'SK';
    if (indexName === 'GSI1') {
      pkField = 'GSI1PK';
      skField = 'GSI1SK';
    } else if (indexName === 'GSI2') {
      pkField = 'GSI2PK';
      skField = 'GSI2SK';
    }

    // Resolve attribute names in key expression
    let resolvedExpr = keyExpr;
    for (const [alias, name] of Object.entries(attrNames)) {
      resolvedExpr = resolvedExpr.replace(new RegExp(alias.replace('#', '\\#'), 'g'), name);
    }

    // Parse PK value from expression
    const pkRegex = new RegExp(pkField + '\\s*=\\s*(:\\w+)');
    const pkMatch = resolvedExpr.match(pkRegex);
    const pkValue = pkMatch ? attrValues[pkMatch[1]] : undefined;

    // Parse SK condition
    const skBeginsRegex = new RegExp('begins_with\\s*\\(\\s*' + skField + '\\s*,\\s*(:\\w+)\\s*\\)');
    const skBeginsMatch = resolvedExpr.match(skBeginsRegex);
    const skPrefix = skBeginsMatch ? attrValues[skBeginsMatch[1]] : undefined;

    const skEqualsRegex = new RegExp(skField + '\\s*=\\s*(:\\w+)');
    const skEqualsMatch = !skBeginsMatch ? resolvedExpr.match(skEqualsRegex) : null;
    const skValue = skEqualsMatch ? attrValues[skEqualsMatch[1]] : undefined;

    // Filter items
    let results = table.filter((item) => {
      // PK match
      if (pkValue !== undefined && item[pkField] !== pkValue) return false;

      // SK prefix match
      if (skPrefix !== undefined) {
        if (!item[skField] || !String(item[skField]).startsWith(skPrefix)) return false;
      }

      // SK exact match
      if (skValue !== undefined && item[skField] !== skValue) return false;

      return true;
    });

    // Apply filter expression
    if (filterExpr) {
      results = results.filter((item) =>
        evaluateCondition(item, filterExpr, attrValues, attrNames)
      );
    }

    // Sort by SK
    results.sort((a, b) => {
      const aVal = String(a[skField] || '');
      const bVal = String(b[skField] || '');
      return forward ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    // Limit
    if (limit) {
      results = results.slice(0, limit);
    }

    if (selectCount) {
      return { Count: results.length, Items: [] };
    }

    return { Items: results, Count: results.length };
  }

  private handleUpdate(cmd: UpdateCommand): any {
    const input = cmd.input;
    const table = getTable(input.TableName!);
    const key = input.Key as Item;
    const attrValues = (input.ExpressionAttributeValues || {}) as Record<string, any>;
    const attrNames = (input.ExpressionAttributeNames || {}) as Record<string, string>;

    const idx = table.findIndex(
      (i) => i.PK === key.PK && i.SK === key.SK
    );

    if (idx < 0) {
      // Check ConditionExpression
      if (input.ConditionExpression?.includes('attribute_exists')) {
        const err: any = new Error('ConditionalCheckFailedException');
        err.name = 'ConditionalCheckFailedException';
        throw err;
      }
      // Create new item with key + updates
      const newItem = { ...key };
      const updated = applyUpdateExpression(
        newItem,
        input.UpdateExpression || '',
        attrValues,
        attrNames
      );
      table.push(updated);
      return { Attributes: updated };
    }

    const updated = applyUpdateExpression(
      table[idx],
      input.UpdateExpression || '',
      attrValues,
      attrNames
    );
    table[idx] = updated;

    return { Attributes: updated };
  }

  private handleDelete(cmd: DeleteCommand): any {
    const input = cmd.input;
    const table = getTable(input.TableName!);
    const key = input.Key as Item;

    const idx = table.findIndex(
      (i) => i.PK === key.PK && i.SK === key.SK
    );

    if (idx >= 0) {
      const deleted = table.splice(idx, 1)[0];
      return { Attributes: deleted };
    }

    return {};
  }

  private handleScan(cmd: ScanCommand): any {
    const input = cmd.input;
    const table = getTable(input.TableName!);
    const attrValues = (input.ExpressionAttributeValues || {}) as Record<string, any>;
    const attrNames = (input.ExpressionAttributeNames || {}) as Record<string, string>;
    const filterExpr = input.FilterExpression || '';
    const limit = input.Limit;

    let results = [...table];

    // Apply filter
    if (filterExpr) {
      results = results.filter((item) =>
        evaluateCondition(item, filterExpr, attrValues, attrNames)
      );
    }

    if (limit) {
      results = results.slice(0, limit);
    }

    return { Items: results, Count: results.length };
  }
}

// ─── Seed Helper ────────────────────────────────────────────────────────────

export function seedItems(tableName: string, items: Item[]): void {
  const table = getTable(tableName);
  for (const item of items) {
    const idx = table.findIndex((i) => i.PK === item.PK && i.SK === item.SK);
    if (idx >= 0) {
      table[idx] = item;
    } else {
      table.push(item);
    }
  }
}

export const memoryClient = new MemoryDynamoClient();
