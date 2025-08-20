import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  deleteAdmin,
} from "../controllers/adminController.js";
import { verifySuperAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin qo'shish faqat Super Admin
router.post("/register", registerAdmin);

// Login har bir admin qilishi mumkin
router.post("/login", loginAdmin);

// Super Admin barcha adminlarni ko'radi
router.get("/", verifySuperAdmin, getAllAdmins);

// Super Admin adminni o'chiradi
router.delete("/:id", verifySuperAdmin, deleteAdmin);

export default router;
