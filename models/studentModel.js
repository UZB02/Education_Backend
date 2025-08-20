import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  phone: {
    type: String, // o‘quvchining o‘z telefoni
    default: null,
  },
  parentPhone: {
    type: String, // ota-ona telefoni (ota-ona portali uchun asosiy)
    required: true,
  },
  location: {
    type: String,
    default: null,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  description: {
    type: String,
    default: null,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // admin kim tomonidan qo‘shilgan
    required: true,
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
  },
  chatId: {
    // ✅ Telegram chat ID
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Student", studentSchema);
