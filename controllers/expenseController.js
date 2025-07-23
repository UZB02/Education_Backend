import Expense from "../models/ExpenseModel.js";
import { getOrCreateBalance } from "../utils/balanceUtils.js";

export const addExpense = async (req, res) => {
  try {
    const { amount, description, admin } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Yaroqli miqdor kiriting" });
    }

    const balance = await getOrCreateBalance();

    if (balance.amount < amount) {
      return res.status(400).json({ message: "Yetarli mablag' mavjud emas" });
    }

    balance.amount -= amount;
    balance.updatedAt = new Date();
    await balance.save();

    const expense = await Expense.create({ amount, description, admin });

    res.status(201).json({ message: "Chiqim qo‘shildi", expense, balance });
  } catch (err) {
    console.error("Chiqim qo‘shishda xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return res.status(404).json({ message: "Chiqim topilmadi" });
    }

    const balance = await getOrCreateBalance();
    balance.amount += expense.amount;
    balance.updatedAt = new Date();
    await balance.save();

    res
      .status(200)
      .json({
        message: "Chiqim o‘chirildi va balans tiklandi",
        expense,
        balance,
      });
  } catch (err) {
    console.error("Chiqimni o‘chirishda xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ spentAt: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    console.error("Chiqimlar ro‘yxatini olishda xatolik:", err);
    res.status(500).json({ message: "Xatolik yuz berdi" });
  }
};
