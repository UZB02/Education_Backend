import express from "express";
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";
import { teacherAuth } from "../middleware/teacherAuthMiddleware.js"; // 🔹

const router = express.Router();

// 🔒 Faqat o'qituvchi uchun
router.use(teacherAuth);

// /api/subjects
router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
