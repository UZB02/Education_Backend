import jwt from "jsonwebtoken";
import Teacher from "../models/teacherModel.js";

export const teacherAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token topilmadi" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "teacher") {
      return res.status(403).json({ message: "Faqat o‘qituvchi uchun ruxsat" });
    }

    const teacher = await Teacher.findById(decoded.id);
    if (!teacher) {
      return res.status(404).json({ message: "O‘qituvchi topilmadi" });
    }

    // 🔹 Muhim: controller-da req.user._id ishlaydi
    req.user = teacher;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token noto‘g‘ri yoki eskirgan" });
  }
};
