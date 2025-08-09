import express from "express";
import {
  importActiveApplications,
  getAllStudents,
  addStudent,
  deleteStudent,
  updateStudent,
  getStudentById,
  sendCustomMessage
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/", addStudent);
// Active applicationlarni studentsga qo'shish
router.post("/import", importActiveApplications);

// Barcha studentlarni olish
router.get("/:adminId", getAllStudents);
router.get("/byId/:id", getStudentById);
router.delete("/:id", deleteStudent); 
router.put("/:id", updateStudent);
router.post("/send-message", sendCustomMessage);

export default router;
