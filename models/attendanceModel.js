import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true, // individual qidiruv uchun
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true, // guruh bo‘yicha tez filterlash
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true, // o‘qituvchi bo‘yicha tez filterlash
    },
    date: {
      type: Date,
      required: true,
      index: true, // date bo‘yicha tez qidiruv va aggregation
    },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound indexlar: tez-tez ishlatiladigan querylar uchun
attendanceSchema.index({ studentId: 1, date: 1 });
attendanceSchema.index({ groupId: 1, date: 1 });
attendanceSchema.index({ teacherId: 1, date: 1 });

export default mongoose.model("Attendance", attendanceSchema);
