const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const classRoutes = require("./routes/classRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const marksRoutes = require("./routes/marksRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
// Load env early (explicit backend .env)
dotenv.config({ path: path.join(__dirname, ".env") });

// Connect MongoDB
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Simple request logger to help debug incoming requests
app.use((req, res, next) => {
  console.log('HTTP', req.method, req.originalUrl);
  next();
});
console.log("Registering auth routes...");
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/", (req, res) => {
  res.send("SpringEdu Backend is Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
