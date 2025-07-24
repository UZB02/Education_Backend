import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, },
  spentAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Expense", expenseSchema);
