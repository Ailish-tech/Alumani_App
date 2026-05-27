# Testing

## Current Setup

As of current analysis, **no automated testing framework or tests** (Jest, Mocha, Cypress, etc.) have been detected in either the backend or frontend packages.

### Backend

- **No test scripts:** `package.json` does not expose a `test` script.
- **No test files:** `src/` directory contains no `.spec.ts` or `.test.ts` files.
- **Manual testing:** Testing relies on running the local development server `npm run dev` and hitting endpoints via Postman or the frontend client. Mock auth (`authMiddleware.ts`) exists specifically to facilitate easy local testing without a live Firebase setup.

### Frontend

- **No test scripts:** `package.json` does not expose a `test` script.
- **No test files:** `src/` directory contains no component tests.
- **Manual testing:** Testing relies on running the Expo dev server `npm start` and verifying rendering and interactions on simulators/devices.

## Recommendations for Implementation

If testing is to be introduced:

**Backend:**
1. Setup **Jest** and `ts-jest` for unit/integration testing.
2. Setup **Supertest** to mock Express routes.
3. Test boundaries:
   - Mock DynamoDB using `aws-sdk-client-mock`.
   - Test Services independently from Controllers.
   - Test Controllers simply to verify parameter extraction and HTTP response mapping.

**Frontend:**
1. Setup **Jest** with `jest-expo` and `@testing-library/react-native`.
2. Mock navigation and Zustand stores.
3. Test critical user journeys (Auth, Post Feed, Chat).
