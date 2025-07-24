// utils/balanceUtils.js
import Balance from "../models/BalanceModel.js";

export const getOrCreateBalance = async (userId) => {
  if (!userId) {
    throw new Error("userId kerak");
  }

  let balance = await Balance.findOne({ userId });

  if (!balance) {
    balance = new Balance({ userId, amount: 0 });
    await balance.save();
  }

  return balance;
};
