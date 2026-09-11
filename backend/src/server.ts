import "dotenv/config";

import express from "express";
import cors from "cors";
import { prisma } from './config/prisma.js'
import path from "node:path";
import helmet from "helmet";

// Route imports
import dashboardRoutes from "./routes/dashboardRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import gradRoutes from "./routes/gradeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js"
import userRoutes from "./routes/userRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";

const app = express();

// Security headers tailored for cross-origin API deployment
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

// Dynamic CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL?.replace(/\/$/, ""),
  "http://localhost:3000",
  "http://localhost:5000",
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
// Healthcheck Route
app.get("/", (_req, res) => {
  res.json({ message: "School communication API is running" });
});

// API Routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes); // Handles auth, forgot-password, reset-password
app.use(["/api/students", "/api/student"], studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/grades", gradRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/activities", activityRoutes);

app.use("/api/users", userRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// FIXED: Render uses PORT, not PORT0
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}

// Database Connection
// Database Connection & Server Start
async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to MongoDB Atlas");

    app.listen(PORT, HOST, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

startServer();

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
});