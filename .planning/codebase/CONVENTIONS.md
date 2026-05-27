# Conventions

## Coding Style & Formatting

- **Language:** TypeScript strict mode across both Frontend and Backend
- **Casing:**
  - `camelCase` for variables, functions, instances, services
  - `PascalCase` for classes, React components, types/interfaces, enums
  - `UPPER_SNAKE_CASE` for constants, environment variables, enum values
- **Quotes:** Single quotes `''` preferred over double quotes `""`
- **Imports:** Structured logically (built-in/3rd-party first, then internal alias, then relative)

## Backend Patterns

### Controllers
- Must be wrapped in `try/catch` or use an async wrapper.
- Extract `req.user.uid` from authentication middleware.
- Delegate all heavy lifting to Services.
- Return standardized JSON responses: `{ success: boolean, data?: any, error?: string }`

### Services
- Handle business logic and database operations.
- Throw custom `AppError` subclasses (e.g., `NotFoundError`, `UnauthorizedError`) for expected failures.
- Use the DynamoDB Document Client (`DynamoDBDocumentClient.from(client)`) for simplified I/O.
- Build keys using the `buildKey()` utility located in `src/utils/helpers.ts`.

### Middleware
- **Auth (`authMiddleware.ts`):** Validates Firebase JWT. In dev mode (`NODE_ENV=development`), falls back to mock auth (`Bearer dev:user123:STUDENT`) to allow local testing.
- **RBAC (`rbacMiddleware.ts`):** Checks `req.user.role` against allowed roles.
- **Error Handling:** Global error handler catches `AppError` and returns correct HTTP status codes, falling back to 500 for unknown errors.

## Frontend Patterns

### React Native & React Navigation
- Use functional components (`React.FC`) with Hooks.
- Define prop types using TypeScript interfaces.
- Navigation defined strictly via typed stacks (e.g., `RootStackParamList`).
- Navigation state deeply relies on user `Role` to determine which tab navigator to show (Student, Alumni, Admin).

### State Management
- Use **Zustand** for global state.
- Keep stores small and domain-focused (e.g., `authStore.ts`, `postStore.ts`).
- Actions inside stores should be asynchronous when fetching data via Axios.

### Styling
- Avoid inline styles where possible; use `StyleSheet.create`.
- Rely entirely on `constants/theme.ts` for Colors, Spacing, FontSize, and BorderRadius to ensure the dark theme remains consistent.

## Error Handling & Logging
- **Backend Logging:** Minimal custom logging `console.log()` in dev mode (method/path). Errors handled globally.
- **Frontend Errors:** Wrapped with an `ErrorBoundary.tsx` component to prevent total app crashes. Toast/Alert UI used for user-facing errors.
