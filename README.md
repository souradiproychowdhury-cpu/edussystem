# EduPulse University SMS

A full-stack **Student Management System** built with **React + Vite + TypeScript + Tailwind CSS** (frontend) and **Node.js + Express + MongoDB/Mongoose** (backend). It includes role-based access for **Admin, Teacher, and Student** users and modules for dashboard, students, teachers, departments, courses, attendance, examinations/results, fees, timetable, and notifications.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Axios, React Hook Form, Zod, Recharts, Framer Motion, Lucide React, react-hot-toast
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, express-validator, CORS, dotenv, morgan
- **Auth:** JWT-based authentication with role-based route protection

## Project Structure

```text
backend/    # Express API, Mongoose models, controllers, routes, seed script
frontend/   # React + Vite client application
```

## Prerequisites

- **Node.js** v18+ (tested with newer Node versions)
- **npm**
- **MongoDB** running locally or a MongoDB Atlas connection string

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create/update `backend/.env` (an example is provided in `backend/.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/edupulse_sms
JWT_SECRET=change_this_to_a_strong_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SEED_ADMIN_EMAIL=admin@edupulse.edu
SEED_ADMIN_PASSWORD=Admin@123
SEED_TEACHER_EMAIL=teacher@edupulse.edu
SEED_TEACHER_PASSWORD=Teacher@123
SEED_STUDENT_EMAIL=student@edupulse.edu
SEED_STUDENT_PASSWORD=Student@123
```

Seed demo data:

```bash
npm run seed
```

Start the API server:

```bash
npm run dev
# or
npm start
```

Backend runs on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd frontend
npm install
```

Create/update `frontend/.env` (see `frontend/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend dev server:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Demo Credentials

After running `npm run seed` in `backend/`:

- **Admin:** `admin@edupulse.edu` / `Admin@123`
- **Teacher:** `teacher@edupulse.edu` / `Teacher@123`
- **Student:** `student@edupulse.edu` / `Student@123`

(If you changed seed values in `.env`, use those credentials instead.)

## Main Features

- **Authentication:** Login, register, forgot-password request flow, JWT session handling, protected routes
- **Dashboard:** Role-aware statistics, charts, recent activity, quick actions
- **Students:** CRUD, search/filter/sort/pagination, profile/detail view with attendance, results, and fees
- **Teachers:** CRUD, department and subject assignment
- **Departments & Courses:** CRUD, department-wise details, course assignment
- **Attendance:** Date/semester/course-based marking (Present/Absent/Late), records, summaries/analytics, student view
- **Examinations & Results:** Exam scheduling, marks entry, grade/pass-fail calculation, result records
- **Fees:** Fee records, payments, pending/paid tracking, printable receipt view
- **Timetable:** Weekly schedule view with admin create/update/delete
- **Notifications:** Role/user notifications, read/unread tracking, admin create/delete
- **UI/UX:** Responsive layout, dark mode toggle, reusable modals/forms/tables/cards, toast feedback

## API Overview

Base URL: `http://localhost:5000/api`

- `/auth` - register, login, profile, forgot/reset password
- `/dashboard` - dashboard stats
- `/students` - student CRUD and details
- `/teachers` - teacher CRUD
- `/departments` - department CRUD
- `/courses` - course CRUD
- `/attendance` - mark/list/update attendance and summaries
- `/examinations` - examination CRUD
- `/results` - result CRUD/listing
- `/fees` - fee records, payments, receipts
- `/timetables` - timetable CRUD
- `/notifications` - notifications, read/read-all, admin actions

Most non-auth routes require `Authorization: Bearer <token>`.

## Deployment Notes

- **Frontend (Vercel):** set project root/build to `frontend`, build command `npm run build`, output `dist`, and configure `VITE_API_URL` to your deployed backend API URL.
- **Backend (Render/Railway/etc.):** deploy `backend`, set environment variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, etc.), and run `npm start`.
- **Database (MongoDB Atlas):** create a cluster, whitelist/render network access as needed, and use the Atlas connection string as `MONGO_URI`.

## Notes

- Ensure MongoDB is running before starting the backend or seeding data.
- For production, replace default JWT secret and credentials with secure values.
