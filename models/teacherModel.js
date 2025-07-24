import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    science: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // yoki "Admin", agar siz adminlar ro'yxatini yuritsangiz
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Teacher", teacherSchema);
