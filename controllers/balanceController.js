import mongoose from "mongoose";
import Payment from "../models/PaymentModel.js";
import Expense from "../models/ExpenseModel.js";
import { getOrCreateBalance } from "../utils/balanceUtils.js";

// 1. Real-time hisoblangan balans (foydalanuvchiga tegishli)
export const getRealBalance = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.params?.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId kerak" });
    }

    const payments = await Payment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } }, // <-- to‘g‘rilandi
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const expenses = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } }, // <-- to‘g‘rilandi
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const income = payments[0]?.total || 0;
    const outcome = expenses[0]?.total || 0;
    const balance = income - outcome;

    res.status(200).json({ income, outcome, balance });
  } catch (err) {
    console.error("Hisoblashda xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};


// 2. Qo‘lda balansga pul qo‘shish (foydalanuvchiga alohida)
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

// 3. Balansni real qiymatga sinxronizatsiya qilish
export const syncBalanceToReal = async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId || req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId kerak" });
    }

    const payments = await Payment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } }, // ✅ to‘g‘rilandi
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const expenses = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } }, // ✅ to‘g‘rilandi
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const income = payments[0]?.total || 0;
    const outcome = expenses[0]?.total || 0;
    const realBalance = income - outcome;

    const balance = await getOrCreateBalance(userId);
    balance.amount = realBalance;
    balance.updatedAt = new Date();
    await balance.save();

    res.status(200).json({
      message: "Balans real qiymatga moslashtirildi",
      realBalance,
      balance,
    });
  } catch (err) {
    console.error("syncBalanceToReal xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};


export const createNewBalance = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId kerak" });
    }

    // Avval mavjudligini tekshirib olamiz
    const existing = await Balance.findOne({ userId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Bu foydalanuvchi uchun balans allaqachon mavjud" });
    }

    const balance = new Balance({ userId, amount: 0 });
    await balance.save();

    res.status(201).json({ message: "Yangi balans yaratildi", balance });
  } catch (err) {
    console.error("Balans yaratishda xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};
