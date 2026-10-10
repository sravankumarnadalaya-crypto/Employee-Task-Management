# Employee Task Management — MERN Stack

A full-stack task management project using MongoDB, Express, React, and Node.js.

## Features
- JWT login and role-based authorization (Admin / Employee)
- Admin can add, list, edit, and delete employee records
- Admin can create, assign, update, and delete tasks
- Employees can view their assigned tasks and update task status
- Priority, deadline, task status, dashboard summary, search, and filters
- Responsive React dashboard

## Requirements
- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas connection string
- VS Code (recommended)

## 1. Start MongoDB
Option A: Install MongoDB Community Server and make sure the MongoDB service is running.
Option B: Create a MongoDB Atlas database and use its connection string.

## 2. Configure backend
Open a terminal in the project root:
```bash
cd backend
npm install
```
Copy `.env.example` to `.env`, then edit `.env` and set `MONGODB_URI` and a private `JWT_SECRET`.
The default local MongoDB URI works if MongoDB is running on your computer. The app creates the first admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD` when the server starts and that account doesn't already exist.

Start backend:
```bash
npm run dev
```
API runs at http://localhost:5000

Default first admin credentials from the example:
- Email: `admin@example.com`
- Password: `Admin@12345`

Change these in `.env` before using the project beyond a local demo.

## 3. Start frontend
Open a second terminal from the project root:
```bash
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite, usually http://localhost:5173.

## How to demo
1. Sign in with the configured admin credentials.
2. Open Employees → Add employee. Set an employee name, email, and temporary password (minimum 8 characters).
3. Open Tasks → Assign a task, choose an employee, priority, and deadline.
4. Log out and sign in with the employee account.
5. Employee can view their own tasks and update status.
6. Log back in as admin to edit or delete tasks and manage employees.

## API endpoints
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/employees` (admin)
- `POST /api/employees` (admin)
- `PUT /api/employees/:id` (admin)
- `DELETE /api/employees/:id` (admin)
- `GET /api/tasks` (admin: all tasks; employee: assigned tasks)
- `POST /api/tasks` (admin)
- `PUT /api/tasks/:id` (admin: task fields; employee: status only on own task)
- `DELETE /api/tasks/:id` (admin)
- `GET /api/health`

## Notes
- Do not publish `.env` or commit real secrets to source control.
- This is an educational starter project. Before production use, add password reset, audit logging, rate limiting, stricter CORS, and additional tests.
