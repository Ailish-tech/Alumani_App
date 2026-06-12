import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import { memoryClient } from './memoryStore';
import { seedAllData } from './seedData';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Attempt real DynamoDB connection ──────────────────────────────────────

let dynamoDb: any;
let usingMemory = false;

const endpoint = process.env.DYNAMO_ENDPOINT || 'http://localhost:8000';

try {
  const requestHandler = new NodeHttpHandler({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 150 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 150 }),
  });

  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint,
    requestHandler,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeAccessKeyId',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey',
    },
  });

  dynamoDb = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: false,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });
} catch {
  dynamoDb = memoryClient;
  usingMemory = true;
}

// ─── Auto-detect DynamoDB availability ────────────────────────────────────
// Test connection and fallback to in-memory if DynamoDB is unreachable.

(async () => {
  if (usingMemory) {
    console.log('📦 Using in-memory database (DynamoDB client init failed)');
    seedAllData();
    return;
  }

  try {
    // Quick health check — try to list tables with a short timeout
    const http = await import('http');
    const url = new URL(endpoint);

    await new Promise<void>((resolve, reject) => {
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: '/',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.0',
            'X-Amz-Target': 'DynamoDB_20120810.ListTables',
          },
          timeout: 1500,
        },
        (res) => {
          if (res.statusCode && res.statusCode < 500) {
            resolve();
          } else {
            reject(new Error(`DynamoDB responded with ${res.statusCode}`));
          }
        }
      );
      req.on('timeout', () => { req.destroy(); reject(new Error('DynamoDB timeout')); });
      req.on('error', reject);
      req.write(JSON.stringify({}));
      req.end();
    });

    console.log(`✅ DynamoDB connected at ${endpoint}`);
  } catch (err: any) {
    console.log(`⚠️  DynamoDB not reachable at ${endpoint} (${err.message})`);
    console.log('📦 Falling back to in-memory database with seed data');
    dynamoDb = memoryClient;
    usingMemory = true;
    seedAllData();
  }
})();

export { dynamoDb, usingMemory };
export default dynamoDb;
