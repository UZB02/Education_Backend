import express from "express";
import {
  parentLogin,
  getStudentPayments,
  getStudentAttendance,
  getChildren,
  // getChildGroups,
} from "../controllers/parentController.js";
import { parentAuth } from "../middleware/parentAuth.js";

const router = express.Router();

// 1️⃣ Login API (parentPhone + password orqali)
// Token yaratadi va ota-onaning barcha farzandlarini qaytaradi
router.post("/login", parentLogin);

// 2️⃣ Auth bilan himoyalangan yo‘llar
// JWT token orqali faqat login qilgan ota-ona kirishi mumkin

// Ota-onaning barcha farzandlari
router.get("/children", parentAuth, getChildren);

// Muayyan farzandning guruhlari
// router.get("/children/:id/groups", parentAuth, getChildGroups);

// Farzandning to‘lovlari
router.get("/payments/:id", parentAuth, getStudentPayments);

// Farzandning davomatlari
router.get("/attendance/:id", parentAuth, getStudentAttendance);

export default router;
