import mongoose from "mongoose";
import Balance from "../models/BalanceModel.js";
import Payment from "../models/PaymentModel.js";
import Expense from "../models/ExpenseModel.js";
import {
  getOrCreateBalance,
  updateBalanceAmount,
} from "../utils/balanceUtils.js";

// 1. Real-time hisoblangan balans (update bilan)
export const getRealBalance = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.params?.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId kerak" });
    }

    const { income, outcome, balance } = await updateBalanceAmount(userId);

    res.status(200).json({ income, outcome, balance });
  } catch (err) {
    console.error("Hisoblashda xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// 2. Qo‘lda balansga pul qo‘shish
export const increaseBalance = async (req, res) => {
  try {
    const { amount, userId } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Yaroqli userId va miqdor kerak" });
    }

    const balance = await getOrCreateBalance(userId);
    balance.amount += amount;
    balance.updatedAt = new Date();
    await balance.save();

    res.status(200).json({ message: "Balans oshirildi", balance });
  } catch (err) {
    console.error("increaseBalance xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// 3. Balansni real qiymatga sinxronizatsiya qilish (agar alohida chaqirmoqchi bo‘lsangiz)
export const syncBalanceToReal = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.params?.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId kerak" });
    }

    const {
      income,
      outcome,
      balance: realBalance,
    } = await updateBalanceAmount(userId);

    res.status(200).json({
      message: "Balans real qiymatga moslashtirildi",
      realBalance,
    });
  } catch (err) {
    console.error("syncBalanceToReal xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

