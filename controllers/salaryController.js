import mongoose from "mongoose";
import SalaryHistory from "../models/salaryHistoryModel.js";
import Balance from "../models/BalanceModel.js";
import Expense from "../models/ExpenseModel.js"; // ➕ Expense modeli

// 1. Maosh yaratish — balansdan ayirish va chiqimga yozish
export const createSalary = async (req, res) => {
  try {
    const { teacherId, amount, month, userId, description } = req.body;

    if (!userId || !teacherId || !amount || !month) {
      return res.status(400).json({ message: "Barcha maydonlar kerak" });
    }

    // 1. SalaryHistory saqlash
    const salary = new SalaryHistory({
      teacherId,
      amount,
      month,
      userId,
      description, // ixtiyoriy
    });
    await salary.save();

    // 2. Balance dan amount ayirish
    const balance = await Balance.findOne({ userId });

    if (!balance) {
      return res
        .status(404)
        .json({ message: "Balans topilmadi. Avval balans yarating." });
    }

    if (balance.amount < amount) {
      return res
        .status(400)
        .json({ message: "Balansda yetarli mablag‘ mavjud emas" });
    }

    balance.amount -= amount;
    balance.updatedAt = new Date();
    await balance.save();

    // 3. Expense modeliga yozish (rashod)
    const expense = new Expense({
      amount,
      description: description || `Oylik to‘lovi (${month})`, // fallback
      userId,
      spentAt: new Date(),
    });
    await expense.save();

    res.status(201).json({
      message: "Maosh saqlandi, balansdan ayirildi va chiqim qo‘shildi",
      salary,
      newBalance: balance.amount,
    });
  } catch (err) {
    console.error("createSalary xatolik:", err);
    res.status(500).json({ message: "Xatolik", error: err.message });
  }
};

// 2. Barcha maoshlar ro‘yxati
export const getAllSalaries = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId || req.params.userId;
    if (!userId) return res.status(400).json({ message: "userId kerak" });

    const salaries = await SalaryHistory.find({ userId })
      .populate("teacherId", "name lastname")
      .sort({ createdAt: -1 });

    res.json(salaries);
  } catch (err) {
    res.status(500).json({ message: "Xatolik", error: err.message });
  }
};

// 3. Bitta o‘qituvchining maosh yozuvini olish (teacherId orqali)
export const getSalaryByTeacherId = async (req, res) => {
  try {
    const { userId } = req.query;
    const teacherId = req.params.teacherId;

    if (!userId || !teacherId) {
      return res.status(400).json({ message: "userId va teacherId kerak" });
    }

    const salary = await SalaryHistory.findOne({
      teacherId,
      userId,
    })
      .populate("teacherId", "name lastname")
      .sort({ createdAt: -1 }); // Agar oxirgi yozuv kerak bo‘lsa

    if (!salary) return res.status(404).json({ message: "Topilmadi" });

    res.json(salary);
  } catch (err) {
    res.status(500).json({ message: "Xatolik", error: err.message });
  }
};


// 4. Maoshni yangilash
export const updateSalary = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId kerak" });

    const updated = await SalaryHistory.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Topilmadi" });

    res.json({ message: "Yangilandi", updated });
  } catch (err) {
    res.status(500).json({ message: "Xatolik", error: err.message });
  }
};

// 5. Maoshni o‘chirish
export const deleteSalary = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId || req.params.userId;
    if (!userId) return res.status(400).json({ message: "userId kerak" });

    // 1. O‘chirilayotgan maoshni topish
    const salary = await SalaryHistory.findOne({
      _id: req.params.id,
      userId,
    });

    if (!salary) return res.status(404).json({ message: "Maosh topilmadi" });

    // 2. Balansni topish va mablag‘ni qaytarish
    const balance = await Balance.findOne({ userId });
    if (!balance) return res.status(404).json({ message: "Balans topilmadi" });

    balance.amount += salary.amount;
    balance.updatedAt = new Date();
    await balance.save();

    // 3. Expense yozuvini topish va o‘chirish
    const description = salary.description || `Oylik to‘lovi (${salary.month})`;
    const expense = await Expense.findOneAndDelete({
      amount: salary.amount,
      description: description,
      userId: userId,
    });

    // 4. SalaryHistory yozuvini o‘chirish
    await SalaryHistory.findByIdAndDelete(salary._id);

    // 5. Javob
    res.json({
      message: "Maosh o‘chirildi, balansga qaytarildi va chiqim o‘chirildi",
      returnedAmount: salary.amount,
      newBalance: balance.amount,
      expenseDeleted: !!expense, // true yoki false
    });
  } catch (err) {
    res.status(500).json({ message: "Xatolik", error: err.message });
  }
};


// 6. Statistika: har oy bo‘yicha userga tegishli maoshlar
export const getMonthlySalaryStats = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId || req.params.userId;
    if (!userId) return res.status(400).json({ message: "userId kerak" });

    const stats = await SalaryHistory.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: "$month",
          totalPaid: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Xatolik", error: err.message });
  }
};
