import express from "express";
import {
  addExpense,
  getAllExpenses,
  deleteExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

// POST /api/expense - yangi chiqim
router.post("/", addExpense);

// GET /api/expense - barcha chiqimlar
router.get("/", getAllExpenses);

// DELETE /api/expense/:id - chiqimni o‘chirish
router.delete("/:id", deleteExpense);

export default router;
