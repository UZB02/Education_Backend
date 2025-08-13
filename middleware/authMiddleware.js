import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    // Headerdan tokenni olish
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token topilmadi" });
    }

    const token = authHeader.split(" ")[1];

    // Tokenni tekshirish
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Decoded ma'lumotni requestga qo‘shish
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth xatosi:", error.message);
    return res.status(401).json({ message: "Token yaroqsiz yoki muddati o‘tgan" });
  }
};
