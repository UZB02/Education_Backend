import Student from "../models/studentModel.js";
import Payment from "../models/PaymentModel.js";

const dayToIndex = {
  Dushanba: 1,
  Seshanba: 2,
  Chorshanba: 3,
  Payshanba: 4,
  Juma: 5,
  Shanba: 6,
  Yakshanba: 0,
};

function getTotalDaysInMonth(year, month, dayIndex) {
  const date = new Date(year, month, 1);
  let count = 0;
  while (date.getMonth() === month) {
    if (date.getDay() === dayIndex) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

function getRemainingDaysInMonth(year, month, dayIndex, startDay) {
  const date = new Date(year, month, startDay);
  let count = 0;
  while (date.getMonth() === month) {
    if (date.getDay() === dayIndex) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

function calculateMonthlyFee(group, year, month) {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const feeHistory = (group.monthlyFeeHistory || [])
    .filter((f) => f.changedAt <= endOfMonth)
    .sort((a, b) => a.changedAt - b.changedAt);

  if (feeHistory.length === 0) return group.monthlyFee || 0;

  let totalFee = 0;
  let totalDaysInMonth =
    group.days?.reduce(
      (sum, day) => sum + getTotalDaysInMonth(year, month, dayToIndex[day]),
      0
    ) || 0;

  for (let i = 0; i < feeHistory.length; i++) {
    const currentFee = feeHistory[i];
    const nextChange = feeHistory[i + 1]?.changedAt || endOfMonth;

    const start = new Date(Math.max(currentFee.changedAt, startOfMonth));
    const end = new Date(Math.min(nextChange, endOfMonth));

    let daysInPeriod = 0;
    for (const day of group.days || []) {
      const dayIndex = dayToIndex[day];
      const tempDate = new Date(start);
      while (tempDate <= end) {
        if (tempDate.getDay() === dayIndex && tempDate.getMonth() === month) {
          daysInPeriod++;
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }
    }

    const proportionalFee =
      totalDaysInMonth > 0
        ? Math.round(currentFee.amount * (daysInPeriod / totalDaysInMonth))
        : 0;

    totalFee += proportionalFee;
  }

  return totalFee;
}

export const getTotalDebtors = async (req, res) => {
  try {
    const adminId = req.user.id || req.user._id;
    const students = await Student.find({ admin: adminId }).populate("groupId");
    const now = new Date();
    const debtors = [];

    for (let student of students) {
      try {
        const group = student.groupId;
        if (!group?.days || (!group.monthlyFee && !group.monthlyFeeHistory))
          continue;

        const startDate = student.joinedAt || student.createdAt;
        if (!startDate) continue;

        let current = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          1
        );
        let totalPaidAll = 0;
        let carryOver = 0;
        let carryOverTotalUsed = 0;
        const months = [];

        while (current <= now) {
          const year = current.getFullYear();
          const month = current.getMonth();

          const startOfMonth = new Date(year, month, 1);
          const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

          const allDaysInMonth = group.days.reduce(
            (sum, day) =>
              sum + getTotalDaysInMonth(year, month, dayToIndex[day]),
            0
          );

          let daysLeft = allDaysInMonth;
          if (
            year === startDate.getFullYear() &&
            month === startDate.getMonth()
          ) {
            daysLeft = group.days.reduce(
              (sum, day) =>
                sum +
                getRemainingDaysInMonth(
                  year,
                  month,
                  dayToIndex[day],
                  startDate.getDate()
                ),
              0
            );
          }

          const kursFee = calculateMonthlyFee(group, year, month);
          const rawFee =
            allDaysInMonth > 0
              ? Math.round(kursFee * (daysLeft / allDaysInMonth))
              : 0;
          const adjustedFee = rawFee;

          const payments = await Payment.find({
            studentId: student._id,
            paidAt: { $gte: startOfMonth, $lte: endOfMonth },
          });

          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
          totalPaidAll += totalPaid;

          let remainingAmount = Math.max(adjustedFee - totalPaid, 0);
          let carryOverUsed = Math.min(carryOver, remainingAmount);
          remainingAmount -= carryOverUsed;
          carryOver -= carryOverUsed;
          carryOverTotalUsed += carryOverUsed;

          const overpaidAmount = Math.max(
            totalPaid + carryOverUsed - adjustedFee,
            0
          );
          carryOver += overpaidAmount;

          months.push({
            month: current.toLocaleString("uz-UZ", {
              month: "long",
              year: "numeric",
            }),
            kursFee,
            rawFee,
            adjustedFee,
            carryOverUsed,
            totalPaid,
            remainingAmount,
            overpaidAmount,
            message: remainingAmount === 0 ? "To'langan" : "Qarzdor",
          });

          current.setMonth(current.getMonth() + 1);
        }

        const shouldPayTotal = months.reduce(
          (sum, m) => sum + m.adjustedFee,
          0
        );
        const remainingAmountAll = months.reduce(
          (sum, m) => sum + m.remainingAmount,
          0
        );
        const overpaidAmountAll = carryOver;
        const isPaid = remainingAmountAll === 0;

        const overallMessage = isPaid
          ? overpaidAmountAll > 0
            ? "Haqdor"
            : "To'langan"
          : "Qarzdor";

        if (overallMessage === "Qarzdor" || overallMessage === "Haqdor") {
          debtors.push({
            student: {
              _id: student._id,
              name: student.name,
              lastname: student.lastname || "",
            },
            group: group ? { _id: group._id, name: group.name } : null,
            admin: adminId,
            paymentStatus: {
              months,
              totalPaid: totalPaidAll,
              shouldPayTotal,
              remainingAmount: remainingAmountAll,
              overpaidAmount: overpaidAmountAll,
              overpaidAmountUsed: carryOverTotalUsed,
              isPaid,
              overallMessage,
            },
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
