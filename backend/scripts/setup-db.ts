/**
 * setup-db.ts — Local DynamoDB Table Setup for AlumniConnect
 *
 * Creates the Single-Table Design schema with GSI Overloading:
 *   • Base Table: PK (S) + SK (S)
 *   • GSI1:       GSI1PK (S) + GSI1SK (S) — Primary lookups
 *   • GSI2:       GSI2PK (S) + GSI2SK (S) — Inverted lookups
 *
 * Usage:
 *   npx ts-node scripts/setup-db.ts
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  CreateTableCommandInput,
  KeyType,
  ScalarAttributeType,
  ProjectionType,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb';

// ─── Client Config ──────────────────────────────────────────────────────────

const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'dummyAccessKeyId',
    secretAccessKey: 'dummySecretAccessKey',
  },
});

// ─── Table Definition ───────────────────────────────────────────────────────

const TABLE_NAME = 'AlumniConnectData';

const THROUGHPUT = { ReadCapacityUnits: 5, WriteCapacityUnits: 5 };

const tableParams: CreateTableCommandInput = {
  TableName: TABLE_NAME,

  // ── Key Schema ──────────────────────────────────────────────────────────
  KeySchema: [
    { AttributeName: 'PK', KeyType: KeyType.HASH },
    { AttributeName: 'SK', KeyType: KeyType.RANGE },
  ],

  // ── Attribute Definitions ───────────────────────────────────────────────
  // Only attributes used in KeySchema or GSI keys need to be declared here.
  AttributeDefinitions: [
    { AttributeName: 'PK',     AttributeType: ScalarAttributeType.S },
    { AttributeName: 'SK',     AttributeType: ScalarAttributeType.S },
    { AttributeName: 'GSI1PK', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'GSI1SK', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'GSI2PK', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'GSI2SK', AttributeType: ScalarAttributeType.S },
  ],

  // ── Global Secondary Indexes (GSI Overloading) ──────────────────────────
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: KeyType.HASH },
        { AttributeName: 'GSI1SK', KeyType: KeyType.RANGE },
      ],
      Projection: { ProjectionType: ProjectionType.ALL },
      ProvisionedThroughput: THROUGHPUT,
    },
    {
      IndexName: 'GSI2',
      KeySchema: [
        { AttributeName: 'GSI2PK', KeyType: KeyType.HASH },
        { AttributeName: 'GSI2SK', KeyType: KeyType.RANGE },
      ],
      Projection: { ProjectionType: ProjectionType.ALL },
      ProvisionedThroughput: THROUGHPUT,
    },
  ],

  // ── Main Table Throughput ───────────────────────────────────────────────
  ProvisionedThroughput: THROUGHPUT,
};

// ─── Create Table ───────────────────────────────────────────────────────────

async function setupDatabase(): Promise<void> {
  try {
    const result = await client.send(new CreateTableCommand(tableParams));
    console.log(`✅ Table "${TABLE_NAME}" created successfully.`);
    console.log(`   Status : ${result.TableDescription?.TableStatus}`);
    console.log(`   ARN    : ${result.TableDescription?.TableArn}`);
    console.log(`   GSIs   : ${result.TableDescription?.GlobalSecondaryIndexes?.map(g => g.IndexName).join(', ')}`);
  } catch (error: unknown) {
    if (error instanceof ResourceInUseException) {
      console.log(`⚠️  Table "${TABLE_NAME}" already exists — skipping creation.`);
    } else {
      console.error('❌ Failed to create table:', error);
      process.exit(1);
    }
  }
}

setupDatabase();
