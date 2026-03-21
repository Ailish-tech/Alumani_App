# AlumniConnect — Production Setup Guide

This guide covers the manual steps YOU need to do to go fully production. All code changes have already been made.

---

## 1. 🔐 Firebase Authentication

### Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Create Project** → name it `AlumniConnect`
2. Enable **Authentication** → Sign-in method → Enable **Email/Password** (and optionally Google)
3. Go to **Project Settings** → **Service Accounts** → **Generate New Private Key**
4. Save the JSON file as `backend/firebase-service-account.json`
5. Update `backend/.env`:
   ```env
   NODE_ENV=production
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```
6. The auth middleware automatically switches from mock to real Firebase when `NODE_ENV !== 'development'`

> [!IMPORTANT]
> Keep `firebase-service-account.json` out of version control — it's already in `.gitignore`.

---

## 2. 📦 AWS S3 (Image Uploads)

### Steps:

1. Go to [AWS Console](https://console.aws.amazon.com/s3/) → **Create Bucket**
   - Name: `alumniconnect-uploads`
   - Region: `us-east-1` (or your preferred region)
   - **Uncheck** "Block all public access" (for profile pic URLs to be accessible)
2. Add a **Bucket Policy** for public read:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicRead",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::alumniconnect-uploads/*"
       }
     ]
   }
   ```
3. Create an **IAM User** with `AmazonS3FullAccess` → copy Access Key + Secret
4. Update `backend/.env`:
   ```env
   S3_BUCKET=alumniconnect-uploads
   S3_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   ```

---

## 3. 🗄️ DynamoDB (Switch from Local to AWS)

### Steps:

1. In AWS Console → **DynamoDB** → your region
2. **Create Table**:
   - Table name: `AlumniConnect`
   - Partition key: `PK` (String)
   - Sort key: `SK` (String)
3. Add **GSI** (Global Secondary Index):
   - Index name: `GSI1`
   - Partition key: `GSI1PK` (String)
   - Sort key: `GSI1SK` (String)
   - Projection: ALL
4. Update `backend/.env`:
   ```env
   # Remove or comment out DYNAMO_ENDPOINT to use AWS (not local)
   # DYNAMO_ENDPOINT=http://localhost:8000
   AWS_REGION=us-east-1
   DYNAMO_TABLE_NAME=AlumniConnect
   ```

> [!TIP]
> The same IAM credentials from S3 work for DynamoDB if the user has `AmazonDynamoDBFullAccess`.

---

## 4. 📹 Agora.io (Video Calls)

### Steps:

1. Go to [Agora Console](https://console.agora.io/) → Create Project → Get **App ID** and **App Certificate**
2. Update `backend/.env`:
   ```env
   AGORA_APP_ID=your_app_id_here
   AGORA_APP_CERTIFICATE=your_certificate_here
   ```
3. The token generation logic is already complete in `backend/src/services/videoService.ts`

---

## 5. 🌐 Backend Deployment

### Option A: Railway (Easiest)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app/) → **New Project** → Deploy from GitHub
3. Set all `.env` variables in the Railway dashboard
4. Railway gives you a public URL like `https://alumniconnect-api.up.railway.app`

### Option B: AWS EC2/ECS

1. Build: `cd backend && npm run build`
2. Deploy the `dist/` folder to EC2 or ECS Fargate
3. Use a reverse proxy (nginx) for HTTPS

### After Deployment:

Update the frontend API URL in `frontend/app.json`:

```json
{
  "extra": {
    "apiUrl": "https://YOUR_DEPLOYED_URL/api"
  }
}
```

---

## 6. 📱 Mobile App Build & Publish

### Build for Stores:

```bash
# iOS
npx eas build --platform ios --profile production

# Android
npx eas build --platform android --profile production
```

### Prerequisites:

- **iOS**: Apple Developer Account ($99/year), create App ID, provisioning profile
- **Android**: Google Play Developer Account ($25 one-time), signing keystore

---

## 7. Complete .env Template

```env
# ─── Server ───────────────────────────────────
NODE_ENV=production
PORT=3000

# ─── Firebase Auth ────────────────────────────
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# ─── AWS Credentials ─────────────────────────
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# ─── DynamoDB ─────────────────────────────────
DYNAMO_TABLE_NAME=AlumniConnect
# DYNAMO_ENDPOINT=http://localhost:8000  ← remove for AWS

# ─── S3 ───────────────────────────────────────
S3_BUCKET=alumniconnect-uploads
S3_REGION=us-east-1

# ─── Agora (Video) ───────────────────────────
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
```

---

## Quick Checklist

| Step | Service                 | Time Estimate |
| ---- | ----------------------- | ------------- |
| 1    | Firebase Auth           | ~10 min       |
| 2    | S3 Bucket               | ~15 min       |
| 3    | DynamoDB Table + GSI    | ~10 min       |
| 4    | Agora Credentials       | ~5 min        |
| 5    | Backend Deployment      | ~20 min       |
| 6    | Update frontend API URL | ~2 min        |
| 7    | EAS Build               | ~30 min       |
