// middlewares/verifyAdmin.js
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token topilmadi" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: "Admin topilmadi" });

    req.admin = admin; // ruxsatlarni tekshirish uchun
    next();
  } catch (err) {
    res.status(401).json({ message: "Noto‘g‘ri token" });
  }
};
