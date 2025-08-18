import Payment from "../models/PaymentModel.js";
import Student from "../models/studentModel.js";
import { sendMessageToUser } from "../bot/bot.js"; 
import Balance from "../models/BalanceModel.js";
import { calculatePaymentStatus } from "../helpers/paymentHelper.js";
// 1. Yangi to‘lov qo‘shish

async function getOrCreateBalance(userId) {
  let balance = await Balance.findOne({ userId });
  if (!balance) {
    balance = await Balance.create({ userId, amount: 0 });
  }
  return balance;
}

export const addPayment = async (req, res) => {
  try {
    const { studentId, amount, method, description, userId } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "userId va yaroqli miqdor kerak" });
    }

    // 🔹 1. Yangi to‘lovni yozamiz
    const payment = await Payment.create({
      studentId,
      amount,
      method,
      description,
      userId,
      paidAt: new Date(),
    });

    // 🔹 2. Balansni yangilaymiz
    const balance = await getOrCreateBalance(userId);
    balance.amount += amount;
    balance.updatedAt = new Date();
    await balance.save();

    // 🔹 3. Talabani olish (guruh bilan)
    const student = await Student.findById(studentId).populate("groupId");
    if (!student) {
      return res.status(404).json({ message: "Talaba topilmadi" });
    }

    let paymentStatus = null;
    if (student.groupId) {
      // 🔹 To‘lov statusini hisoblaymiz
      paymentStatus = await calculatePaymentStatus(student, student.groupId);

      // 🔹 Student modelida paymentStatusni yangilash
      student.paymentStatus = paymentStatus;
      await student.save();
    }

    // 🔹 4. Telegramga xabar yuborish (faqat calculatePaymentStatus dan olingan natija)
    // 🔹 4. Telegramga xabar yuborish (faqat calculatePaymentStatus natijasidan)
    if (student.chatId && paymentStatus) {
      const message =
        `💳 Hurmatli ${student.name} ${student.lastname || ""},\n` +
        `${amount.toLocaleString()} so‘m to‘lov qabul qilindi.\n` +
        `To‘lov usuli: ${method || "Noma'lum"}\n\n` +
        `📅 Joriy holat:\n` +
        `- Holat: ${paymentStatus.overallMessage}\n` +
        `- Jami to‘langan: ${paymentStatus.totalPaid.toLocaleString()} so‘m\n` +
        `- Qolgan summa: ${paymentStatus.remainingAmount.toLocaleString()} so‘m\n` +
        `- Ortiqcha to‘lov: ${paymentStatus.overpaidAmount.toLocaleString()} so‘m`;

      await sendMessageToUser(student.chatId, message);
    }

    // 🔹 5. Response qaytarish
    res.status(201).json({
      message: "To‘lov qo‘shildi",
      payment,
      balance,
      paymentStatus,
    });
  } catch (err) {
    console.error("❌ To‘lov qo‘shishda xatolik:", err);
    res.status(500).json({ message: "Server xatosi", error: err.message });
  }
};



// 2. Bitta o‘quvchining to‘lovlari
export const getPaymentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const payments = await Payment.find({ studentId }).sort({ paidAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "To‘lovlarni olishda xatolik", error });
  }
};

// 3. Foydalanuvchining barcha to‘lovlari
export const getAllPayments = async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};

    const payments = await Payment.find(query)
      .populate("studentId", "name lastname")
      .sort({ paidAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "To‘lovlarni olishda xatolik", error });
  }
};

// 4. To‘lovni yangilash
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Payment.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "To‘lov topilmadi" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Yangilashda xatolik", error });
  }
};

// 5. To‘lovni o‘chirish
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Payment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "To‘lov topilmadi" });
    res.json({ message: "To‘lov o‘chirildi" });
  } catch (error) {
    res.status(500).json({ message: "O‘chirishda xatolik", error });
  }
};

// 6. O‘quvchi bo‘yicha to‘lovlar tarixi + umumiy miqdor
export const getStudentPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student)
      return res.status(404).json({ message: "O‘quvchi topilmadi" });

    const payments = await Payment.find({ studentId }).sort({ paidAt: -1 });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      student: {
        name: student.name,
        lastname: student.lastname,
        phone: student.phone,
      },
      totalPaid,
      payments,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "To‘lovlar tarixini olishda xatolik", error });
  }
};
