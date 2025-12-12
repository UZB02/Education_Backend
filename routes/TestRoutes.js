import express from "express";
import {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  addQuestionToTest,
  generateTestLink,
  getTestResults,
  getTestByLink,
  submitTestAnswers,
  updateQuestionInTest
} from "../controllers/testController.js";

import { teacherAuth } from "../middleware/teacherAuthMiddleware.js";

const router = express.Router();

/**
 * ===============================
 *  O‘QITUVCHI ROUTELARI (Auth bilan)
 * ===============================
 */

router.get("/", teacherAuth, getAllTests);
router.get("/:id", teacherAuth, getTestById);
router.post("/", teacherAuth, createTest);
router.put("/:id", teacherAuth, updateTest);
router.delete("/:id", teacherAuth, deleteTest);
router.post("/:testId/questions", teacherAuth, addQuestionToTest);
// Bitta savolni yangilash
router.put("/:testId/questions/:questionId", teacherAuth, updateQuestionInTest);

// Testga unikal havola yaratish
router.post("/:id/generate-link", teacherAuth, generateTestLink);

// Natijalar
router.get("/:id/results", teacherAuth, getTestResults);
/**
 * ===============================
 *  O‘QUVCHI ROUTELARI (Auth YO‘Q!)
 * ===============================
 */

// Testga token orqali kirish
router.get("/link/:token", getTestByLink);

// Javob yuborish
router.post("/link/:token/submit", submitTestAnswers);

export default router;
