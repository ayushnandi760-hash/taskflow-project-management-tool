<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
</p>

# 🚀 TaskFlow — Project Management Tool

**TaskFlow** is a full-stack project management application built from scratch with **Node.js**, **Express**, **MySQL**, and a **vanilla HTML/CSS/JS** frontend. It features JWT authentication, full CRUD for projects and tasks, a drag-and-drop Kanban board, team collaboration, task comments, and an activity log — all wrapped in a modern glassmorphism UI with smooth animations.

---

## ✨ Features

### 🔐 Phase 1 — Authentication
- User registration with input validation
- Secure login with **bcrypt** password hashing
- **JWT**-based session management (30-day tokens)
- Protected routes via auth middleware
- Password visibility toggle & form animations

### 📁 Phase 2 — Project Management
- Create, read, update, and delete projects
- Projects scoped to the authenticated user
- Project dashboard with search & card-based layout

### 👥 Phase 3 — Team Collaboration
- Add members to projects by email
- View all members of a project
- Remove members (owner-only action)
- Role-based access control (Owner vs Member)

### ✅ Phase 4 — Task Management
- Full CRUD for tasks within projects
- Assign tasks to project members
- Set **priority** (Low / Medium / High) and **status** (To Do / In Progress / Completed)
- Due date tracking
- Filter, sort, and search tasks

### 📋 Phase 5 — Kanban Board
- Visual drag-and-drop board with three columns: **To Do → In Progress → Completed**
- Real-time status updates on card drop
- Priority badges and assignee indicators
- Responsive board layout with smooth drag animations

### 💬 Phase 6 — Comments & Activity Log
- Comment on individual tasks
- View comment threads with timestamps and author info
- Delete your own comments
- Automatic **activity log** tracking all actions in a project
- Activity timeline feed on the project detail page

---

## 🛠️ Tech Stack

| Layer        | Technology                                     |
| ------------ | ---------------------------------------------- |
| **Frontend** | HTML5, CSS3 (Glassmorphism), Vanilla JavaScript |
| **Backend**  | Node.js, Express.js                            |
| **Database** | MySQL 8+                                       |
| **Auth**     | JWT (jsonwebtoken) + bcryptjs                  |
| **Dev Tool** | Nodemon (auto-restart on changes)              |

---

## 📂 Project Structure

```
taskflow/
│
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js      # Register & Login logic
│   │   ├── userController.js      # User profile
│   │   ├── projectController.js   # Project CRUD
│   │   ├── projectMemberController.js  # Team member management
│   │   ├── taskController.js      # Task CRUD
│   │   ├── commentController.js   # Task comments
│   │   └── activityController.js  # Activity log feed
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification guard
│   │   └── errorMiddleware.js     # Global error handler + 404
│   ├── models/
│   │   ├── userModel.js           # User DB queries
│   │   ├── projectModel.js        # Project DB queries
│   │   ├── projectMemberModel.js  # Member DB queries
│   │   ├── taskModel.js           # Task DB queries
│   │   ├── commentModel.js        # Comment DB queries
│   │   └── activityModel.js       # Activity log DB queries
│   ├── routes/
│   │   ├── authRoutes.js          # POST /register, /login
│   │   ├── userRoutes.js          # GET /profile
│   │   ├── projectRoutes.js       # Project + Member + Activity routes
│   │   ├── taskRoutes.js          # Task + Comment routes
│   │   ├── commentRoutes.js       # Nested comment routes
│   │   └── activityRoutes.js      # Nested activity routes
│   ├── migrate.js                 # Phase 2+3 migration (projects, members)
│   ├── migrate-phase4.js          # Phase 4 migration (tasks)
│   ├── migrate-phase6.js          # Phase 6 migration (comments, activity)
│   ├── server.js                  # Express entry point
│   ├── package.json
│   └── .env.example               # Environment variable template
│
├── frontend/
│   ├── css/
│   │   ├── style.css              # Global styles + auth pages
│   │   ├── projects.css           # Projects dashboard
│   │   ├── tasks.css              # Task list & detail view
│   │   ├── kanban.css             # Kanban board styles
│   │   └── phase6.css             # Comments & activity styles
│   ├── js/
│   │   ├── login.js               # Login form logic
│   │   ├── register.js            # Registration form logic
│   │   ├── profile.js             # Profile page logic
│   │   ├── projects.js            # Project dashboard logic
│   │   ├── project-detail.js      # Single project view
│   │   ├── tasks.js               # Task management logic
│   │   ├── kanban.js              # Drag-and-drop Kanban logic
│   │   └── phase6.js              # Comments & activity logic
│   ├── login.html
│   ├── register.html
│   ├── projects.html
│   ├── project-detail.html
│   ├── kanban.html
│   └── profile.html
│
├── .gitignore
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** v16 or higher — [Download](https://nodejs.org/)
- **MySQL** v8 or higher — [Download](https://dev.mysql.com/downloads/)
- **Git** — [Download](https://git-scm.com/)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/taskflow-project-management-tool.git
cd taskflow-project-management-tool
```

### 2️⃣ Create the Database

Open MySQL and create the database:

```sql
CREATE DATABASE taskflow;
```

Also make sure the `users` table exists (Phase 1):

```sql
USE taskflow;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3️⃣ Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskflow
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d
```

### 4️⃣ Install Dependencies

```bash
cd backend
npm install
```

### 5️⃣ Run Database Migrations

Run these **in order** — each phase depends on the previous tables:

```bash
node migrate.js           # Creates: projects, project_members
node migrate-phase4.js    # Creates: tasks
node migrate-phase6.js    # Creates: task_comments, activity_log
```

### 6️⃣ Start the Server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The server will start at **http://localhost:5000**

### 7️⃣ Open the App

Navigate to `http://localhost:5000` in your browser — it will serve the login page automatically.

---

## 📡 API Reference

All protected routes require the header:
```
Authorization: Bearer <your_jwt_token>
```

### 🔐 Authentication (Public)

| Method | Endpoint             | Description             | Body                                      |
| ------ | -------------------- | ----------------------- | ----------------------------------------- |
| POST   | `/api/auth/register` | Register a new account  | `{ name, email, password }`               |
| POST   | `/api/auth/login`    | Login & receive JWT     | `{ email, password }`                     |

### 👤 User (Protected)

| Method | Endpoint             | Description             |
| ------ | -------------------- | ----------------------- |
| GET    | `/api/users/profile` | Get current user info   |

### 📁 Projects (Protected)

| Method | Endpoint              | Description            | Body                       |
| ------ | --------------------- | ---------------------- | -------------------------- |
| POST   | `/api/projects`       | Create a project       | `{ name, description }`   |
| GET    | `/api/projects`       | List all your projects | —                          |
| GET    | `/api/projects/:id`   | Get project details    | —                          |
| PUT    | `/api/projects/:id`   | Update a project       | `{ name, description }`   |
| DELETE | `/api/projects/:id`   | Delete a project       | —                          |

### 👥 Project Members (Protected)

| Method | Endpoint                             | Description          | Body           |
| ------ | ------------------------------------ | -------------------- | -------------- |
| POST   | `/api/projects/:id/members`          | Add member by email  | `{ email }`    |
| GET    | `/api/projects/:id/members`          | List all members     | —              |
| DELETE | `/api/projects/:id/members/:userId`  | Remove a member      | —              |

### ✅ Tasks (Protected)

| Method | Endpoint                   | Description               | Body                                                                    |
| ------ | -------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| POST   | `/api/tasks`               | Create a task             | `{ project_id, title, description, priority, status, due_date, assigned_to }` |
| GET    | `/api/tasks?project_id=5`  | Get tasks for a project   | —                                                                       |
| PUT    | `/api/tasks/:id`           | Update a task             | `{ title, description, priority, status, due_date, assigned_to }`       |
| DELETE | `/api/tasks/:id`           | Delete a task             | —                                                                       |

### 💬 Comments (Protected)

| Method | Endpoint                                | Description           | Body            |
| ------ | --------------------------------------- | --------------------- | --------------- |
| POST   | `/api/tasks/:id/comments`               | Add a comment         | `{ comment }`   |
| GET    | `/api/tasks/:id/comments`               | Get all comments      | —               |
| DELETE | `/api/tasks/:id/comments/:commentId`    | Delete your comment   | —               |

### 📊 Activity Log (Protected)

| Method | Endpoint                         | Description              |
| ------ | -------------------------------- | ------------------------ |
| GET    | `/api/projects/:id/activity`     | Get project activity feed |

---

## 🗄️ Database Schema

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │    projects      │       │    tasks     │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id       PK  │◄──┐   │ id           PK  │◄──┐   │ id       PK  │
│ name         │   │   │ name             │   │   │ project_id FK│──► projects
│ email    UQ  │   │   │ description      │   │   │ assigned_to FK│──► users
│ password     │   └───│ created_by   FK  │   │   │ title        │
│ created_at   │       │ created_at       │   │   │ description  │
└──────────────┘       └──────────────────┘   │   │ priority     │
                                              │   │ status       │
┌──────────────────┐                          │   │ due_date     │
│ project_members  │                          │   │ created_at   │
├──────────────────┤                          │   └──────────────┘
│ id           PK  │                          │
│ project_id   FK  │──► projects              │   ┌──────────────────┐
│ user_id      FK  │──► users                 │   │  task_comments   │
│ joined_at        │                          │   ├──────────────────┤
└──────────────────┘                          │   │ id           PK  │
                                              │   │ task_id      FK  │──► tasks
┌──────────────────┐                          │   │ user_id      FK  │──► users
│  activity_log    │                          │   │ comment          │
├──────────────────┤                          │   │ created_at       │
│ id           PK  │                          │   └──────────────────┘
│ project_id   FK  │──► projects              │
│ user_id      FK  │──► users                 │
│ action           │                          │
│ created_at       │                          │
└──────────────────┘                          │
```

---

## 🎨 UI Highlights

- **Glassmorphism** design with frosted-glass cards and layered depth
- **Animated backgrounds** with floating particles
- **Smooth transitions** on form inputs, buttons, and page navigation
- **Drag-and-drop** Kanban board with visual feedback
- **Toast notifications** for success/error messages
- **Responsive layout** that adapts to different screen sizes
- **Skeleton loaders** for a polished loading experience

---

## 📋 Environment Variables

| Variable       | Description                    | Default                        |
| -------------- | ------------------------------ | ------------------------------ |
| `PORT`         | Server port                    | `5000`                         |
| `DB_HOST`      | MySQL host                     | `localhost`                    |
| `DB_USER`      | MySQL username                 | `root`                         |
| `DB_PASSWORD`  | MySQL password                 | —                              |
| `DB_NAME`      | Database name                  | `taskflow`                     |
| `JWT_SECRET`   | Secret key for signing JWTs    | —                              |
| `JWT_EXPIRE`   | Token expiration duration      | `30d`                          |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Built with ❤️ using Node.js, Express, MySQL & Vanilla JS
</p>
