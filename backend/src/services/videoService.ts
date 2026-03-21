import dotenv from 'dotenv';
dotenv.config();

// Agora token generation uses the agora-access-token package
// Reference: https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraDynamicKey/nodejs
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const APP_ID = process.env.AGORA_APP_ID || '';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';

/**
 * Generate an Agora RTC token for a user to join a video channel.
 *
 * @param channelName - Unique channel name (we use the Mentorship Request ID)
 * @param uid        - Numeric UID for the user in this Agora session (0 = auto-assign)
 * @param expiresIn  - Token lifetime in seconds (default: 3600 = 1 hour)
 * @returns The generated RTC token string
 */
export function generateAgoraRtcToken(
  channelName: string,
  uid: number = 0,
  expiresIn: number = 3600
): string {
  if (!APP_ID || !APP_CERTIFICATE) {
    throw new Error(
      'Agora credentials not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env'
    );
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expiresIn;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpiredTs
  );

  return token;
}

/**
 * Get the Agora App ID (needed by the frontend client).
 */
export function getAgoraAppId(): string {
  return APP_ID;
}

/**
 * Generate the AES-256-GCM2 encryption configuration for E2EE.
 * Both sides must use the same key + salt for the same channel.
 *
 * In production, derive these from a shared secret per mentorship session.
 * For now we use a deterministic key derived from the channel name.
 */
export function getEncryptionConfig(channelName: string): {
  encryptionMode: string;
  encryptionKey: string;
  encryptionSalt: Buffer;
} {
  const crypto = require('crypto');

  // Derive a 256-bit key from the channel name + a static secret
  const secret = process.env.AGORA_ENCRYPTION_SECRET || 'alumniconnect-e2ee-secret-key';
  const encryptionKey = crypto
    .createHash('sha256')
    .update(`${channelName}:${secret}`)
    .digest('hex');

  // Derive a 32-byte salt
  const encryptionSalt = crypto
    .createHash('sha256')
    .update(`salt:${channelName}:${secret}`)
    .digest();

  return {
    encryptionMode: 'AES_256_GCM2',
    encryptionKey,
    encryptionSalt,
  };
}
