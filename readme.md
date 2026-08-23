# Collaborative Project & Task Management Tool (Kanban)

A full-stack, enterprise-grade project management application featuring Role-Based Access Control (RBAC), drag-and-drop Kanban workflow, multi-attribute task filtering, activity audit trails, and automatic JWT access/refresh token rotation.

---

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Redux Toolkit (RTK), Tailwind CSS, @hello-pangea/dnd, Lucide React
- **Backend:** Node.js, Express.js (TypeScript), MongoDB, Mongoose ODM
- **Security & Auth:** JWT (Access Token in Redux memory + Refresh Token in HTTP-Only Cookie), bcryptjs, Cookie-Parser
- **Validation:** Zod (Request payload schema validation)
- **API Documentation:** Swagger UI (swagger-ui-express)

---

## 🏛 Database Schema & Entity Relationships

```text
User (1) ───< ProjectMember >─── (N) Project (1) ───< (N) Board (1) ───< (N) Task (1) ───< (N) Comment
```

### Schema Definitions

- **User Model:**
  - `name`: String (Required, trimmed)
  - `email`: String (Required, unique, indexed, lowercase)
  - `password`: String (Hashed with bcryptjs)
  - `avatarUrl`: String (Optional)
  - `refreshTokenHash`: String (Hashed refresh token for rotation security)
  - `timestamps`: `createdAt`, `updatedAt`

- **Project Model:**
  - `title`: String (Required, trimmed)
  - `description`: String (Optional)
  - `owner`: ObjectId (Ref: User, indexed)
  - `members`: Array of `{ user: ObjectId (Ref: User), role: 'owner' | 'admin' | 'member' }`
  - `timestamps`: `createdAt`, `updatedAt`

- **Board Model (Kanban Columns):**
  - `title`: String (e.g., "To Do", "In Progress", "Done")
  - `projectId`: ObjectId (Ref: Project, indexed)
  - `orderIndex`: Number (Column sort position)
  - `timestamps`: `createdAt`, `updatedAt`

- **Task Model:**
  - `title`: String (Required, text-indexed)
  - `description`: String (Text-indexed)
  - `projectId`: ObjectId (Ref: Project, indexed)
  - `boardId`: ObjectId (Ref: Board, indexed)
  - `status`: String (`todo` | `in_progress` | `done`, indexed)
  - `priority`: String (`low` | `medium` | `high` | `urgent`, indexed)
  - `assignedTo`: ObjectId (Ref: User, nullable, indexed)
  - `dueDate`: Date (Nullable)
  - `orderIndex`: Number (Sort position inside column)
  - `activityLogs`: Array of `{ user: ObjectId (Ref: User), action: String, timestamp: Date }`
  - `timestamps`: `createdAt`, `updatedAt`

- **Comment Model:**
  - `taskId`: ObjectId (Ref: Task, indexed)
  - `author`: ObjectId (Ref: User)
  - `content`: String (Required)
  - `timestamps`: `createdAt`, `updatedAt`

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- Node.js `v18+` or `v20+`
- MongoDB local instance or MongoDB Atlas connection URI
- npm / yarn / pnpm

### 1. Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd collab-project
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/collab_tool_db
CLIENT_URL=http://localhost:5173
ACCESS_TOKEN_SECRET=your_jwt_access_secret_12345
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_67890
```

Start the backend server:
```bash
npm run dev
```
- API Base URL: `http://localhost:5000/api/v1`
- Swagger Documentation: `http://localhost:5000/api-docs`

---

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the frontend application:
```bash
npm run dev
```
- Client runs at: `http://localhost:5173`

---

## 📋 REST API Documentation

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register a new user and issue tokens | Public |
| `POST` | `/login` | Authenticate user and issue access/refresh tokens | Public |
| `POST` | `/refresh` | Silent refresh token rotation (via HTTP-Only cookie) | Public (Cookie) |
| `POST` | `/logout` | Invalidate refresh token session and clear cookie | Private |
| `GET` | `/me` | Retrieve profile of the currently logged-in user | Private |

### Projects & Boards (`/api/v1/projects`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List all projects the user belongs to | Private |
| `POST` | `/` | Create project & auto-generate default Kanban boards | Private |
| `GET` | `/:projectId` | Fetch project details, members, and board columns | Member+ |
| `PATCH`| `/:projectId` | Update project title and description | Admin / Owner |
| `DELETE`|`/:projectId` | Delete project and cascade delete all boards/tasks/comments | Owner |
| `POST` | `/:projectId/invite` | Invite user to project by email | Admin / Owner |

### Tasks & Comments (`/api/v1/tasks` & `/api/v1/projects/:projectId/tasks`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:projectId/tasks` | Filter (status, priority, assignee), search, and paginate tasks | Member+ |
| `POST` | `/projects/:projectId/tasks` | Create a task in a board column | Member+ |
| `PATCH` | `/tasks/:taskId/status` | Update task status & Kanban column order index | Member+ |
| `PATCH` | `/tasks/:taskId` | Edit title, description, priority, assignee, due date | Member+ |
| `DELETE`| `/tasks/:taskId` | Delete a task | Member+ |
| `GET` | `/tasks/:taskId/comments` | List discussion comments for a task | Member+ |
| `POST` | `/tasks/:taskId/comments` | Post a comment and append to task activity history | Member+ |

---

## ⚡ Architecture Decisions & Scalability Proposals

### 1. Architecture Decisions
- **Token Rotation & Security:** Access tokens are kept in Redux memory (never in `localStorage` to protect against XSS). Refresh tokens are stored in secure `httpOnly`, `SameSite=Lax` cookies with server-side bcrypt hash verification to eliminate token reuse attacks.
- **Role-Based Access Control (RBAC):** Middleware-enforced permissions (`owner`, `admin`, `member`) attached to project memberships ensure secure operations before touching controllers.
- **Optimistic UI Updates:** Drag-and-drop actions update local Redux state instantly before background API synchronization completes, ensuring zero visual lag.

---

### 2. Caching Strategy (Proposed: Redis)
- **Cache-Aside Pattern for Read Heavy Endpoints:** `GET /projects/:projectId/tasks` is cached in Redis with a 10-minute TTL using composite query keys:
  `project:{projectId}:tasks:filter:{md5(queryParams)}`
- **Targeted Write-Through Invalidation:** When tasks are created, updated, reordered, or deleted, matching `project:{projectId}:*` cache keys are evicted immediately to ensure data consistency.

```text
Client Request ──► Redis Cache Hit? ──Yes──► Return cached JSON (~2ms)
                         │
                        No
                         ▼
                 Query MongoDB ──► Populate Redis (TTL 600s) ──► Return to Client
```

---

### 3. Background Job Processing (Proposed: BullMQ + Redis)
- **Task Assignment Notifications:** Offload email/push notification delivery from the Express HTTP cycle into a Redis-backed queue (`task-assignment-queue`), keeping endpoint response times under 30ms.
- **Batch Activity Log Flushing:** Instead of immediate single-document writes, high-volume audit logs can be pushed to an in-memory queue and flushed to MongoDB in batches every 5 seconds.
- **Dead-Letter Queue (DLQ):** Failed email jobs are retried up to 3 times with exponential backoff before routing to a DLQ for monitoring and alerts.