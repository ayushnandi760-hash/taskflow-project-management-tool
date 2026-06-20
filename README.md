# TaskFlow — Project Management Tool

A full-stack project management application with task tracking, Kanban boards, team collaboration, and user authentication.

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | HTML, CSS, JavaScript (Vanilla)     |
| Backend  | Node.js, Express.js                 |
| Database | MySQL                               |
| Auth     | JWT (JSON Web Tokens) + bcrypt      |

## Features

- **User Authentication** — Register, login, and JWT-based session management
- **Project Management** — Create, update, and delete projects
- **Task Tracking** — Assign tasks with priorities, statuses, and due dates
- **Kanban Board** — Drag-and-drop task management view
- **Team Collaboration** — Add members to projects with role-based access
- **User Profiles** — View and edit profile information

## Project Structure

```
Project Management Tool/
├── backend/
│   ├── config/          # Database & app configuration
│   ├── controllers/     # Route handler logic
│   ├── database/        # DB connection setup
│   ├── middleware/       # Auth & other middleware
│   ├── models/          # Data models
│   ├── routes/          # API route definitions
│   ├── server.js        # Express server entry point
│   └── .env.example     # Environment variable template
├── frontend/
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   ├── login.html       # Login page
│   ├── register.html    # Registration page
│   ├── projects.html    # Projects dashboard
│   ├── project-detail.html  # Single project view
│   ├── kanban.html      # Kanban board
│   └── profile.html     # User profile
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [MySQL](https://www.mysql.com/) (v8+)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/project-management-tool.git
cd project-management-tool
```

### 2. Set Up the Database

Create a MySQL database named `taskflow` (or whatever you set in `.env`):

```sql
CREATE DATABASE taskflow;
```

### 3. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your MySQL credentials and a secure JWT secret.

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Run Database Migrations

```bash
node migrate.js
node migrate-phase4.js
node migrate-phase6.js
```

### 6. Start the Server

```bash
npm run dev
```

The API server will start on `http://localhost:5000`.

### 7. Open the Frontend

Open any of the HTML files in the `frontend/` directory in your browser, or serve them with a local HTTP server:

```bash
npx serve frontend
```

## API Endpoints

| Method | Endpoint           | Description              |
| ------ | ------------------ | ------------------------ |
| POST   | `/api/users/register` | Register a new user   |
| POST   | `/api/users/login`    | Login & get JWT token |
| GET    | `/api/users/profile`  | Get user profile      |
| GET    | `/api/projects`       | List all projects     |
| POST   | `/api/projects`       | Create a project      |

## License

ISC
