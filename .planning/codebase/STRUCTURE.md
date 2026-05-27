# Directory Structure

## Monorepo Root

```
/
├── backend/                  # Express API Server
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React Native / Expo App
│   ├── App.tsx
│   ├── app.json
│   └── package.json
├── master-list.csv           # Initial data seed file
├── docker-compose.yml        # Local DynamoDB setup
└── start-all.bat             # Windows startup script
```

## Backend Structure (`/backend/src`)

```
backend/src/
├── config/                   # Configuration & connections
│   ├── db.ts                 # DynamoDB initialization
│   ├── firebase.ts           # Firebase Admin SDK initialization
│   └── s3.ts                 # AWS S3 client & presigner
├── controllers/              # HTTP Request/Response handlers
│   ├── adminController.ts    # Admin operations
│   ├── authController.ts     # Login/registration
│   ├── chatController.ts     # Messaging
│   ├── mentorshipController.ts # Mentorship flows (receives socket.io)
│   └── postController.ts     # Feed posts (receives socket.io)
│   # ... (15 controllers total, mapping 1:1 with routes/services)
├── middleware/               # Express middleware functions
│   ├── authMiddleware.ts     # JWT validation & Mock Auth
│   ├── checkGraduationStatus.ts # Auto-transitions Student -> Alumni
│   ├── rbacMiddleware.ts     # Role-based access control
│   └── sanitize.ts           # XSS protection
├── routes/                   # Express route definitions
│   ├── adminRoutes.ts
│   ├── authRoutes.ts
│   └── ... (15 route files)
├── services/                 # Core business logic & DB interactions
│   ├── adminService.ts
│   ├── authService.ts
│   └── ... (15 service files)
├── socket/                   # Real-time WebSocket handlers
│   └── socketHandler.ts      # Connection logic, rooms, user mapping
├── types/                    # TypeScript definitions
│   ├── entities.ts           # DB schema interfaces
│   ├── enums.ts              # Roles, Statuses, Types
│   └── requests.ts           # Extended Express Request types (AuthUser)
└── utils/                    # Shared utilities
    ├── errors.ts             # Custom AppError classes
    └── helpers.ts            # DynamoDB key builders, standard responses
```

## Frontend Structure (`/frontend/src`)

```
frontend/src/
├── components/               # Reusable UI components
│   ├── ErrorBoundary.tsx
│   ├── LoadingOverlay.tsx
│   ├── PostCard.tsx
│   └── ScreenWrapper.tsx
├── config/                   # Frontend configuration
│   └── api.ts                # Axios instance with interceptors
├── constants/                # App-wide constants
│   └── theme.ts              # Colors, spacing, typography (Dark Theme)
├── navigation/               # React Navigation setup
│   ├── RootNavigator.tsx     # Role-based routing logic
│   ├── AdminTabNavigator.tsx
│   ├── AlumniTabNavigator.tsx
│   └── MainTabNavigator.tsx  # Student tabs
├── screens/                  # View screens grouped by feature domain
│   ├── admin/                # Admin-only screens (Dashboard, Moderation)
│   ├── alumni/               # Alumni-only screens (Directory, Referrals)
│   ├── auth/                 # Login, Signup
│   ├── booking/
│   ├── career/               # Goals, Resume Builder
│   ├── chat/                 # Chat List, Chat Room
│   ├── community/            # Groups, Polls, Q&A
│   ├── connections/
│   ├── events/
│   ├── explore/
│   ├── feed/                 # Social Feed
│   ├── jobs/
│   ├── mentorship/
│   ├── ml/                   # Analytics, Smart Insights
│   ├── notifications/
│   ├── profile/              # User Profile, Edit, Followers
│   ├── resources/
│   ├── search/
│   └── video/                # Video Call Screen
├── services/                 # API interaction layer
├── store/                    # Zustand global state management
│   ├── authStore.ts
│   ├── chatStore.ts
│   ├── eventStore.ts
│   ├── jobStore.ts
│   ├── mentorshipStore.ts
│   └── postStore.ts
└── types/                    # Frontend TypeScript definitions
```

## Naming Conventions

- **Directories/Folders:** `kebab-case` or `camelCase` depending on domain (React components usually standard `camelCase`)
- **Backend Files:** `camelCase` for modules (e.g., `authController.ts`)
- **Frontend Components/Screens:** `PascalCase` (e.g., `LoginScreen.tsx`, `PostCard.tsx`)
- **Interfaces/Types:** `PascalCase`
- **Enums:** `PascalCase` names with `UPPER_SNAKE_CASE` values
- **Constants:** `UPPER_SNAKE_CASE` for global configurations, `PascalCase` for objects grouping constants (e.g., `Colors`, `Spacing`)
