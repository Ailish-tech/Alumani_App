# Architecture

## System Overview

AlumniConnect is a full-stack monorepo consisting of:
1. **Backend:** Node.js + Express API serving REST endpoints and WebSockets (Socket.io)
2. **Frontend:** React Native mobile application built with Expo
3. **Database:** DynamoDB (NoSQL) with Single-Table Design
4. **Storage:** S3 for media assets via direct presigned URL uploads

## Backend Architecture

### Design Pattern
The backend strictly follows the **Controller-Service-Route** layered architecture:

- **Routes (`src/routes/`)**: Registers Express endpoints and attaches middleware (Auth, RBAC, Rate Limiting).
- **Controllers (`src/controllers/`)**: Handles HTTP req/res, extracts parameters, and calls the appropriate Service function.
- **Services (`src/services/`)**: Contains the core business logic and interacts with the database (DynamoDB).
- **Middleware (`src/middleware/`)**: Reusable request processing (Auth, Role checks, Sanitization, Graduation status).

### Data Flow
`Client Request` → `Express App` → `Global Middleware (CORS, Helmet, Rate Limit)` → `Route Specific Middleware (Auth, RBAC)` → `Route` → `Controller` → `Service` → `DynamoDB/S3` → `Service` → `Controller` → `Client Response`

### Database Design (DynamoDB)
The application uses a **Single-Table Design** pattern.
- **Table Name:** Defined by `TABLE_NAME` constant (default: `AlumniConnect`)
- **Primary Key (PK):** Partition Key (e.g., `USER#123`, `POST#456`)
- **Sort Key (SK):** Sort Key (e.g., `PROFILE`, `COMMENT#789`)
- Key generation is centralized in `src/utils/helpers.ts` using `buildKey()`.

### Real-time Architecture (Socket.io)
Real-time features (chat, mentorship notifications, post updates) use Socket.io.
- **Initialization:** Server initialized in `src/index.ts`.
- **Handlers:** Centralized connection/event handling in `src/socket/socketHandler.ts`.
- **IoC Injection:** The `io` instance is injected into controllers via setter functions (e.g., `setMentorshipIo(io)`) to allow REST endpoints to trigger real-time socket emissions.

## Frontend Architecture

### Design Pattern
The frontend uses a component-based React architecture with centralized state management and a role-based navigation system.

- **Screens (`src/screens/`)**: Full-page views organized by feature domain.
- **Components (`src/components/`)**: Reusable UI elements.
- **Navigation (`src/navigation/`)**: Complex routing hierarchy based on user authentication state and Role.
- **Store (`src/store/`)**: Global state management using Zustand.
- **Services (`src/services/` - conceptual via axios):** API communication logic.

### Navigation Hierarchy
Navigation is heavily role-dependent, controlled by `RootNavigator.tsx`:
1. **Unauthenticated:** `AuthStack` (Login, Signup)
2. **Authenticated (Admin):** `AdminTabs` + `SharedScreens`
3. **Authenticated (Alumni):** `AlumniTabs` + `SharedScreens`
4. **Authenticated (Student):** `MainTabs` + `SharedScreens`

Shared screens (Chat, Edit Profile, Video Call) are accessible across all roles. Feature-specific screens are grouped logically (e.g., Phase 1-5 folders).

### State Management
**Zustand** is used for global state across different domains:
- `authStore.ts` (User session, JWT, role)
- `chatStore.ts`
- `eventStore.ts`
- `jobStore.ts`
- `mentorshipStore.ts`
- `postStore.ts`

### API Communication
API requests are centralized using configured Axios instances (likely in `src/config/api.ts`). The API URL is dynamically loaded from Expo config (`app.json` → `extra.apiUrl`).
