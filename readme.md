# Collaborative Project & Task Management Tool (Kanban)

A full-stack, enterprise-grade project management application featuring Role-Based Access Control (RBAC), drag-and-drop Kanban workflow, multi-attribute task filtering, activity audit trails, and automatic JWT access/refresh token rotation.

---

## 🛠 Tech Stack

- Frontend: React 18, TypeScript, Vite, Redux Toolkit (RTK), Tailwind CSS, @hello-pangea/dnd, Lucide React
- Backend: Node.js, Express.js (TypeScript), MongoDB, Mongoose ODM
- Security & Auth: JWT (Access Token in Redux memory + Refresh Token in HTTP-Only Cookie), bcryptjs, Cookie-Parser
- Validation: Zod (Request payload schema validation)
- API Documentation: Swagger UI (OpenAPI 3.0 via swagger-ui-express)

---

## 📖 API Documentation (Swagger UI)

Interactive OpenAPI 3.0 documentation is built directly into the backend server. It allows evaluators to inspect schemas, explore request/response models, and test live API endpoints directly from the browser.

- Swagger UI URL: http://localhost:5000/api-docs
- API Base Route: http://localhost:5000/api/v1

### Exploring Endpoints with Authentication in Swagger:
1. Navigate to /api-docs after starting the backend server.
2. Use the POST /auth/login or POST /auth/register endpoint to retrieve a valid JWT access token.
3. Click the green Authorize button at the top right of the Swagger UI.
4. Paste the accessToken into the BearerAuth field to authorize and test protected endpoints.

---

## 🏛 Database Schema & Entity Relationships

User (1) ───< ProjectMember >─── (N) Project (1) ───< (N) Board (1) ───< (N) Task (1) ───< (N) Comment

### Schema Definitions

- User Model:
  - name: String (Required, trimmed)
  - email: String (Required, unique, indexed, lowercase)
  - password: String (Hashed with bcryptjs)
  - avatarUrl: String (Optional)
  - refreshTokenHash: String (Hashed refresh token for rotation security)

- Project Model:
  - title: String (Required, trimmed)
  - description: String (Optional)
  - owner: ObjectId (Ref: User, indexed)
  - members: Array of { user: ObjectId, role: 'owner' | 'admin' | 'member' }

- Board Model (Kanban Columns):
  - title: String (e.g., "To Do", "In Progress", "Done")
  - projectId: ObjectId (Ref: Project, indexed)
  - orderIndex: Number (Column sort position)

- Task Model:
  - title: String (Required, text-indexed)
  - description: String (Text-indexed)
  - projectId: ObjectId (Ref: Project, indexed)
  - boardId: ObjectId (Ref: Board, indexed)
  - status: String (todo | in_progress | done, indexed)
  - priority: String (low | medium | high | urgent, indexed)
  - assignedTo: ObjectId (Ref: User, nullable, indexed)
  - dueDate: Date (Nullable)
  - orderIndex: Number (Sort position inside column)
  - activityLogs: Array of { user: ObjectId, action: String, timestamp: Date }

- Comment Model:
  - taskId: ObjectId (Ref: Task, indexed)
  - author: ObjectId (Ref: User)
  - content: String (Required)

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- Node.js v18+ or v20+
- MongoDB local instance or MongoDB Atlas connection URI

### 1. Clone the Repository
    git clone <YOUR_GITHUB_REPO_URL>
    cd collab-project

### 2. Backend Setup
    cd backend
    npm install

Create a .env file in the backend/ directory:
    PORT=5000
    NODE_ENV=development
    MONGO_URI=mongodb://127.0.0.1:27017/collab_tool_db
    CLIENT_URL=http://localhost:5173
    ACCESS_TOKEN_SECRET=your_jwt_access_secret_12345
    REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_67890

Start the backend server:
    npm run dev

### 3. Frontend Setup
    cd ../frontend
    npm install

Create a .env file in the frontend/ directory:
    VITE_API_BASE_URL=http://localhost:5000/api/v1

Start the frontend application:
    npm run dev

---

## 📋 REST API Summary

### Authentication (/api/v1/auth)
- POST /register : Register a new user and issue tokens
- POST /login : Authenticate user and issue access/refresh tokens
- POST /refresh : Silent refresh token rotation (via HTTP-Only cookie)
- POST /logout : Invalidate refresh token session and clear cookie
- GET /me : Retrieve profile of the currently logged-in user

### Projects & Boards (/api/v1/projects)
- GET / : List all projects the user belongs to
- POST / : Create project & auto-generate default Kanban boards
- GET /:projectId : Fetch project details, members, and board columns
- PATCH /:projectId : Update project title and description
- DELETE /:projectId : Delete project and cascade delete all boards/tasks/comments
- POST /:projectId/invite : Invite user to project by email

### Tasks & Comments (/api/v1/projects/:projectId/tasks)
- GET /projects/:projectId/tasks : Filter, search, and paginate tasks
- POST /projects/:projectId/tasks : Create a task in a board column
- PATCH /tasks/:taskId/status : Update task status & Kanban column order index
- PATCH /tasks/:taskId : Edit title, description, priority, assignee, due date
- DELETE /tasks/:taskId : Delete a task
- GET /tasks/:taskId/comments : List discussion comments for a task
- POST /tasks/:taskId/comments : Post a comment and append to task activity history

---

## ⚡ Architecture Decisions & Scalability Proposals

### 1. Architecture Decisions
- Token Rotation & Security: Access tokens are kept in Redux memory (never in localStorage to protect against XSS). Refresh tokens are stored in secure httpOnly cookies with server-side bcrypt hash verification.
- Role-Based Access Control (RBAC): Middleware-enforced permissions (owner, admin, member) attached to project memberships ensure secure operations before touching controllers.
- Optimistic UI Updates: Drag-and-drop actions update local Redux state instantly before background API synchronization completes, ensuring zero visual lag.

### 2. Caching Strategy (Proposed: Redis)
- Cache-Aside Pattern for Read Heavy Endpoints: GET /projects/:projectId/tasks is cached in Redis with a 10-minute TTL using composite query keys.
- Targeted Write-Through Invalidation: When tasks are created, updated, reordered, or deleted, matching cache keys are evicted immediately to ensure data consistency.

### 3. Background Job Processing (Proposed: BullMQ + Redis)
- Task Assignment Notifications: Offload email/push notification delivery from the Express HTTP cycle into a Redis-backed queue to keep endpoint response times under 30ms.
- Batch Activity Log Flushing: High-volume audit logs can be pushed to an in-memory queue and flushed to MongoDB in batches every 5 seconds.
- Dead-Letter Queue (DLQ): Failed email jobs are retried up to 3 times with exponential backoff before routing to a DLQ for monitoring and alerts.