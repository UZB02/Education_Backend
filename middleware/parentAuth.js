import jwt from "jsonwebtoken";
import Student from "../models/studentModel.js";

export const parentAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token topilmadi" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "parent") {
      return res.status(403).json({ message: "Faqat ota-onalar uchun ruxsat" });
    }

    // Farzandlarini olish
    const students = await Student.find({ parentPhone: decoded.phone });
    if (!students || students.length === 0) {
      return res.status(404).json({ message: "Farzand topilmadi" });
    }

    // Requestga parent ma’lumotlarini yozib qo‘yamiz
    req.parent = { phone: decoded.phone, students };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token noto‘g‘ri yoki eskirgan" });
  }
};
