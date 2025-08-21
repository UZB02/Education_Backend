import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import columnRoutes from "./routes/columnRoutes.js";
import groupRouters from "./routes/groupRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import balanceRoutes from "./routes/balanceRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import teacherAuthRoutes from "./routes/teacherAuthRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import debttRoutes from "./routes/debtRoutes.js"
import parentRoutes from "./routes/parentRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";

// Admin / Super Admin routes
import adminAuthRoutes from "./routes/adminAuthRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// Admin / Super Admin routes
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/auth", authRoutes);
// boshqa route’lar bilan birga qo‘shasiz
app.use("/api/parents", parentRoutes);
// Routes
app.use("/api/columns", columnRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/groups", groupRouters);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/teacher-auth", teacherAuthRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/debtors",debttRoutes)
app.use("/api/progress", progressRoutes);
// Connect to DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    app.listen(process.env.PORT, () =>
      console.log(`✅ Server ${process.env.PORT} portda ishga tushdi`)
    )
  )
  .catch((err) => console.log(err));
