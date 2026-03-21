import { S3Client, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

const s3Config: S3ClientConfig = {
  region: process.env.S3_REGION || 'us-east-1',
};

// In local dev, you can use MinIO or localstack
if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT;
}

const s3Client = new S3Client(s3Config);

const BUCKET = process.env.S3_BUCKET || 'alumniconnect-uploads';

/**
 * Generate a pre-signed URL for uploading a file to S3.
 * @param key   - The S3 object key (e.g., "posts/user123/image.jpg")
 * @param contentType - MIME type (e.g., "image/jpeg")
 * @param expiresIn - URL expiry in seconds (default 300 = 5 min)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export { s3Client, BUCKET };
export default s3Client;
