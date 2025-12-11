import jwt from "jsonwebtoken";
import Student from "../models/studentModel.js";
import Payment from "../models/PaymentModel.js";
import Attendance from "../models/attendanceModel.js";
import bcrypt from "bcrypt";

// 1️⃣ Ota-ona login (telefon raqami + parol)
export const parentLogin = async (req, res) => {
  try {
    const { parentPhone, password } = req.body;

    if (!parentPhone || !password) {
      return res
        .status(400)
        .json({ message: "Telefon raqam va parol kiritilmadi" });
    }

    // parentPhone bo‘yicha farzandlarni topamiz
    const student = await Student.findOne({ parentPhone });

    if (!student) {
      return res.status(404).json({ message: "Bu raqamga farzand topilmadi" });
    }

    // Password tekshirish
    const match = await bcrypt.compare(password, student.password);
    if (!match) {
      return res.status(401).json({ message: "Noto‘g‘ri parol" });
    }

    // JWT token yaratish
    const token = jwt.sign(
      { parentPhone, role: "parent" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Shu ota-onaga tegishli barcha farzandlar
    const students = await Student.find({ parentPhone }).populate("groupId");

    res.json({
      message: "Tizimga muvaffaqiyatli kirdingiz",
      token,
      parentPhone,
      students,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// 2️⃣ Farzandning to‘lovlari
export const getStudentPayments = async (req, res) => {
  try {
    const studentId = req.params.id;

    const payments = await Payment.find({ studentId })
      .sort({ paidAt: -1 })
      .populate("studentId", "name lastname");

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3️⃣ Farzandning davomatlari
export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.id;

    const attendance = await Attendance.find({ studentId })
      .sort({ date: -1 })
      .populate("studentId", "name lastname")
      .populate("groupId", "name");

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4️⃣ Ota-onaning barcha farzandlari
export const getChildren = async (req, res) => {
  try {
    const phone = req.parent?.phone;

    if (!phone) {
      return res.status(401).json({ message: "Parent login qilmagan" });
    }

    const students = await Student.find({ parentPhone: phone })
      .populate({
        path: "groupId",
        select: "name scheduleType days monthlyFee teacher",
        populate: {
          path: "teacher",
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
      groups: student.groupId
        ? {
            group: {
              name: student.groupId.name,
              scheduleType: student.groupId.scheduleType,
              days: student.groupId.days,
              monthlyFee: student.groupId.monthlyFee,
              teacher: student.groupId.teacher
                ? {
                    name: student.groupId.teacher.name,
                    lastname: student.groupId.teacher.lastname,
                    science: student.groupId.teacher.science,
                    phone: student.groupId.teacher.phone,
                  }
                : null,
            },
          }
        : null,
    }));

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
