import express from "express";
import {
  createSalary,
  getAllSalaries,
  getSalaryByTeacherId,
  updateSalary,
  deleteSalary,
  getMonthlySalaryStats,
} from "../controllers/salaryController.js";

const router = express.Router();

// ⚠️ Bu yerda hech qanday authMiddleware (protect) ishlatilmayapti
router.post("/", createSalary); // maosh qo‘shish
router.get("/", getAllSalaries); // barcha maoshlar
router.get("/stats", getMonthlySalaryStats); // statistik grafik uchun
router.get("/:teacherId", getSalaryByTeacherId);
router.put("/:id", updateSalary); // yangilash
router.delete("/:id", deleteSalary); // o‘chirish

export default router;
