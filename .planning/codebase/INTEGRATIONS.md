# Integrations

## External Services

### Amazon DynamoDB
- **Purpose:** Primary database (NoSQL)
- **Config:** `backend/src/config/db.ts`
- **SDK:** `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb`
- **Access pattern:** Single-table design with `PK`/`SK` composite keys
- **Key helper:** `buildKey(type, id)` in `backend/src/utils/helpers.ts`
- **Table constant:** `TABLE_NAME` in `backend/src/utils/helpers.ts`
- **Local dev:** DynamoDB Local via Docker (`docker-compose.yml`) at `http://localhost:8000`
- **Table creation:** `ts-node scripts/createTable.ts`

### Amazon S3
- **Purpose:** File/image storage (profile photos, post media)
- **Config:** `backend/src/config/s3.ts`
- **SDK:** `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- **Pattern:** Pre-signed URL upload (client uploads directly to S3)
- **Bucket:** `alumniconnect-uploads` (configurable via `S3_BUCKET` env var)
- **Local dev:** Can use MinIO or LocalStack via `S3_ENDPOINT` env var

### Firebase Admin SDK
- **Purpose:** Authentication (JWT token verification)
- **Config:** `backend/src/config/firebase.ts`
- **SDK:** `firebase-admin` 12.0
- **Flow:** Client authenticates with Firebase → sends JWT → backend verifies via Admin SDK
- **Dev mode:** Mock auth when `NODE_ENV=development` (no Firebase needed)
- **Service account:** `backend/firebase-service-account.json`

### Agora.io
- **Purpose:** Video calling / real-time communication
- **SDK:** `agora-access-token`
- **Controller:** `backend/src/controllers/videoController.ts`
- **Routes:** `backend/src/routes/videoRoutes.ts`
- **Config:** `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` env vars

### Socket.io
- **Purpose:** Real-time events (chat, notifications, live updates)
- **Backend:** `socket.io` 4.7 — `backend/src/socket/socketHandler.ts`
- **Frontend:** `socket.io-client` 4.7
- **Injected into controllers:** mentorship, post, connection controllers receive `io` instance
- **Config:** CORS `origin: '*'`, ping timeout 60s, ping interval 25s

## API Communication

- **Frontend → Backend:** Axios HTTP client configured in `frontend/src/config/api.ts`
- **Base URL:** `http://192.168.1.9:3000/api` (configured in `frontend/app.json` → `extra.apiUrl`)
- **Auth header:** `Bearer <firebase-jwt>` or `Bearer dev:<userId>:<role>` in dev mode

## Environment Variables

| Variable | Service | Required |
|----------|---------|----------|
| `PORT` | Express | No (default: 3000) |
| `NODE_ENV` | All | No (default: development) |
| `DYNAMO_ENDPOINT` | DynamoDB | No (default: localhost:8000) |
| `AWS_REGION` | AWS | No (default: us-east-1) |
| `AWS_ACCESS_KEY_ID` | AWS | Yes (prod) |
| `AWS_SECRET_ACCESS_KEY` | AWS | Yes (prod) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Firebase | Yes (prod) |
| `S3_BUCKET` | S3 | No (default: alumniconnect-uploads) |
| `S3_REGION` | S3 | No (default: us-east-1) |
| `S3_ENDPOINT` | S3 (local) | No |
| `AGORA_APP_ID` | Agora | Yes (prod) |
| `AGORA_APP_CERTIFICATE` | Agora | Yes (prod) |
| `MOCK_USER_ID` | Dev auth | No |
| `MOCK_USER_ROLE` | Dev auth | No |
