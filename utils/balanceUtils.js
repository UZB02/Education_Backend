// utils/balanceUtils.js
import mongoose from "mongoose";
import Payment from "../models/PaymentModel.js";
import Expense from "../models/ExpenseModel.js";
import Balance from "../models/BalanceModel.js";

export const getOrCreateBalance = async (userId) => {
  if (!userId) throw new Error("userId kerak");
  let balance = await Balance.findOne({ userId });
  if (!balance) {
    balance = new Balance({ userId, amount: 0 });
    await balance.save();
  }
  return balance;
};

export const updateBalanceAmount = async (userId, filters = {}) => {
  if (!userId) throw new Error("userId kerak");

  const { paymentFilter = {}, expenseFilter = {} } = filters;

  const payments = await Payment.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId), ...paymentFilter },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const expenses = await Expense.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId), ...expenseFilter },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const income = payments[0]?.total || 0;
  const outcome = expenses[0]?.total || 0;
  const currentBalance = income - outcome;

  const balance = await getOrCreateBalance(userId);
  balance.amount = currentBalance;
  balance.updatedAt = new Date();
  await balance.save();

  return { income, outcome, balance: currentBalance };
};
