import jwt from "jsonwebtoken";

// parentAuth middleware
export const parentAuth = (req, res, next) => {
  try {
    // 1️⃣ Headerdan token olish (Authorization: Bearer <token>)
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token mavjud emas" });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Tokenni tekshirish
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ req.parent ga ma’lumot qo‘yish
    req.parent = {
      phone: decoded.parentPhone,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token noto‘g‘ri yoki muddati tugagan" });
  }
};
