import {
  PutCommand, GetCommand, UpdateCommand, QueryCommand, BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { TABLE_NAME, buildKey, isoNow } from '../utils/helpers';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MasterRecord {
  PK: string;            // MASTER#{collegeId}
  SK: string;            // DETAILS
  entityType: 'MASTER';
  collegeId: string;
  name: string;
  gradYear: number;
  baseRole: 'STUDENT' | 'ALUMNI' | 'FACULTY';
  isClaimed: boolean;
  claimedByUid: string | null;
  createdAt: string;
}

export interface ParsedCSVRow {
  collegeid: string;
  name: string;
  gradyear: number;
  baserole: 'STUDENT' | 'ALUMNI' | 'FACULTY';
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER NORMALIZATION MAP
// ═══════════════════════════════════════════════════════════════════════════════

const HEADER_ALIASES: Record<string, string> = {};

// gradYear aliases
['passout', 'passingyear', 'batch', 'graduationyear', 'gradyear', 'grad_year', 'passing_year', 'passoutyear']
  .forEach(a => HEADER_ALIASES[a] = 'gradyear');

// collegeId aliases
['rollno', 'employeeid', 'id', 'collegeid', 'college_id', 'roll_no', 'employee_id', 'rollnumber', 'enrollment']
  .forEach(a => HEADER_ALIASES[a] = 'collegeid');

// baseRole aliases
['type', 'role', 'baserole', 'base_role', 'usertype', 'user_type']
  .forEach(a => HEADER_ALIASES[a] = 'baserole');

// name aliases
['name', 'fullname', 'full_name', 'studentname', 'student_name']
  .forEach(a => HEADER_ALIASES[a] = 'name');

/**
 * Normalize a CSV header: lowercase, remove spaces, map aliases.
 */
export function normalizeHeader(header: string): string {
  const cleaned = header.toLowerCase().replace(/[\s_-]+/g, '').trim();
  return HEADER_ALIASES[cleaned] || cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH INSERT  (chunks of 25 — DynamoDB hard limit)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Split an array into chunks of a given size.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Batch insert parsed CSV rows as MASTER entities.
 * Returns { inserted: number, skipped: number, errors: string[] }
 */
export async function batchInsertMasterRecords(rows: ParsedCSVRow[]): Promise<{
  inserted: number; skipped: number; errors: string[];
}> {
  const now = isoNow();
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Validate and build items
  const items: MasterRecord[] = [];
  for (const row of rows) {
    if (!row.collegeid || !row.name) {
      skipped++;
      errors.push(`Skipped row: missing collegeId or name (${JSON.stringify(row)})`);
      continue;
    }

    const baseRole = (row.baserole || 'STUDENT').toUpperCase() as MasterRecord['baseRole'];
    if (!['STUDENT', 'ALUMNI', 'FACULTY'].includes(baseRole)) {
      skipped++;
      errors.push(`Skipped row ${row.collegeid}: invalid baseRole "${row.baserole}"`);
      continue;
    }

    items.push({
      PK: buildKey('MASTER', row.collegeid),
      SK: 'DETAILS',
      entityType: 'MASTER',
      collegeId: row.collegeid,
      name: row.name,
      gradYear: Number(row.gradyear) || 0,
      baseRole,
      isClaimed: false,
      claimedByUid: '',
      createdAt: now,
    });
  }

  // Chunk into groups of 25 and batch write
  const chunks = chunkArray(items, 25);

  for (const chunk of chunks) {
    try {
      await dynamoDb.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: chunk.map(item => ({
            PutRequest: { Item: item },
          })),
        },
      }));
      inserted += chunk.length;
    } catch (err: any) {
      console.error('[masterService] BatchWrite error:', err.message);
      errors.push(`Batch write error: ${err.message}`);
      skipped += chunk.length;
    }
  }

  return { inserted, skipped, errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET MASTER RECORD
// ═══════════════════════════════════════════════════════════════════════════════

export async function getMasterRecord(collegeId: string): Promise<MasterRecord | null> {
  const result = await dynamoDb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: buildKey('MASTER', collegeId), SK: 'DETAILS' },
  }));
  return (result.Item as MasterRecord) || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC ROLE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate the final role based on baseRole and gradYear.
 *
 * Rules:
 * - FACULTY → always FACULTY
 * - ALUMNI  → always ALUMNI
 * - STUDENT → if current date >= Aug 1 of gradYear, becomes ALUMNI; else STUDENT
 */
export function calculateFinalRole(baseRole: string, gradYear: number): string {
  if (baseRole === 'FACULTY') return 'FACULTY';
  if (baseRole === 'ALUMNI') return 'ALUMNI';

  // STUDENT: check graduation threshold (August 1st of gradYear)
  if (baseRole === 'STUDENT' && gradYear > 0) {
    const graduationDate = new Date(gradYear, 7, 1); // Aug 1st (month is 0-indexed)
    const now = new Date();
    if (now >= graduationDate) return 'ALUMNI';
  }

  return 'STUDENT';
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNT CLAIMING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Claim a master record and create/update the user profile.
 *
 * Steps:
 * 1. Fetch MASTER#{collegeId} — 404 if not found
 * 2. Check isClaimed — 403 if already claimed
 * 3. Calculate final role
 * 4. Transactional dual update:
 *    a. Set isClaimed=true, claimedByUid=firebaseUid on MASTER record
 *    b. Create USER#{firebaseUid}#PROFILE with final role
 */
export async function claimAccount(firebaseUid: string, collegeId: string): Promise<{
  role: string; name: string; gradYear: number; collegeId: string;
}> {
  // 1. Fetch master record
  const master = await getMasterRecord(collegeId);
  if (!master) {
    throw new NotFoundError('Master record', collegeId);
  }

  // 2. Check if already claimed
  if (master.isClaimed) {
    throw new ConflictError(`This college ID (${collegeId}) has already been claimed`);
  }

  // 3. Calculate final role
  const finalRole = calculateFinalRole(master.baseRole, master.gradYear);

  // 4a. Update MASTER record — mark as claimed
  await dynamoDb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: buildKey('MASTER', collegeId), SK: 'DETAILS' },
    UpdateExpression: 'SET isClaimed = :t, claimedByUid = :uid',
    ConditionExpression: 'isClaimed = :f',
    ExpressionAttributeValues: { ':t': true, ':uid': firebaseUid, ':f': false },
  }));

  // 4b. Create/update user profile
  const now = isoNow();
  await dynamoDb.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: buildKey('USER', firebaseUid),
      SK: 'PROFILE',
      GSI1PK: buildKey('ROLE', finalRole),
      GSI1SK: buildKey('USER', firebaseUid),
      entityType: 'USER',
      id: firebaseUid,
      collegeId,
      fullName: master.name,
      role: finalRole,
      gradYear: master.gradYear,
      baseRole: master.baseRole,
      email: '',
      bio: '',
      skills: [],
      domain: '',
      workplace: '',
      reputationScore: 0,
      studentsGuided: 0,
      isBanned: false,
      createdAt: now,
      updatedAt: now,
    },
  }));

  return {
    role: finalRole,
    name: master.name,
    gradYear: master.gradYear,
    collegeId,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADUATION STATUS CHECK (for middleware)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a STUDENT user should be transitioned to ALUMNI.
 * Returns the new role if transitioned, null otherwise.
 */
export async function checkAndTransitionRole(firebaseUid: string): Promise<string | null> {
  // Fetch user profile
  const result = await dynamoDb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: buildKey('USER', firebaseUid), SK: 'PROFILE' },
  }));

  if (!result.Item) return null;
  const user = result.Item as any;

  // Only transition STUDENT → ALUMNI
  if (user.role !== 'STUDENT') return null;
  if (!user.gradYear || user.gradYear <= 0) return null;

  const graduationDate = new Date(user.gradYear, 7, 1); // Aug 1st
  const now = new Date();

  if (now >= graduationDate) {
    // Transition to ALUMNI
    await dynamoDb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: buildKey('USER', firebaseUid), SK: 'PROFILE' },
      UpdateExpression: 'SET #r = :newRole, GSI1PK = :gsi1pk, updatedAt = :now',
      ExpressionAttributeNames: { '#r': 'role' },
      ExpressionAttributeValues: {
        ':newRole': 'ALUMNI',
        ':gsi1pk': buildKey('ROLE', 'ALUMNI'),
        ':now': isoNow(),
      },
    }));
    return 'ALUMNI';
  }

  return null;
}
