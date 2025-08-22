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
    description: {
      type: String,
      trim: true,
      default: "", // agar yuborilmasa bo‘sh bo‘ladi
    },
    teacherFeedback: {
      type: Number,
      default: 0,
    },
    overallLevel: {
      type: String,
      enum: ["Past", "O‘rta", "Yuqori"],
      default: "Past",
    },
    date: {
      type: Date,
      default: Date.now, // avtomatik bugungi sana
    },
  },
  { timestamps: true }
);

export default mongoose.model("Progress", progressSchema);
