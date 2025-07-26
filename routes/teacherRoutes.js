import express from "express";
import {
  getAllTeachers,
  createTeacher,
  deleteTeacher,
  addPointsToTeacher,
  updateTeacher,
   subtractPointsFromTeacher,
   getTeacherById// ✅ yangi funksiya
} from "../controllers/teacherController.js";

const router = express.Router();

router.get("/", getAllTeachers); // GET /api/teachers
router.post("/", createTeacher); // POST /api/teachers
router.delete("/:id", deleteTeacher); // DELETE /api/teachers/:id
router.get("/:id", getTeacherById);

router.post("/:id/add-points", addPointsToTeacher);// ✅ POST /api/teachers/:id/add-points 
router.post("/:id/subtract-points", subtractPointsFromTeacher);
router.put("/:id", updateTeacher);

export default router;
