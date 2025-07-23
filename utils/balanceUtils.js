import Balance from "../models/BalanceModel.js";

// Har doim mavjud bo‘lishini ta'minlaydi
export const getOrCreateBalance = async () => {
  let balance = await Balance.findOne();
  if (!balance) {
    balance = new Balance({ amount: 0 });
    await balance.save();
  }
  return balance;
};
