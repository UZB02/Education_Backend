import express from "express";
import {
  importActiveApplications,
  getAllStudents,
} from "../controllers/studentController.js";

const router = express.Router();

// Active applicationlarni studentsga qo'shish
router.post("/import", importActiveApplications);

// Barcha studentlarni olish
router.get("/:adminId", getAllStudents);

export default router;
