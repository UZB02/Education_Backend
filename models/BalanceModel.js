import mongoose from "mongoose";

const balanceSchema = new mongoose.Schema({
  amount: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Balance", balanceSchema);
