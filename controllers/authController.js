import User from "../models/User.js";
import Balance from "../models/BalanceModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getOrCreateBalance } from "../utils/balanceUtils.js";

export const register = async (req, res) => {
  try {
    const { name, lastname, phone, password } = req.body;

    const existing = await User.findOne({ phone });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Bu phone raqami allaqachon ro‘yxatdan o‘tgan" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, lastname, phone, password: hashedPassword });

    await user.save(); // ⚠️ Bu kerak
console.log("user:", user);
console.log("user._id:", user._id);
    console.log("Yangi user ID:", user._id); // Tekshiruv

    await getOrCreateBalance(user._id); // ✅ Bu yerda _id aniq bo‘lishi kerak

    res
      .status(201)
      .json({ message: "Ro‘yxatdan o‘tish muvaffaqiyatli bo‘ldi" });
  } catch (err) {
    console.error("register xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};



// Login qilish
export const login = async (req, res) => {
  try {
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
      id: user._id,
      name: user.name,
      lastname: user.lastname,
      phone: user.phone,
    });
  } catch (err) {
    console.error("login xatolik:", err);
    res.status(500).json({ message: "Server xatosi" });
  }
};
