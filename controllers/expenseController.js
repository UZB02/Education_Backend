// controllers/expenseController.js
import Expense from "../models/ExpenseModel.js";
import { getOrCreateBalance } from "../utils/balanceUtils.js";

// Xarajat qo‘shish
export const addExpense = async (req, res) => {
  try {
    const { amount, description, userId } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ message: "Miqdor va userId kerak" });
    }

    const expense = await Expense.create({ amount, description, userId });

    const balance = await getOrCreateBalance(userId);
    balance.amount -= amount;
    balance.updatedAt = new Date();
    await balance.save();

    res.status(201).json({ message: "Xarajat qo‘shildi", expense, balance });
  } catch (err) {
    console.error("Xarajatni saqlashda xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// Xarajatni o‘chirish
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Chiqim topilmadi" });
    }

    const balance = await getOrCreateBalance(expense.userId); // ✅ TO‘G‘RI QILINDI

    balance.amount += expense.amount;
    balance.updatedAt = new Date();
    await balance.save();

    await Expense.findByIdAndDelete(id);

    res.status(200).json({
      message: "Chiqim o‘chirildi va balans tiklandi",
      expense,
      balance,
    });
  } catch (err) {
    console.error("Chiqimni o‘chirishda xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// Barcha xarajatlar
export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ spentAt: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    console.error("Chiqimlar ro‘yxatini olishda xatolik:", err);
    res.status(500).json({ message: "Xatolik yuz berdi" });
  }
};
