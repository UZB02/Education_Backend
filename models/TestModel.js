import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  points: { type: Number, default: 1 },
});

const resultSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  studentSurname: { type: String, required: true },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
      selectedOption: { type: String, required: true },
    },
  ],
  score: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
});

const testSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  description: { type: String, default: "" },
  questions: [questionSchema],
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  linkToken: { type: String, unique: true }, // o‘quvchilar havolasi uchun token
  results: [resultSchema], // o‘quvchilar natijalari
  createdAt: { type: Date, default: Date.now },
});

const Test = mongoose.model("Test", testSchema);
export default Test;
