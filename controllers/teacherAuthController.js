import Teacher from "../models/teacherModel.js";
import jwt from "jsonwebtoken";

export const loginTeacher = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ message: "Telefon raqami kiritilishi shart" });
    }

    const teacher = await Teacher.findOne({ phone });
    if (!teacher) {
      return res
        .status(404)
        .json({ message: "Telefon raqami bo‘yicha o‘qituvchi topilmadi" });
    }

    const token = jwt.sign(
      { id: teacher._id, role: "teacher" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Kirish muvaffaqiyatli",
      token,
      teacher,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
