import Payment from "../models/PaymentModel.js";
import Expense from "../models/ExpenseModel.js";
import { getOrCreateBalance } from "../utils/balanceUtils.js";

// Real-time hisoblangan balans
export const getRealBalance = async (req, res) => {
  try {
    const payments = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const expenses = await Expense.aggregate([
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

// Qo‘lda balansga pul qo‘shish
export const increaseBalance = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Yaroqli miqdor kiriting" });
    }

    const balance = await getOrCreateBalance();
    balance.amount += amount;
    balance.updatedAt = new Date();
    await balance.save();

    res.status(200).json({ message: "Balans oshirildi", balance });
  } catch (err) {
    res.status(500).json({ message: "Server xatosi" });
  }
};

export const syncBalanceToReal = async (req, res) => {
  try {
    const payments = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const expenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const income = payments[0]?.total || 0;
    const outcome = expenses[0]?.total || 0;
    const realBalance = income - outcome;

    const balance = await getOrCreateBalance();
    balance.amount = realBalance;
    balance.updatedAt = new Date();
    await balance.save();

    res.status(200).json({
      message: "Balans real qiymatga moslashtirildi",
      realBalance,
      balance,
    });
  } catch (err) {
    console.error("Balans sinxronizatsiyada xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

