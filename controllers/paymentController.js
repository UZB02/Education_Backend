import Payment from "../models/PaymentModel.js";
import Student from "../models/studentModel.js";
import { getOrCreateBalance } from "../utils/balanceUtils.js";

// Yangi to‘lov qo‘shish

// 1. To‘lov (payment) qo‘shish va balansni oshirish

export const addPayment = async (req, res) => {
  try {
    const { studentId, amount, method, description, admin } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Yaroqli miqdor kiriting" });
    }

    const payment = await Payment.create({
      studentId,
      amount,
      method,
      description,
      admin,
    });

    const balance = await getOrCreateBalance();
    balance.amount += amount;
    balance.updatedAt = new Date();
    await balance.save();

    res.status(201).json({ message: "To‘lov qo‘shildi", payment, balance });
  } catch (err) {
    console.error("To‘lov qo‘shishda xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// Bitta o‘quvchining to‘lovlari
export const getPaymentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const payments = await Payment.find({ studentId }).sort({ paidAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "To‘lovlarni olishda xatolik", error });
  }
};

// Barcha to‘lovlar
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("studentId", "name lastname")
      .sort({ paidAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "To‘lovlarni olishda xatolik", error });
  }
};

// To‘lovni yangilash
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

// To‘lovni o‘chirish
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

// 🆕 To‘lovlar tarixi + umumiy summa (qarzdorliksiz)
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
