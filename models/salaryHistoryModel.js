import mongoose from "mongoose";

const salaryHistorySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    month: {
      type: String, // Masalan: "2025-07"
      required: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      required: false, // Majburiy emas
      default: "", // Bo‘sh bo‘lishi mumkin
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SalaryHistory", salaryHistorySchema);
