import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    science: { type: String, required: true },
    points: { type: Number, default: 0 },
    phone: { type: String, required: false },
    monthlySalary: { type: Number, default: 0 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// 💡 Virtual field: salaries (maoshlar tarixi)
teacherSchema.virtual("salaries", {
  ref: "SalaryHistory",
  localField: "_id",
  foreignField: "teacherId",
  justOne: false,
});

export default mongoose.model("Teacher", teacherSchema);
