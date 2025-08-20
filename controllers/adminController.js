import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Super Admin yoki Admin qo'shish
export const registerAdmin = async (req, res) => {
  try {
    const { name, lastname, phone, password, role, permissions } = req.body;

    // Telefon raqam tekshirish
    const existingAdmin = await Admin.findOne({ phone });
    if (existingAdmin)
      return res.status(400).json({ message: "Telefon raqam mavjud" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default permissions
    const defaultPermissions = {
      manageUsers: true,
      managePayments: true,
      manageGroups: true,
      manageStudents: true,
    };

    const newAdmin = new Admin({
      name,
      lastname,
      phone,
      password: hashedPassword,
      role: role || "admin",
      permissions:
        role === "super-admin" ? defaultPermissions : permissions || {},
    });

    await newAdmin.save();

    // JWT token yaratish
    const token = jwt.sign(
      {
        id: newAdmin._id,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res
      .status(201)
      .json({ message: "Admin yaratildi", token, admin: newAdmin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Telefon raqam orqali adminni topish
    const admin = await Admin.findOne({ phone });
    if (!admin) return res.status(404).json({ message: "Admin topilmadi" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Parol noto'g'ri" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role, permissions: admin.permissions },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token, admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Adminlarni ko'rish (Super Admin uchun)
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Adminni o'chirish
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await Admin.findByIdAndDelete(id);
    res.status(200).json({ message: "Admin o'chirildi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
