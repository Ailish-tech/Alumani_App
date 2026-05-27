# Technical Concerns & Debt

## 1. Lack of Automated Testing
- **Description:** There are no unit, integration, or E2E tests configured for the frontend or backend.
- **Impact:** High risk of regressions during refactoring or adding new features. Manual testing is a bottleneck.

## 2. Mock Authentication in Production Risk
- **Description:** `authMiddleware.ts` includes logic to bypass Firebase authentication entirely if `NODE_ENV === 'development'`.
- **Impact:** While convenient for local development, this introduces a critical security risk if this logic accidentally leaks into or is misconfigured in a production deployment environment.

## 3. Single-Table Design Complexity
- **Description:** DynamoDB is highly scalable but requires precise query patterns. The logic heavily relies on `PK` and `SK` composed strings (e.g., `USER#userId`, `COMMENT#commentId`).
- **Impact:** Modifying query patterns or extracting relationships that were not initially designed for can be challenging and require data migrations or secondary indexes. Currently, there are no predefined GSIs (Global Secondary Indexes) documented, which could cause throughput issues or expensive scans table wide.

## 4. Scalability of Socket.io
- **Description:** The backend stores active socket connections in local memory `Map<string, string> userSockets`.
- **Impact:** This limits the application to a single Node.js instance. To scale horizontally (multiple server instances), a **Redis Adapter** must be introduced so socket messages can find users connected to different servers.

## 5. Secret Management
- **Description:** `firebase-service-account.json` exists locally. S3 and Agora credentials are required in production.
- **Impact:** High risk of secrets being committed to version control. Ensure `.gitignore` correctly ignores `.env` and `firebase-service-account.json`. Ensure production deployment securely injects environment variables.

## 6. Monorepo Tooling
- **Description:** The repository contains a `backend/` and `frontend/` folder, but no monorepo manager (like Yarn Workspaces, Turbo, Nx) is configured.
- **Impact:** Dependency management, scripting (e.g. `start-all.bat` is Windows only), and CI/CD pipelines require custom duplicated setup rather than streamlined unified commands.
