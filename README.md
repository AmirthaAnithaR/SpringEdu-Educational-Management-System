# SpringEdu

SpringEdu is a MERN stack-based educational management system developed for Spring Public School to streamline academic and administrative operations through a secure, responsive, and user-friendly web application.

---

## 1. Project Structure

```
├── backend/
│   ├── config/             # DB configurations
│   ├── controllers/        # Express handlers (auth, students, teachers, classes, marks, notices)
│   ├── models/             # Mongoose Schemas (User, Student, Teacher, Class, Subject, Attendance, Marks, Notices)
│   ├── routes/             # API Router links
│   ├── server.js           # Server boot entrypoint
│   └── .env.example        # Environment configuration template
│
└── frontend/
    ├── src/
    │   ├── AddStudent.jsx  # Student additions form (Admin)
    │   ├── AddTeacher.jsx  # Teacher additions form (Admin)
    │   ├── Login.jsx       # Universal login portal
    │   ├── AdminDashboard.jsx # Admin metrics overview
    │   ├── TeacherAttendance.jsx # Take & Edit attendance by Class/Section/Subject/Date
    │   ├── TeacherMarks.jsx # Enter & Edit student marks by exam type
    │   └── StudentDashboardHome.jsx # Student metrics (attendance rate, late days, subjects)
    └── index.html
```

---

## 2. Requirements & Setup

### Database
Ensure MongoDB is running locally on:
`mongodb://127.0.0.1:27017/student_management`

### Backend Setup
1. Navigate to the `backend/` directory.
2. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies and boot:
   ```bash
   npm install
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot the development bundler:
   ```bash
   npm run dev
   ```

---

## 3. Environment Configurations

Configure the backend `.env` with:
- `PORT`: Port the backend listens on (Defaults to `5000`).
- `MONGO_URI`: Connection URL to MongoDB (Defaults to `mongodb://127.0.0.1:27017/student_management`).
- `JWT_SECRET`: Secret hash token for JWT session signatures.

---

## 4. User Roles & Permissions

- **Administrator**:
  - Full CRUD operations over Student, Teacher, Class, and Subject collections.
  - Broadcast public notices.
  - Review aggregated student profiles and report audits.
- **Teacher**:
  - Open classes list details.
  - Take, save, and edit student attendance.
  - Input, update, and validate student marks.
- **Student**:
  - Read dashboard metrics (attendance percentage, late counters).
  - Inspect notice logs.
  - View exams result lists and academic subject configurations.

---

## 5. Deployment Instructions

1. **Build Production Assets**:
   Inside the `frontend` folder:
   ```bash
   npm run build
   ```
   This compiles assets into the `dist/` directory.
2. **Serve Built Frontend**:
   Serve static frontend assets via your proxy engine (e.g. Nginx) or configure the Express app to render the static `dist/` outputs.
3. **Start Node Server**:
   Launch production backend:
   ```bash
   NODE_ENV=production npm start
   ```
//admin@school.com
//admin123