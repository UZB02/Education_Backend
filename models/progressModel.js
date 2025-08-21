import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    attendanceRate: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    teacherFeedback: {
      type: Number,
      min: 1,
      max: 5,
      default: 0,
    },
    overallLevel: {
      type: String,
      enum: ["Past", "O‘rta", "Yuqori"],
      default: "Past",
    },
    date: {
      type: Date,
      default: Date.now, // 🆕 qo‘shildi
    },
  },
  { timestamps: true }
);

export default mongoose.model("Progress", progressSchema);
