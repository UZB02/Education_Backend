import jwt from "jsonwebtoken";

// Oddiy user yoki admin uchun token tekshirish
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token topilmadi" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // role va permissions token ichida bo'lishi mumkin
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Token noto‘g‘ri yoki muddati tugagan" });
  }
};

// Super Adminni tekshirish
export const verifySuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "super-admin")
      return res.status(403).json({ message: "Super Admin ruxsati kerak" });
    next();
  });
};

// Adminning ruxsatlarini tekshirish
export const checkPermission = (permission) => (req, res, next) => {
  if (!req.user.permissions?.[permission])
    return res.status(403).json({ message: "Access denied" });
  next();
};


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