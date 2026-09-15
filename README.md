# 🎓 SpringEdu – Educational Management System

SpringEdu is a web-based **Educational Management System** developed using the **MERN Stack**. It provides a centralized platform to manage students, teachers, classes, subjects, attendance, marks, and user access through role-based dashboards.

---

## 🚀 Features

### 👨‍💼 Admin
- Admin dashboard with overall academic statistics
- Student management
- Teacher management
- Class management
- Subject management
- Attendance management
- Marks management
- User and role management
- Reports and notices

### 👨‍🏫 Teacher
- Teacher dashboard
- View assigned classes and subjects
- Manage student attendance
- Manage academic marks
- View student information

### 👨‍🎓 Student
- Student dashboard
- View personal academic information
- View attendance summary
- View marks and academic performance
- View notices and related information

---

## 🛠️ Technology Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Vite

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- MongoDB
- MongoDB Compass

### Development Tools
- Visual Studio Code
- Git
- GitHub
- Thunder Client

---

## 🏗️ System Architecture

```text
User
  │
  ▼
React.js Frontend
  │
  ▼
REST API
  │
  ▼
Node.js + Express.js
  │
  ▼
MongoDB Database
  │
  ▼
Response
  │
  ▼
Dashboard / Reports


📂 Project Structure
SpringEdu/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   ├── services/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   └── package.json
│
└── README.md
