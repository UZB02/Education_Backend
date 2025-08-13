import express from "express";
import {
  getMyStudents,
  markAttendance,
  getAttendanceHistory,
  getByGroupId,
  getAttendanceHistoryByGroupId,
  getAttendanceHistoryByGroup // <-- yangi funksiyani import qiling
} from "../controllers/attendanceController.js";
import { teacherAuth } from "../middleware/teacherAuthMiddleware.js";

const router = express.Router();

router.get("/my-students", teacherAuth, getMyStudents);
router.get("/:groupId", teacherAuth, getByGroupId); // <-- yangi route qo‘shildi
router.post("/mark", teacherAuth, markAttendance);
router.get("/history", teacherAuth, getAttendanceHistory);
router.get(
  "/history/:groupId",
  teacherAuth,
  getAttendanceHistoryByGroupId
);
router.get("/public-history/:groupId", getAttendanceHistoryByGroup);




export default router;
