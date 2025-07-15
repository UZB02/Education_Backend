import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Ro'yxatdan o'tkazish
export const register = async (req, res) => {
  const { name, lastname, phone, password } = req.body;

  const existing = await User.findOne({ phone });
  if (existing) {
    return res
      .status(400)
      .json({ message: "Bu phone raqami allaqachon ro‘yxatdan o‘tgan" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, lastname, phone, password: hashedPassword });

  await user.save();
  res.status(201).json({ message: "Ro‘yxatdan o‘tish muvaffaqiyatli bo‘ldi" });
};

// Login qilish
export const login = async (req, res) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res
      .status(401)
      .json({ message: "phone raqami yoki parol noto‘g‘ri" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({
    token,
    id:user._id,
    name: user.name,
    lastname: user.lastname,
    phone: user.phone,
  });
};
