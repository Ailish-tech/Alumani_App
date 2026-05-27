import { Response, NextFunction } from 'express';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import multer from 'multer';
import { AuthenticatedRequest } from '../types/requests';
import { ValidationError } from '../utils/errors';
import {
  normalizeHeader,
  batchInsertMasterRecords,
  claimAccount,
  ParsedCSVRow,
} from '../services/masterService';

// ═══════════════════════════════════════════════════════════════════════════════
// MULTER CONFIG — memory storage (no disk writes)
// ═══════════════════════════════════════════════════════════════════════════════

export const uploadCSV = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    // Mobile devices send various MIME types for CSV:
    // text/csv, text/comma-separated-values, application/vnd.ms-excel,
    // application/octet-stream, etc.
    const allowedMimes = [
      'text/csv', 'text/comma-separated-values',
      'application/vnd.ms-excel', 'application/csv',
      'application/octet-stream', // mobile fallback
    ];
    const isCSV = file.originalname.toLowerCase().endsWith('.csv');
    if (isCSV || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only CSV files are allowed. Got: ${file.mimetype}`));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
}).single('file');

// ═══════════════════════════════════════════════════════════════════════════════
// CSV PARSING HELPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse a CSV buffer into normalized JSON rows.
 * Uses csv-parser with mapHeaders for alias resolution.
 */
function parseCSVBuffer(buffer: Buffer): Promise<ParsedCSVRow[]> {
  return new Promise((resolve, reject) => {
    const rows: ParsedCSVRow[] = [];
    const readable = Readable.from(buffer);

    readable
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => normalizeHeader(header),
        })
      )
      .on('data', (row: any) => {
        rows.push({
          collegeid: (row.collegeid || '').toString().trim(),
          name: (row.name || '').toString().trim(),
          gradyear: parseInt(row.gradyear, 10) || 0,
          baserole: ((row.baserole || 'STUDENT').toString().trim().toUpperCase()) as ParsedCSVRow['baserole'],
        });
      })
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER: POST /api/admin/upload-master-list
// ═══════════════════════════════════════════════════════════════════════════════

export async function uploadMasterList(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new ValidationError('No CSV file uploaded. Use form field name "file".');
    }

    // 1. Parse the CSV buffer
    const rows = await parseCSVBuffer(req.file.buffer);

    if (rows.length === 0) {
      throw new ValidationError('CSV file is empty or has no valid data rows.');
    }

    // 2. Batch insert into DynamoDB
    const result = await batchInsertMasterRecords(rows);

    res.status(201).json({
      success: true,
      message: `Master list uploaded successfully.`,
      data: {
        totalRows: rows.length,
        inserted: result.inserted,
        skipped: result.skipped,
        errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER: POST /api/auth/claim
// ═══════════════════════════════════════════════════════════════════════════════

export async function claimAccountHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { collegeId } = req.body;
    const firebaseUid = req.user.uid;

    if (!collegeId) {
      throw new ValidationError('collegeId is required');
    }

    const result = await claimAccount(firebaseUid, collegeId.toString().trim());

    res.status(201).json({
      success: true,
      message: `Account claimed successfully as ${result.role}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
