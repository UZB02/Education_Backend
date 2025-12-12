import Teacher from "../models/teacherModel.js";
import jwt from "jsonwebtoken";

// ==========================
//  TEACHER LOGIN
// ==========================

export const loginTeacher = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 1) Validatsiya
    if (!phone || !password) {
      return res.status(400).json({
        message: "Telefon raqami va parol kiritilishi shart",
      });
    }

    // 2) Teacher topish
    const teacher = await Teacher.findOne({ phone });
    if (!teacher) {
      return res.status(404).json({
        message: "Telefon raqami bo‘yicha o‘qituvchi topilmadi",
      });
    }

    // 3) Parol tekshirish (hash ishlatilmagan)
    if (teacher.password !== password) {
      return res.status(401).json({
        message: "Parol noto‘g‘ri",
      });
    }

    // 4) Token yaratish
    const token = jwt.sign(
      { id: teacher._id, role: "teacher" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5) Javob qaytarish
    res.status(200).json({
      message: "Kirish muvaffaqiyatli",
      token,
      teacher,
    });
  } catch (error) {
    res.status(500).json({
      message: "Serverda xatolik yuz berdi",
      error: error.message,
    });
  }
};
