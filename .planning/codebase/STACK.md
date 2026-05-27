# Stack

## Languages & Runtimes

| Component | Language | Runtime |
|-----------|----------|---------|
| Backend | TypeScript 5.3 | Node.js (via `ts-node`) |
| Frontend | TypeScript 5.9 | React Native 0.83 + Expo SDK 55 |

## Backend Framework & Dependencies

**Framework:** Express 4.18

**Core dependencies:**
- `express` — HTTP server framework
- `socket.io` 4.7 — Real-time WebSocket communication
- `firebase-admin` 12.0 — Authentication & token verification
- `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` 3.525 — DynamoDB data layer
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` 3.525 — S3 file storage with pre-signed URLs
- `agora-access-token` 2.0 — Agora.io video call token generation
- `helmet` 8.1 — Security headers
- `express-rate-limit` 8.2 — API rate limiting
- `cors` 2.8 — Cross-origin resource sharing
- `multer` 2.1 — Multipart file upload handling
- `csv-parser` 3.2 — CSV file parsing (master list import)
- `xss` 1.0 — Input sanitization
- `dotenv` 16.4 — Environment variable management
- `uuid` 9.0 — Unique ID generation

**Dev dependencies:**
- `nodemon` — Auto-restart on file changes
- `ts-node` — TypeScript execution without pre-compilation
- `typescript` 5.3

**Entry point:** `backend/src/index.ts`
**Build output:** `backend/dist/`
**Dev command:** `nodemon --exec ts-node src/index.ts`

## Frontend Framework & Dependencies

**Framework:** React Native 0.83 + Expo SDK 55

**Core dependencies:**
- `react` 19.2 / `react-native` 0.83 — UI framework
- `expo` ~55.0 — Build toolchain & native modules
- `@react-navigation/native` 7.0 + `native-stack` + `bottom-tabs` — Navigation
- `zustand` 5.0 — State management
- `axios` 1.7 — HTTP client
- `socket.io-client` 4.7 — Real-time WebSocket client
- `expo-image-picker`, `expo-document-picker`, `expo-av` — Media handling
- `expo-secure-store` — Secure token storage
- `expo-image` — Optimized image rendering
- `@expo/vector-icons` + `react-native-vector-icons` — Icon libraries

**Entry point:** `frontend/index.ts` → `frontend/App.tsx`
**Dev command:** `expo start`

## Configuration

| File | Purpose |
|------|---------|
| `backend/.env` / `.env.example` | Backend environment variables |
| `backend/tsconfig.json` | TypeScript config (ES2020 target, CommonJS module) |
| `backend/firebase-service-account.json` | Firebase service account credentials |
| `frontend/app.json` | Expo app configuration |
| `frontend/tsconfig.json` | Frontend TypeScript config |
| `docker-compose.yml` | DynamoDB Local container |

## Infrastructure

- **Database:** Amazon DynamoDB (local via Docker for dev)
- **File Storage:** Amazon S3 (pre-signed URL upload pattern)
- **Authentication:** Firebase Admin SDK (mock mode in development)
- **Video Calls:** Agora.io (token-based)
- **Real-time:** Socket.io (WebSocket)
- **Containerization:** Docker Compose for DynamoDB Local only
