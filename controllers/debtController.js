// controllers/paymentController.js
import Student from "../models/studentModel.js";
import Group from "../models/groupModel.js";
import Payment from "../models/PaymentModel.js";
import { calculatePaymentStatus } from "../helpers/paymentHelper.js";

export const getTotalDebtors = async (req, res) => {
  try {
    const adminId = req.user.id || req.user._id;
    const students = await Student.find({ admin: adminId }).populate("groupId");
    const debtors = [];

    for (let student of students) {
      try {
        const group = student.groupId;
        if (!group?.days || (!group.monthlyFee && !group.monthlyFeeHistory))
          continue;

        const status = await calculatePaymentStatus(student, group);
        if (!status) continue;

        if (status.overallMessage !== "To'langan") {
          debtors.push({
            student: {
              _id: student._id,
              name: student.name,
              lastname: student.lastname || "",
            },
            group: group ? { _id: group._id, name: group.name } : null,
            admin: adminId,
            paymentStatus: status,
          });
        }
      } catch (innerErr) {
        console.error("❌ Student error:", student.name, innerErr.message);
      }
    }

    res.json(debtors);
  } catch (err) {
    console.error("❌ getTotalDebtors error:", err.message);
    res.status(500).json({ message: "Xatolik yuz berdi", error: err.message });
  }
};

