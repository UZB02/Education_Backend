import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  teacherId: {
    // qo'shilgan
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher", // yoki Teacher modeli
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
