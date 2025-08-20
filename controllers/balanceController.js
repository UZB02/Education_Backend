import {
  getOrCreateBalance,
  updateBalanceAmount,
} from "../utils/balanceUtils.js";

// 1. Real-time hisoblangan balans (filter bilan)
export const getRealBalance = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.params?.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId kerak" });
    }

    // Frontenddan keladigan filter parametrlari
    const { type, date, from, to, month, year } = req.query;

    // filterlarni alohida to‘plash
    let paymentFilter = {};
    let expenseFilter = {};

    // 1) Sana bo‘yicha
    if (type === "date" && date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));

      paymentFilter.paidAt = { $gte: start, $lte: end };
      expenseFilter.spentAt = { $gte: start, $lte: end };
    }

    // 2) Sana oralig‘i
    if (type === "range" && from && to) {
      const start = new Date(new Date(from).setHours(0, 0, 0, 0));
      const end = new Date(new Date(to).setHours(23, 59, 59, 999));

      paymentFilter.paidAt = { $gte: start, $lte: end };
      expenseFilter.spentAt = { $gte: start, $lte: end };
    }

    // 3) Oy + yil
    if (type === "month" && month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);

      paymentFilter.paidAt = { $gte: start, $lte: end };
      expenseFilter.spentAt = { $gte: start, $lte: end };
    }

    // Balansni filter bo‘yicha hisoblash
    const { income, outcome, balance } = await updateBalanceAmount(userId, {
      paymentFilter,
      expenseFilter,
    });

    res.status(200).json({ income, outcome, balance });
  } catch (err) {
    console.error("Hisoblashda xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// 2. Qo‘lda balansga pul qo‘shish
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

// 3. Balansni real qiymatga sinxronizatsiya qilish (filtersiz)
export const syncBalanceToReal = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.params?.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId kerak" });
    }

    const {
      income,
      outcome,
      balance: realBalance,
    } = await updateBalanceAmount(userId);

    res.status(200).json({
      message: "Balans real qiymatga moslashtirildi",
      realBalance,
      income,
      outcome,
    });
  } catch (err) {
    console.error("syncBalanceToReal xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};
