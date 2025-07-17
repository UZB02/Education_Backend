import express from "express";
import {
  getAllTeachers,
  createTeacher,
  deleteTeacher,
} from "../controllers/teacherController.js";

const router = express.Router();

router.get("/", getAllTeachers); // GET /api/teachers
router.post("/", createTeacher); // POST /api/teachers
router.delete("/:id", deleteTeacher); // DELETE /api/teachers/:id

export default router;
