import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    phone: { type: String, required: true, unique: true }, // telefon unique
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
    permissions: {
      manageUsers: { type: Boolean, default: false },
      managePayments: { type: Boolean, default: false },
      manageGroups: { type: Boolean, default: false },
      manageStudents: { type: Boolean, default: false },
      manageTeachers: { type: Boolean, default: false }, // yangi qo‘shildi
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
