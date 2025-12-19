import jwt from "jsonwebtoken";
import Student from "../models/studentModel.js";
import Payment from "../models/PaymentModel.js";
import Attendance from "../models/attendanceModel.js";

// =========================
// 1️⃣ Ota-ona login (telefon raqami + parol)
// =========================
export const parentLogin = async (req, res) => {
  try {
    const { parentPhone, password } = req.body;

    if (!parentPhone || !password) {
      return res
        .status(400)
        .json({ message: "Telefon raqam va parol kiritilmadi" });
    }

    const student = await Student.findOne({ parentPhone });

    if (!student) {
      return res
        .status(404)
        .json({ message: "Bu raqamga tegishli farzand topilmadi" });
    }

    // oddiy string tekshiruv (bcrypt ishlatilmayapti)
    if (password !== student.password) {
      return res.status(401).json({ message: "Noto‘g‘ri parol" });
    }

    const token = jwt.sign(
      { parentPhone, role: "parent" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Shu ota-onaga tegishli barcha farzandlar, teacher bilan
    const students = await Student.find({ parentPhone }).populate({
      path: "groupId",
      select: "name scheduleType days monthlyFee startTime endTime teachers",
      populate: {
        path: "teachers",
        select: "name lastname science phone",
      },
    });

    res.json({
      message: "Tizimga muvaffaqiyatli kirdingiz",
      token,
      parentPhone,
      students,
    });
  } catch (err) {
    console.error("parentLogin error:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// =========================
// 2️⃣ Farzandning to‘lovlari
// =========================
export const getStudentPayments = async (req, res) => {
  try {
    const studentId = req.params.id;

    const payments = await Payment.find({ studentId })
      .sort({ paidAt: -1 })
      .populate("studentId", "name lastname");

    res.json(payments);
  } catch (err) {
    console.error("getStudentPayments error:", err);
    res.status(500).json({ message: err.message });
  }
};

// =========================
// 3️⃣ Farzandning davomatlari
// =========================
export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.id;

    const attendance = await Attendance.find({ studentId })
      .sort({ date: -1 })
      .populate("studentId", "name lastname")
      .populate({
        path: "groupId",
        select: "name teachers",
        populate: {
          path: "teachers",
          select: "name lastname science phone",
        },
      });

    res.json(attendance);
  } catch (err) {
    console.error("getStudentAttendance error:", err);
    res.status(500).json({ message: err.message });
  }
};

// =========================
// 4️⃣ Ota-onaning barcha farzandlari (teachers bilan)
// =========================
export const getChildren = async (req, res) => {
  try {
    const parentPhone = req.parent?.phone;

    if (!parentPhone) {
      return res.status(401).json({ message: "Parent login qilmagan" });
    }

    const students = await Student.find({ parentPhone })
      .populate({
        path: "groupId",
        select: "name scheduleType days monthlyFee startTime endTime teachers",
        populate: {
          path: "teachers",
          select: "name lastname science phone",
        },
      })
      .sort({ createdAt: -1 });

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "Farzandlar topilmadi" });
    }

    const response = students.map((student) => ({
      id: student._id,
      name: student.name,
      lastname: student.lastname,
      group: student.groupId
        ? {
            name: student.groupId.name,
            scheduleType: student.groupId.scheduleType,
            days: student.groupId.days,
            monthlyFee: student.groupId.monthlyFee,
            startTime: student.groupId.startTime,
            endTime: student.groupId.endTime,
            teachers: student.groupId.teachers.map((t) => ({
              name: t.name,
              lastname: t.lastname,
              science: t.science,
              phone: t.phone,
            })),
          }
        : null,
    }));

    res.json(response);
  } catch (err) {
    console.error("getChildren error:", err);
    res.status(500).json({ message: err.message });
  }
};

// =========================
// 5️⃣ Ota-onaga bitta farzandni ko‘rsatish (teachers bilan)
// =========================
export const getOneChild = async (req, res) => {
  try {
    const parentPhone = req.parent?.phone;
    const studentId = req.params.id;

    if (!parentPhone) {
      return res.status(401).json({ message: "Parent login qilmagan" });
    }

    const student = await Student.findOne({
      _id: studentId,
      parentPhone,
    }).populate({
      path: "groupId",
      select: "name scheduleType days monthlyFee startTime endTime teachers",
      populate: {
        path: "teachers",
        select: "name lastname science phone",
      },
    });

    if (!student) {
      return res.status(404).json({
        message: "Farzand topilmadi yoki sizga tegishli emas",
      });
    }

    const response = {
      id: student._id,
      name: student.name,
      lastname: student.lastname,
      group: student.groupId
        ? {
            name: student.groupId.name,
            scheduleType: student.groupId.scheduleType,
            days: student.groupId.days,
            monthlyFee: student.groupId.monthlyFee,
            startTime: student.groupId.startTime,
            endTime: student.groupId.endTime,
            teachers: student.groupId.teachers.map((t) => ({
              name: t.name,
              lastname: t.lastname,
              science: t.science,
              phone: t.phone,
            })),
          }
        : null,
    };

    res.json(response);
  } catch (err) {
    console.error("getOneChild error:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};
