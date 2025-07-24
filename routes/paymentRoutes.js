import express from "express";
import {
  addPayment,
  getPaymentsByStudent,
  getAllPayments,
  updatePayment,
  deletePayment,
  getStudentPaymentHistory,
} from "../controllers/paymentController.js";

const router = express.Router();

// POST /api/payments – yangi to‘lov qo‘shish
router.post("/", addPayment);

// GET /api/payments/history/:studentId – to‘lovlar tarixi (umumiy)
router.get("/history/:studentId", getStudentPaymentHistory);

// GET /api/payments/student/:studentId – o‘quvchining barcha to‘lovlari
router.get("/student/:studentId", getPaymentsByStudent);

// GET /api/payments – barcha to‘lovlar
router.get("/", getAllPayments);

// PUT /api/payments/:id – to‘lovni yangilash
router.put("/:id", updatePayment);

// DELETE /api/payments/:id – to‘lovni o‘chirish
router.delete("/:id", deletePayment);

export default router;
