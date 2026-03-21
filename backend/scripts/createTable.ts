/**
 * DynamoDB Local Table Bootstrap Script
 *
 * Creates the `AlumniConnectData` table with:
 *   - PK / SK (Base Table)
 *   - GSI1 (GSI1PK / GSI1SK) — Primary lookups (by owner, by collection)
 *   - GSI2 (GSI2PK / GSI2SK) — Inverted lookups (global feed, student-side views)
 *
 * Uses GSI Overloading: both indexes are generic and shared by all entity types.
 *
 * Usage:
 *   1. Start DynamoDB Local: docker-compose up -d
 *   2. Run: npx ts-node scripts/createTable.ts
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  DeleteTableCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const TABLE_NAME = 'AlumniConnectData';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMO_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeAccessKeyId',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function deleteTableIfExists(): Promise<void> {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`⚠️  Table '${TABLE_NAME}' exists. Deleting...`);
    await client.send(new DeleteTableCommand({ TableName: TABLE_NAME }));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`✅ Table deleted.`);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`ℹ️  Table '${TABLE_NAME}' does not exist. Creating fresh.`);
    } else {
      throw error;
    }
  }
}

async function createTable(): Promise<void> {
  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' },
        { AttributeName: 'GSI2PK', AttributeType: 'S' },
        { AttributeName: 'GSI2SK', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10,
          },
        },
        {
          IndexName: 'GSI2',
          KeySchema: [
            { AttributeName: 'GSI2PK', KeyType: 'HASH' },
            { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10,
      },
    })
  );

  console.log(`✅ Table '${TABLE_NAME}' created with GSI1 + GSI2!`);
}

async function seedTestUsers(): Promise<void> {
  const now = new Date().toISOString();

  const testUsers = [
    {
      PK: 'USER#mock-user-001',
      SK: 'PROFILE',
      GSI1PK: 'ROLE#STUDENT',
      GSI1SK: 'SCORE#0',
      entityType: 'USER',
      id: 'mock-user-001',
      email: 'student@test.local',
      role: 'STUDENT',
      fullName: 'Test Student',
      profilePicUrl: '',
      skills: ['JavaScript', 'React Native'],
      domain: 'Software Engineering',
      reputationScore: 0,
      studentsGuided: 0,
      isBanned: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      PK: 'USER#mock-alumni-001',
      SK: 'PROFILE',
      GSI1PK: 'ROLE#ALUMNI',
      GSI1SK: 'SCORE#15',
      entityType: 'USER',
      id: 'mock-alumni-001',
      email: 'alumni@test.local',
      role: 'ALUMNI',
      fullName: 'Test Alumni',
      profilePicUrl: '',
      skills: ['Node.js', 'AWS', 'System Design'],
      domain: 'Software Engineering',
      reputationScore: 15,
      studentsGuided: 8,
      isBanned: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      PK: 'USER#mock-faculty-001',
      SK: 'PROFILE',
      GSI1PK: 'ROLE#FACULTY',
      GSI1SK: 'SCORE#25',
      entityType: 'USER',
      id: 'mock-faculty-001',
      email: 'faculty@test.local',
      role: 'FACULTY',
      fullName: 'Dr. Test Faculty',
      profilePicUrl: '',
      skills: ['Machine Learning', 'Data Science', 'Python'],
      domain: 'Data Science',
      reputationScore: 25,
      studentsGuided: 20,
      isBanned: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      PK: 'USER#mock-admin-001',
      SK: 'PROFILE',
      GSI1PK: 'ROLE#ADMIN',
      GSI1SK: 'SCORE#0',
      entityType: 'USER',
      id: 'mock-admin-001',
      email: 'admin@test.local',
      role: 'ADMIN',
      fullName: 'Test Admin',
      profilePicUrl: '',
      skills: [],
      domain: 'Administration',
      reputationScore: 0,
      studentsGuided: 0,
      isBanned: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const user of testUsers) {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: user,
      })
    );
    console.log(`  👤 Seeded: ${user.fullName} (${user.role})`);
  }

  console.log(`\n✅ Seeded ${testUsers.length} test users.`);
}

async function main(): Promise<void> {
  console.log('\n🚀 AlumniConnect — DynamoDB Table Bootstrap\n');
  console.log(`  Endpoint: ${process.env.DYNAMO_ENDPOINT || 'http://localhost:8000'}`);
  console.log(`  Table:    ${TABLE_NAME}\n`);

  try {
    await deleteTableIfExists();
    await createTable();
    await seedTestUsers();

    console.log('\n✅ Bootstrap complete! You can now run: npm run dev\n');
  } catch (error: any) {
    console.error('\n❌ Bootstrap failed:', error.message);
    console.error(
      '\n💡 Make sure DynamoDB Local is running:',
      '\n   docker-compose up -d\n'
    );
    process.exit(1);
  }
}

main();
