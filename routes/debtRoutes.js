import express from "express";
import { getTotalDebtors } from "../controllers/debtController.js";
import authMiddleware  from "../middleware/authMiddleware.js";

const router = express.Router();

// Faqat login bo‘lgan admin ko‘rishi mumkin
router.get("/total", authMiddleware, getTotalDebtors);

export default router;
