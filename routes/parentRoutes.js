import express from "express";
import {
  parentLogin,
  getStudentPayments,
  getStudentAttendance,
  getChildren,
  getChildGroups
} from "../controllers/parentController.js";
import { parentAuth } from "../middleware/parentAuth.js";

const router = express.Router();

// Login (token yaratadi)
router.post("/login", parentLogin);
// Farzandlar ro‘yxati (token orqali)
router.get("/children", parentAuth, getChildren);
router.get("/children/:id/groups", parentAuth, getChildGroups);

// 🔒 Auth bilan himoyalangan yo‘llar
router.get("/payments/:id", parentAuth, getStudentPayments);
router.get("/attendance/:id", parentAuth, getStudentAttendance);

export default router;
