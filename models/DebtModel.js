import mongoose from "mongoose";

const debtSchema = new mongoose.Schema(
  {
    // Kimning qarzi
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    // Admin identifikatori (Student.admin hozir String bo'lgani uchun)
    admin: { type: String, required: true },

    // Qaysi davr uchun
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },

    // Snapshot qiymatlar (o'sha paytdagi narx)
    monthlyFee: { type: Number, required: true, min: 0 },

    // Hisob-kitob
    periodMonths: { type: Number, default: 1, min: 1 }, // odatda 1 oy
    shouldPay: { type: Number, default: 0, min: 0 }, // monthlyFee * periodMonths
    paid: { type: Number, default: 0, min: 0 }, // shu davr uchun to'langan summa
    debt: { type: Number, default: 0, min: 0 }, // shouldPay - paid (auto)

    status: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },

    lastPaymentAt: { type: Date, default: null },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// Tez qidirish va unikal constraint
debtSchema.index({ admin: 1, year: 1, month: 1 });
debtSchema.index({ studentId: 1, year: 1, month: 1 }, { unique: true });

// Avtomatik hisob-kitob
debtSchema.pre("validate", function (next) {
  // shouldPay = monthlyFee * periodMonths
  if (
    this.isNew ||
    this.isModified("monthlyFee") ||
    this.isModified("periodMonths")
  ) {
    const fee = Number(this.monthlyFee || 0);
    const months = Number(this.periodMonths || 1);
    this.shouldPay = fee * months;
  }

  const due = Math.max(Number(this.shouldPay || 0) - Number(this.paid || 0), 0);
  this.debt = due;
  this.status =
    due === 0 ? "paid" : Number(this.paid || 0) > 0 ? "partial" : "unpaid";
  next();
});

export default mongoose.model("Debt", debtSchema);
