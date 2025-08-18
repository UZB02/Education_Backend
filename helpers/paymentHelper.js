// helpers/paymentHelper.js
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

// 🔹 To‘lov statusini hisoblash (TOZALANGAN)
export async function calculatePaymentStatus(student, group) {
  const startDate = student.joinedAt || student.createdAt;
  const now = new Date();

  const months = [];
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  // 🔹 Barcha tushgan to‘lovlarni olish
  const allPayments = await Payment.find({ studentId: student._id }).sort({
    paidAt: 1,
  });
  const totalPaidAll = allPayments.reduce((sum, p) => sum + p.amount, 0);

  while (current <= now) {
    const year = current.getFullYear();
    const month = current.getMonth();

    const allDaysInMonth = group.days.reduce(
      (sum, day) => sum + getTotalDaysInMonth(year, month, dayToIndex[day]),
      0
    );

    let daysLeft = allDaysInMonth;
    if (year === startDate.getFullYear() && month === startDate.getMonth()) {
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

    months.push({
      month: current.toLocaleString("uz-UZ", {
        month: "long",
        year: "numeric",
      }),
      kursFee,
      rawFee,
      adjustedFee,
    });

    current.setMonth(current.getMonth() + 1);
  }

  const shouldPayTotal = months.reduce((sum, m) => sum + m.adjustedFee, 0);

  const remainingAmount = Math.max(shouldPayTotal - totalPaidAll, 0);
  const overpaidAmount = Math.max(totalPaidAll - shouldPayTotal, 0);
  const isPaid = remainingAmount === 0;

  const overallMessage = isPaid
    ? overpaidAmount > 0
      ? "Haqdor"
      : "To'langan"
    : "Qarzdor";

  return {
    months,
    totalPaid: totalPaidAll,
    shouldPayTotal,
    remainingAmount,
    overpaidAmount,
    overpaidAmountUsed: 0, // carryOver ishlatilmaydi
    isPaid,
    overallMessage,
  };
}
