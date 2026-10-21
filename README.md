# CampusBoard: A Role-Based Collaborative Workspace for Academic Projects

CampusBoard brings the whole university project lifecycle into **one open-source workspace**. Today, student projects are scattered across Slack or WhatsApp (communication), GitHub (code), Google Drive (documents), spreadsheets (task tracking) and a generic LMS (grading). CampusBoard replaces that fragmentation with a single board where students track work, attach their repository and documents, discuss with their guide, and receive faculty review and grades.

| Problem (scattered tools) | CampusBoard feature |
| :--- | :--- |
| Task tracking in spreadsheets / chat | Kanban board: **To Do → In Progress → Under Review → Completed** |
| Code on GitHub, reports on Drive | **Repository and document links** attached to each task |
| Discussions lost in WhatsApp groups | **Comment thread** on every task |
| Faculty review by e-mail | **Under Review** column + faculty **grade (0–100) and feedback** |
| Grades kept in separate sheets | **Analytics**: average grade, review queue, student workload |
| Anyone can join with any e-mail | **Role by campus domain**, accounts created only by faculty |

---

## Roles

| Role | E-mail domain | Can do |
| :--- | :--- | :--- |
| **Faculty** | `*@faculty.campusboard.edu` | Create accounts and projects, enrol students, create/assign/edit/delete tasks, review and grade work, view analytics |
| **Student** | `*@student.campusboard.edu` | View enrolled projects, log progress, move tasks up to *Under Review*, attach repo/document links, comment |

Only faculty can mark work **Completed**, which happens when they submit a grade. Students cannot skip the review step.

---

## Open-source technology stack

| Layer | Technology | Licence |
| :--- | :--- | :--- |
| Runtime | Node.js | MIT |
| Web framework | Express 5 | MIT |
| Database | MongoDB Community Server | SSPL |
| ODM | Mongoose | MIT |
| Authentication | jsonwebtoken (JWT) | MIT |
| Password hashing | bcryptjs | MIT |
| Configuration | dotenv | BSD-2-Clause |
| Styling | Tailwind CSS | MIT |
| Charts | Chart.js | MIT |
| Icons | Bootstrap Icons | MIT |
| Containers | Docker / Docker Compose | Apache-2.0 |
| **CampusBoard itself** | — | **MIT** |

---

## Architecture

```mermaid
flowchart TD
    subgraph Client["Browser (HTML + JavaScript + Tailwind)"]
        UI["Board · Analytics · Directory"]
    end
    subgraph Server["Node.js + Express API"]
        MW["authenticate (JWT) · authorizeRoles('Admin' = Faculty)"]
        R1["/api/auth"]
        R2["/api/workspaces (projects)"]
        R3["/api/tasks"]
    end
    subgraph DB["MongoDB"]
        U[("users")]
        W[("workspaces")]
        T[("tasks + comments")]
    end
    Client -- "REST / JSON + Bearer token" --> MW
    MW --> R1 & R2 & R3
    R1 --> U
    R2 --> W
    R3 --> T
```

### Task lifecycle

```mermaid
stateDiagram-v2
    direction LR
    [*] --> ToDo
    state "To Do" as ToDo
    state "In Progress" as InProgress
    state "Under Review" as Review
    ToDo --> InProgress: student
    InProgress --> Review: student submits
    Review --> InProgress: changes requested
    Review --> Completed: faculty grades
    Completed --> [*]
```

---

## API reference

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Sign in, returns JWT |
| `POST` | `/api/auth/provision` | Faculty | Create a student or faculty account |
| `GET` | `/api/auth/users` | Signed in | Campus directory |
| `GET` | `/api/workspaces` | Signed in | My projects |
| `POST` | `/api/workspaces` | Faculty | Create a project |
| `POST` | `/api/workspaces/:id/members` | Owner / Faculty | Enrol a student |
| `GET` | `/api/tasks/workspace/:id` | Project members | Tasks of a project |
| `POST` | `/api/tasks` | Project members | Create a task / progress log |
| `PATCH` | `/api/tasks/:id/status` | Project members | Move a task (only faculty can set *Completed*) |
| `PATCH` | `/api/tasks/:id/links` | Project members | Attach repository / document links |
| `PATCH` | `/api/tasks/:id/review` | Faculty | Grade (0–100) + feedback, marks Completed |
| `POST` | `/api/tasks/:id/comments` | Project members | Add a comment |
| `PUT` | `/api/tasks/:id` | Owner / Faculty | Edit task details |
| `DELETE` | `/api/tasks/:id` | Owner / Faculty | Delete a task |

---

## Getting started

### Prerequisites
- Node.js (>= 18)
- MongoDB (running locally or a MongoDB Atlas URI)

### Setup & Run

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env        # edit values if needed (PORT=5050 or PORT=5000)

# 4. Populate demo data (optional, wipes existing collections first)
npm run seed

# 5. Start the development server
npm run dev                 # or: npm start
```

Visit **`http://localhost:5050`** (or your configured `PORT`) in your browser. It will automatically redirect to the Sign In page.

### Demo accounts (after `npm run seed`)

| Role | E-mail | Password |
| :--- | :--- | :--- |
| Faculty | `meera@faculty.campusboard.edu` | `FacultyPass123!` |
| Student | `aarav@student.campusboard.edu` (and 5 others: `diya`, `kabir`, `isha`, `rohan`, `sneha`) | `StudentPass123!` |

> These are demo credentials for local use only. Change `JWT_SECRET` and the root password before deploying.

---

## Project structure

```text
campusboard/
├── backend/
│   ├── config/db.js            # MongoDB connection helper
│   ├── middleware/auth.js      # JWT authentication & role authorization
│   ├── models/                 # User, Workspace (project), Task (+ comments, links, grade)
│   ├── routes/                 # authRoutes, workspaceRoutes, taskRoutes
│   ├── seedData.js             # Demo data seeder
│   ├── seedAdmin.js            # Root faculty admin seeder
│   ├── server.js               # Express entry point & static frontend hosting
│   ├── package.json
│   └── .env.example
├── frontend/                   # Client-side UI & static assets
│   ├── css/                    # Stylesheets, theme, variables
│   ├── js/                     # Client application scripts (dashboard, analytics, etc.)
│   ├── signin.html             # Login portal
│   ├── dashboard.html          # Kanban workspace board
│   ├── analytics.html          # Performance & progress metrics
│   └── members.html            # Campus member directory
└── LICENSE · CONTRIBUTING.md · CODE_OF_CONDUCT.md · README.md
```

## Contributing

Pull requests are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

## Licence

Released under the [MIT Licence](LICENSE).
