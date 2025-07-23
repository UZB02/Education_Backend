import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import columnRoutes from "./routes/columnRoutes.js";
import groupRouters from "./routes/groupRoutes.js"
import teacherRoutes  from "./routes/teacherRoutes.js"
import studentRoutes from "./routes/studentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import balanceRoutes from "./routes/balanceRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import { getOrCreateBalance } from "./utils/balanceUtils.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/columns", columnRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/groups", groupRouters);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api/expense", expenseRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    app.listen(process.env.PORT, () =>
      console.log(`✅ Server ${process.env.PORT} portda ishga tushdi`)
    )
  )
  .catch((err) => console.log(err));

  await getOrCreateBalance();
