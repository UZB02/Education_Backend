import Group from "../models/groupModel.js";
import Student from "../models/studentModel.js";
import Payment from "../models/PaymentModel.js";

// GET: get all groups by adminId (from query)
export const getAllGroups = async (req, res) => {
  try {
    const adminId = req.query.adminId;
    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    // 1. Barcha guruhlarni olamiz
    const groups = await Group.find({ admin: adminId }).populate("teacher");

    // 2. Har bir guruh uchun groupId asosida studentlarni qo‘shamiz
    const groupsWithStudents = await Promise.all(
      groups.map(async (group) => {
        const students = await Student.find({ groupId: group._id });
        return {
          ...group.toObject(),
          students,
        };
      })
    );

    res.json(groupsWithStudents);
  } catch (error) {
    console.error("❌ getAllGroups xatolik:", error);
    res.status(500).json({ message: "Error fetching groups", error });
  }
};

// GET: get one group by ID and adminId
export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    const group = await Group.findOne({ _id: id, admin: adminId }).populate(
      "teacher"
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const students = await Student.find({ groupId: id });

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
      let totalDaysInMonth = group.days.reduce(
        (sum, day) => sum + getTotalDaysInMonth(year, month, dayToIndex[day]),
        0
      );

      for (let i = 0; i < feeHistory.length; i++) {
        const currentFee = feeHistory[i];
        const nextChange = feeHistory[i + 1]?.changedAt || endOfMonth;

        const start = new Date(Math.max(currentFee.changedAt, startOfMonth));
        const end = new Date(Math.min(nextChange, endOfMonth));

        let daysInPeriod = 0;
        for (const day of group.days) {
          const dayIndex = dayToIndex[day];
          const tempDate = new Date(start);
          while (tempDate <= end) {
            if (
              tempDate.getDay() === dayIndex &&
              tempDate.getMonth() === month
            ) {
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

    const now = new Date();

    const studentsWithPaymentStatus = await Promise.all(
      students.map(async (student) => {
        const startDate = student.joinedAt || student.createdAt;
        let current = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          1
        );

        const allPayments = await Payment.find({ studentId: student._id }).sort(
          { paidAt: 1 }
        );
        let paymentPool = allPayments.map((p) => p.amount);
        let paymentIndex = 0;

        let totalPaidAll = 0;
        let carryOver = 0;
        let carryOverTotalUsed = 0;
        const months = [];

        while (current <= now) {
          const year = current.getFullYear();
          const month = current.getMonth();

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

          let totalPaid = 0;
          while (paymentIndex < paymentPool.length && totalPaid < adjustedFee) {
            const remainingNeed = adjustedFee - totalPaid;
            const available = paymentPool[paymentIndex];

            if (available <= remainingNeed) {
              totalPaid += available;
              paymentIndex++;
            } else {
              totalPaid += remainingNeed;
              paymentPool[paymentIndex] -= remainingNeed;
            }
          }

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

        const paymentStatus = {
          months,
          totalPaid: totalPaidAll,
          shouldPayTotal,
          remainingAmount: remainingAmountAll,
          overpaidAmount: overpaidAmountAll,
          overpaidAmountUsed: carryOverTotalUsed,
          isPaid,
          overallMessage,
        };

        return {
          ...student.toObject(),
          paymentStatus,
        };
      })
    );

    res.json({
      ...group.toObject(),
      students: studentsWithPaymentStatus,
    });
  } catch (error) {
    console.error("getGroupById error:", error);
    res.status(500).json({ message: "Error fetching group", error });
  }
};




// POST: create group with adminId (from body)
export const createGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      teacher,
      monthlyFee,
      adminId,
      scheduleType,
      days,
    } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    // Agar custom bo‘lsa -> days kerak
    if (scheduleType === "custom" && (!days || days.length === 0)) {
      return res
        .status(400)
        .json({ message: "Custom schedule requires days array" });
    }

    // Agar toq/juft bo‘lsa -> avtomatik belgilaymiz
    let finalDays = days;
    if (scheduleType === "toq") {
      finalDays = ["Dushanba", "Chorshanba", "Juma"];
    } else if (scheduleType === "juft") {
      finalDays = ["Seshanba", "Payshanba", "Shanba"];
    }

    const newGroup = new Group({
      name,
      monthlyFee,
      description,
      teacher,
      admin: adminId,
      scheduleType,
      days: finalDays,
      createdAtCustom: new Date(),
      updatedAtCustom: new Date(),
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    res.status(400).json({ message: "Error creating group", error });
  }
};

// PUT: update group only if adminId matches
export const updateGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      teacher,
      monthlyFee,
      adminId,
      scheduleType,
      days,
    } = req.body;
    const { id } = req.params;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    // scheduleType asosida finalDays
    let finalDays = days;
    if (scheduleType === "toq") {
      finalDays = ["Dushanba", "Chorshanba", "Juma"];
    } else if (scheduleType === "juft") {
      finalDays = ["Seshanba", "Payshanba", "Shanba"];
    } else if (scheduleType === "custom" && (!days || days.length === 0)) {
      return res
        .status(400)
        .json({ message: "Custom schedule requires days array" });
    }

    const updatedGroup = await Group.findOneAndUpdate(
      { _id: id, admin: adminId },
      {
        name,
        monthlyFee,
        description,
        teacher,
        scheduleType,
        days: finalDays,
        updatedAtCustom: new Date(),
      },
      { new: true }
    );

    if (!updatedGroup) {
      return res
        .status(404)
        .json({ message: "Group not found or access denied" });
    }

    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: "Error updating group", error });
  }
};

// DELETE: delete group only if adminId matches
export const deleteGroup = async (req, res) => {
  try {
    const { adminId } = req.query;
    const { id } = req.params;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    const deletedGroup = await Group.findOneAndDelete({
      _id: id,
      admin: adminId,
    });

    if (!deletedGroup) {
      return res
        .status(404)
        .json({ message: "Group not found or access denied" });
    }

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting group", error });
  }
};
