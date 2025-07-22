import express from "express";
import {
  importActiveApplications,
  getAllStudents,
  addStudent,
  deleteStudent,
  updateStudent
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/", addStudent);
// Active applicationlarni studentsga qo'shish
router.post("/import", importActiveApplications);

// Barcha studentlarni olish
router.get("/:adminId", getAllStudents);
router.delete("/:id", deleteStudent); 
router.put("/:id", updateStudent);

export default router;
