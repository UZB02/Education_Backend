import express from "express";
import {
  createProgress,
  getAllProgress,
  getStudentProgress,
  updateProgress,
  deleteProgress,
  getStudentMonthlyProgress,
  getStudentYearlyProgress,
  getGroupProgressStats
} from "../controllers/progressController.js";

const router = express.Router();

router.post("/", createProgress);         // yangi progress yaratish
router.get("/", getAllProgress);          // barcha progresslarni olish
router.get("/:id", getStudentProgress);   // bitta o‘quvchi progressi
router.get("/:id/monthly", getStudentMonthlyProgress);
router.get("/:id/yearly", getStudentYearlyProgress);
router.get("/group/stats", getGroupProgressStats);
router.put("/:id", updateProgress);       // progress yangilash
router.delete("/:id", deleteProgress);    // progress o‘chirish

export default router;
