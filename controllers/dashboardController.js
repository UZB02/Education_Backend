import mongoose from "mongoose";
import Application from "../models/Application.js";
import Payment from "../models/PaymentModel.js";
import Expense from "../models/ExpenseModel.js";
import { getOrCreateBalance } from "../utils/balanceUtils.js";

const createEmptyMonthArray = () => Array(12).fill(0);

// 📊 Umumiy statistikalar
export const getDashboardSummary = async (req, res) => {
  const { adminId } = req.params;
  const { year } = req.query;

  let dateFilter = {};

  if (year) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${+year + 1}-01-01T00:00:00.000Z`);
    dateFilter = { createdAt: { $gte: startDate, $lt: endDate } };
  }

  const applications = await Application.countDocuments({
    admin: adminId,
    ...dateFilter,
  });

  const students = await import("../models/studentModel.js").then((m) =>
    m.default.countDocuments({ admin: adminId, ...dateFilter })
  );
const payments = await Payment.aggregate([
  {
    $match: {
      userId: new mongoose.Types.ObjectId(adminId),
      ...(year && { paidAt: dateFilter.createdAt }), // 🟢 to‘g‘ri maydon: paidAt
    },
  },
  {
    $group: {
      _id: null,
      total: { $sum: "$amount" },
    },
  },
]);

const expenses = await Expense.aggregate([
  {
    $match: {
      userId: new mongoose.Types.ObjectId(adminId),
      ...(year && { spentAt: dateFilter.createdAt }), // ✅ Foydalanish kerak bo‘lgan maydon
    },
  },
  {
    $group: {
      _id: null,
      total: { $sum: "$amount" },
    },
  },
]);



  const balance = await getOrCreateBalance(adminId);

  res.json([
    { label: "To‘lovlar", value: payments[0]?.total || 0 },
    { label: "Joriy Balans", value: balance.amount },
    { label: "Xarajatlar", value: expenses[0]?.total || 0 },
    { label: "Arizalar", value: applications },
    { label: "O‘quvchilar", value: students },
  ]);
};

// 📈 Har oy bo‘yicha o‘quvchilar
export const getStudentsByMonth = async (req, res) => {
  const { adminId } = req.params;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  try {
    const Student = (await import("../models/studentModel.js")).default;

    const results = await Student.aggregate([
      {
        $match: {
          admin: adminId, // ❗ ObjectId emas, String bo'lishi kerak
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    const months = Array(12).fill(0);
    results.forEach((r) => {
      months[r._id - 1] = r.count;
    });

    res.json({
      labels: [
        "Yanvar",
        "Fevral",
        "Mart",
        "Aprel",
        "May",
        "Iyun",
        "Iyul",
        "Avgust",
        "Sentabr",
        "Oktabr",
        "Noyabr",
        "Dekabr",
      ],
      values: months,
    });
  } catch (error) {
    console.error("Oylik o‘quvchilarni olishda xatolik:", error);
    res
      .status(500)
      .json({ message: "O‘quvchilar statistikasi xatoligi", error });
  }
};



// 📈 Har oy bo‘yicha arizalar
export const getApplicationsByMonth = async (req, res) => {
  const { adminId } = req.params;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  const results = await Application.aggregate([
    {
      $match: {
        admin: adminId,
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        count: { $sum: 1 },
      },
    },
  ]);

  const months = createEmptyMonthArray();
  results.forEach((r) => {
    months[r._id - 1] = r.count;
  });

  res.json({
    labels: [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ],
    values: months,
  });
};

// 📈 Har oy bo‘yicha to‘lovlar
export const getPaymentsByMonth = async (req, res) => {
  const { adminId } = req.params;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  try {
    const results = await Payment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(adminId),
          paidAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$paidAt" },
          total: { $sum: "$amount" },
        },
      },
    ]);

    const months = Array(12).fill(0);
    results.forEach((r) => {
      months[r._id - 1] = r.total;
    });

    res.json({
      labels: [
        "Yanvar",
        "Fevral",
        "Mart",
        "Aprel",
        "May",
        "Iyun",
        "Iyul",
        "Avgust",
        "Sentabr",
        "Oktabr",
        "Noyabr",
        "Dekabr",
      ],
      values: months,
    });
  } catch (error) {
    console.error("To‘lovlarni oylik olishda xatolik:", error);
    res
      .status(500)
      .json({ message: "Oylik to‘lovlarni olishda xatolik", error });
  }
};

// 📈 Har oy bo‘yicha xarajatlar
export const getExpensesByMonth = async (req, res) => {
  const { adminId } = req.params;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  try {
    const results = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(adminId),
          spentAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$spentAt" },
          total: { $sum: "$amount" },
        },
      },
    ]);

    const months = createEmptyMonthArray();
    results.forEach((r) => {
      months[r._id - 1] = r.total;
    });

    res.json({
      labels: [
        "Yanvar",
        "Fevral",
        "Mart",
        "Aprel",
        "May",
        "Iyun",
        "Iyul",
        "Avgust",
        "Sentabr",
        "Oktabr",
        "Noyabr",
        "Dekabr",
      ],
      values: months,
    });
  } catch (error) {
    console.error("Oylik xarajatlarni olishda xatolik:", error);
    res
      .status(500)
      .json({ message: "Oylik xarajatlarni olishda xatolik", error });
  }
};


// 📈 Balans (yil bo'yicha har oylik o'zgarish)
export const getBalanceByMonth = async (req, res) => {
  const { adminId } = req.params;
  const { year } = req.query;

  if (!year) return res.status(400).json({ message: "Yil kerak" });

  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${+year + 1}-01-01T00:00:00.000Z`);

  // Payments by month
  const payments = await Payment.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(adminId),
        paidAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: { $month: "$paidAt" },
        total: { $sum: "$amount" },
      },
    },
  ]);

  // Expenses by month
  const expenses = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(adminId),
        spentAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: { $month: "$spentAt" },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const balanceByMonth = Array(12).fill(0);

  for (let i = 0; i < 12; i++) {
    const month = i + 1;

    const pay = payments.find((p) => p._id === month)?.total || 0;
    const exp = expenses.find((e) => e._id === month)?.total || 0;

    balanceByMonth[i] = pay - exp;
  }

  res.json({
    labels: [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ],
    values: balanceByMonth,
  });
};
// 🕓 So‘nggi 5 faoliyat
export const getRecentActivity = async (req, res) => {
  const { adminId } = req.params;

  const applications = await Application.find({ admin: adminId })
    .sort({ createdAt: -1 })
    .limit(2)
    .select("description createdAt");

  const payments = await Payment.find({
    userId: new mongoose.Types.ObjectId(adminId),
  })
    .sort({ paidAt: -1 })
    .limit(2)
    .select("amount paidAt");

  const expenses = await Expense.find({
    userId: new mongoose.Types.ObjectId(adminId),
  })
    .sort({ createdAt: -1 })
    .limit(2)
    .select("description amount createdAt");

  const activity = [
    ...applications.map((a) => ({
      type: "Ariza",
      description: a.description,
      date: a.createdAt,
    })),
    ...payments.map((p) => ({
      type: "To‘lov",
      description: `₩${p.amount}`,
      date: p.paidAt,
    })),
    ...expenses.map((e) => ({
      type: "Xarajat",
      description: e.description,
      date: e.createdAt,
    })),
  ];

  activity.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(activity.slice(0, 5));
};
