// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token topilmadi" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // foydalanuvchi ma'lumotlarini saqlaymiz
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Token noto‘g‘ri yoki muddati tugagan" });
  }
};

export default authMiddleware;
