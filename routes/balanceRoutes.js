import express from "express";
import {
  getRealBalance,
  increaseBalance,
  syncBalanceToReal,
} from "../controllers/balanceController.js";

const router = express.Router();

// 1. Real balansni olish (query orqali filterlash mumkin)
router.get("/real", getRealBalance);
// Misol: /api/balance/real?userId=123&type=month&month=8&year=2025

// 2. Balansni qo'lda oshirish
router.post("/increase", increaseBalance);

// 3. Balansni real qiymatga sinxronizatsiya qilish
router.post("/sync", syncBalanceToReal);

export default router;
