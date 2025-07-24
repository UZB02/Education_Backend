import Application from "../models/Application.js";
import Payment from "../models/PaymentModel.js";
import Expense from "../models/ExpenseModel.js";
import { getOrCreateBalance } from "../utils/balanceUtils.js";

// Helper: 12 oy uchun bo‘sh massiv
const createEmptyMonthArray = () => Array(12).fill(0);

// 📊 Dashboard umumiy statistikasi
export const getDashboardSummary = async (req, res) => {
  const { adminId } = req.params;

  const applications = await Application.countDocuments({ admin: adminId });

  const students = await import("../models/studentModel.js").then((m) =>
    m.default.countDocuments({ admin: adminId })
  );

  const payments = await Payment.aggregate([
    { $match: { admin: adminId } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const expenses = await Expense.aggregate([
    { $match: { userId: adminId } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const balance = await getOrCreateBalance(adminId);

  res.json([
    { label: "Arizalar", value: applications },
    { label: "O‘quvchilar", value: students },
    { label: "To‘lovlar", value: payments[0]?.total || 0 },
    { label: "Xarajatlar", value: expenses[0]?.total || 0 },
    { label: "Balans", value: balance.balance },
  ]);
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

  const results = await Payment.aggregate([
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
      $group: { _id: { $month: "$createdAt" }, total: { $sum: "$amount" } },
    },
  ]);

  const months = createEmptyMonthArray();
  results.forEach((r) => (months[r._id - 1] = r.total));

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

// 📈 Har oy bo‘yicha xarajatlar
export const getExpensesByMonth = async (req, res) => {
  const { adminId } = req.params;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  const results = await Expense.aggregate([
    {
      $match: {
        userId: adminId,
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: { _id: { $month: "$createdAt" }, total: { $sum: "$amount" } },
    },
  ]);

  const months = createEmptyMonthArray();
  results.forEach((r) => (months[r._id - 1] = r.total));

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

// 🔁 Balans o‘zgarishini har oy ko‘rsatish uchun model bo‘lishi kerak
export const getBalanceByMonth = async (req, res) => {
  // TODO: Agar balanslar har oy o‘zgaradigan bo‘lsa — alohida modelga yozib borish kerak
  // Hozircha bitta umumiy balansni qaytaradi
  const balance = await getOrCreateBalance(req.params.adminId);
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
    values: Array(12).fill(balance.balance), // vaqtincha barcha oy uchun bir xil qiymat
  });
};

// 🕓 So‘nggi 5 harakat
export const getRecentActivity = async (req, res) => {
  const { adminId } = req.params;

  const applications = await Application.find({ admin: adminId })
    .sort({ createdAt: -1 })
    .limit(2)
    .select("description createdAt");

  const payments = await Payment.find({ admin: adminId })
    .sort({ createdAt: -1 })
    .limit(2)
    .select("amount createdAt");

  const expenses = await Expense.find({ userId: adminId })
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
      date: p.createdAt,
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
