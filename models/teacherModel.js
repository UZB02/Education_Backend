import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    science: { type: String, required: true },
    points: { type: Number, default: 0 },
    phone: { type: String },

    // ✅ YANGI QO‘SHILGAN QISM
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    }, // O‘qituvchiga beriladigan foiz: masalan, 30 — 30% demak

    monthlySalary: {
      type: Number,
      default: 0,
    }, // Bu avtomatik hisoblanadi

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// 💡 Virtual field (o‘tmishdagi oyliklar tarixi)
teacherSchema.virtual("salaries", {
  ref: "SalaryHistory",
  localField: "_id",
  foreignField: "teacherId",
  justOne: false,
});

export default mongoose.model("Teacher", teacherSchema);
