import Application from "../models/Application.js";
import Student from "../models/studentModel.js";
import Payment from "../models/PaymentModel.js";
import { sendMessageToUser } from "../bot/bot.js";
// Active bo'lgan applicationlarni studentsga qo'shish
export const importActiveApplications = async (req, res) => {
  try {
    const activeApplications = await Application.find({ status: "active" });

    const studentDocs = activeApplications.map((app) => ({
      name: app.name,
      lastname: app.lastname,
      phone: app.phone,
      location: app.location,
      groupId: app.groupId,
      description: app.description,
      admin: app.admin,
      applicationId: app._id,
    }));

    const insertedStudents = await Student.insertMany(studentDocs);

    return res.status(201).json({
      message: `${insertedStudents.length} ta student qo'shildi`,
      data: insertedStudents,
    });
  } catch (error) {
    console.error("Xatolik:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi", error });
  }
};

// Barcha studentlarni olish
export const getAllStudents = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [studentsRaw, total] = await Promise.all([
      Student.find({ admin: adminId })
        .populate("groupId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Student.countDocuments({ admin: adminId }),
    ]);

    const students = await Promise.all(
      studentsRaw.map(async (student) => {
        const group = student.groupId;
        let paymentStatus = null;

        if (group) {
          const startDate = student.joinedAt || student.createdAt;
          const now = new Date();

          const months = [];
          let current = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            1
          );

          const allPayments = await Payment.find({
            studentId: student._id,
          }).sort({
            paidAt: 1,
          });

          let paymentPool = allPayments.map((p) => p.amount);
          let paymentIndex = 0;

          let totalPaidAll = 0;
          let carryOver = 0;
          let carryOverTotalUsed = 0;

          while (current <= now) {
            const year = current.getFullYear();
            const month = current.getMonth();

            // Agar group.days mavjud bo'lsa, oylik kunlarni hisoblash
            const allDaysInMonth =
              group.days?.reduce(
                (sum, day) =>
                  sum + getTotalDaysInMonth(year, month, dayToIndex[day]),
                0
              ) || 0;

            let daysLeft = allDaysInMonth;
            if (
              year === startDate.getFullYear() &&
              month === startDate.getMonth()
            ) {
              daysLeft =
                group.days?.reduce(
                  (sum, day) =>
                    sum +
                    getRemainingDaysInMonth(
                      year,
                      month,
                      dayToIndex[day],
                      startDate.getDate()
                    ),
                  0
                ) || 0;
            }

            const kursFee = calculateMonthlyFee(group, year, month);
            const rawFee =
              allDaysInMonth > 0
                ? Math.round(kursFee * (daysLeft / allDaysInMonth))
                : 0;
            const adjustedFee = rawFee;

            // Haqdorlikni ishlatib yuborish
            let carryOverUsed = Math.min(carryOver, adjustedFee);
            let requiredFee = adjustedFee - carryOverUsed;
            carryOver -= carryOverUsed;
            carryOverTotalUsed += carryOverUsed;

            let totalPaid = 0;
            while (paymentIndex < paymentPool.length) {
              const available = paymentPool[paymentIndex];

              if (totalPaid < requiredFee) {
                const remainingNeed = requiredFee - totalPaid;

                if (available <= remainingNeed) {
                  totalPaid += available;
                  paymentIndex++;
                } else {
                  totalPaid += remainingNeed;
                  carryOver += available - remainingNeed;
                  paymentIndex++;
                }
              } else {
                carryOver += available;
                paymentIndex++;
              }
            }

            totalPaidAll += totalPaid;

            const remainingAmount = Math.max(requiredFee - totalPaid, 0);
            const overpaidAmount = Math.max(
              totalPaid + carryOverUsed - adjustedFee,
              0
            );

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
              message:
                remainingAmount === 0
                  ? overpaidAmount > 0
                    ? "Haqdor"
                    : "To'langan"
                  : "Qarzdor",
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

          paymentStatus = {
            months,
            totalPaid: totalPaidAll,
            shouldPayTotal,
            remainingAmount: remainingAmountAll,
            overpaidAmount: overpaidAmountAll,
            overpaidAmountUsed: carryOverTotalUsed,
            isPaid,
            overallMessage,
          };
        }

        return {
          ...student.toObject(),
          paymentStatus,
        };
      })
    );

    res.status(200).json({
      students,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Studentlarni olishda xatolik:", error);
    res.status(500).json({ message: "Xatolik yuz berdi", error });
  }
};


// Tasodifiy 6 xonali parol yaratish
function generatePassword() {
  return Math.random().toString().slice(2, 8);
}

// Yangi student qo‘shish
export const addStudent = async (req, res) => {
  try {
    const {
      name,
      lastname,
      phone,
      location,
      groupId,
      description,
      admin,
      applicationId,
      parentPhone,
    } = req.body;

    if (!name || !lastname || !groupId || !admin || !parentPhone) {
      return res.status(400).json({
        message: "Majburiy maydonlar to‘ldirilmagan",
      });
    }

    // parentPhone bo‘yicha mavjud farzandlarni tekshirish
    const existingParent = await Student.findOne({ parentPhone });

    let password;
    let rawPass = null; // Telegram orqali yuborish uchun

    if (existingParent) {
      // Agar ota-onaning boshqa farzandi bo‘lsa → mavjud password ishlatiladi
      password = existingParent.password;
    } else {
      // Yangi ota-ona → yangi parol yaratish (shifrsiz)
      rawPass = generatePassword();
      password = rawPass;
    }

    // Yangi student yaratish
    const newStudent = await Student.create({
      name,
      lastname,
      phone,
      location,
      groupId,
      description,
      admin,
      applicationId,
      parentPhone,
      password, // endi oddiy ko‘rinishda saqlanadi
    });

    // Telegram orqali parol yuborish (faqat yangi ota-ona bo‘lsa)
    if (rawPass) {
      const parentStudent = await Student.findOne({ parentPhone });
      if (parentStudent.chatId) {
        await sendMessageToUser(
          parentStudent.chatId,
          `Salom! 👋\nSizning ota-ona portali parolingiz:\n📱 Telefon raqam: ${parentPhone}\n🔑 Parol: ${rawPass}\n\nIltimos, parolingizni hech kimga bermang!`
        );
      } else {
        console.log(
          `Telegram chatId topilmadi. Parol yuborish uchun ota-ona telefon: ${parentPhone}`
        );
      }
    }

    res.status(201).json({
      message: "O‘quvchi muvaffaqiyatli qo‘shildi",
      student: newStudent,
    });
  } catch (error) {
    console.error("O‘quvchi qo‘shishda xatolik:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi", error });
  }
};



// Studentni o‘chirish
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student topilmadi" });
    }

    res.status(200).json({
      message: "O‘quvchi muvaffaqiyatli o‘chirildi",
      student: deletedStudent,
    });
  } catch (error) {
    console.error("O‘quvchini o‘chirishda xatolik:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi", error });
  }
};

// Studentni yangilash
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      lastname,
      phone,
      location,
      groupId,
      description,
      admin,
      parentPhone,
    } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        name,
        lastname,
        phone,
        location,
        groupId,
        description,
        admin,
        parentPhone,
      },
      { new: true } // yangilangan versiyani qaytaradi
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student topilmadi" });
    }

    res.status(200).json({
      message: "O‘quvchi ma'lumotlari yangilandi",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("O‘quvchini yangilashda xatolik:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi", error });
  }
};

// ID bo‘yicha bitta studentni olish + qarzdor oylar

// --- yordamchi funksiyalar ---
const dayToIndex = {
  Dushanba: 1,
  Seshanba: 2,
  Chorshanba: 3,
  Payshanba: 4,
  Juma: 5,
  Shanba: 6,
  Yakshanba: 0, // JS'da Yakshanba = 0
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

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).populate("groupId");

    if (!student) return res.status(404).json({ message: "Student topilmadi" });

    const group = student.groupId;
    let paymentStatus = null;

    if (group) {
      const startDate = student.joinedAt || student.createdAt;
      const now = new Date();

      const months = [];
      let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

      const allPayments = await Payment.find({ studentId: id }).sort({
        paidAt: 1,
      });

      let paymentPool = allPayments.map((p) => p.amount);
      let paymentIndex = 0;

      let totalPaidAll = 0;
      let carryOver = 0; // haqdorlik yoki ortiqcha qism
      let carryOverTotalUsed = 0;

      while (current <= now) {
        const year = current.getFullYear();
        const month = current.getMonth();

        const allDaysInMonth = group.days.reduce(
          (sum, day) => sum + getTotalDaysInMonth(year, month, dayToIndex[day]),
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

        // Haqdorlikni ishlatib yuborish
        let carryOverUsed = Math.min(carryOver, adjustedFee);
        let requiredFee = adjustedFee - carryOverUsed;
        carryOver -= carryOverUsed;
        carryOverTotalUsed += carryOverUsed;

        // Joriy oyning to‘lovi (TUZATILGAN)
        let totalPaid = 0;
        while (paymentIndex < paymentPool.length) {
          const available = paymentPool[paymentIndex];

          if (totalPaid < requiredFee) {
            const remainingNeed = requiredFee - totalPaid;

            if (available <= remainingNeed) {
              totalPaid += available;
              paymentIndex++;
            } else {
              totalPaid += remainingNeed;
              carryOver += (available - remainingNeed); // ortiqcha qism carryOver ga qo‘shiladi
              paymentIndex++;
            }
          } else {
            // Agar requiredFee allaqachon yopilgan bo‘lsa, butun summani carryOver ga qo‘shamiz
            carryOver += available;
            paymentIndex++;
          }
        }

        totalPaidAll += totalPaid;

        // Qarzdorlik hisoblash
        let remainingAmount = Math.max(requiredFee - totalPaid, 0);

        // Hozirgi oydagi haqdorlik (ortiqcha qism)
        const overpaidAmount = Math.max(
          totalPaid + carryOverUsed - adjustedFee,
          0
        );

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
          message:
            remainingAmount === 0
              ? overpaidAmount > 0
                ? "Haqdor"
                : "To'langan"
              : "Qarzdor",
        });

        current.setMonth(current.getMonth() + 1);
      }

      const shouldPayTotal = months.reduce((sum, m) => sum + m.adjustedFee, 0);
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

      paymentStatus = {
        months,
        totalPaid: totalPaidAll,
        shouldPayTotal,
        remainingAmount: remainingAmountAll,
        overpaidAmount: overpaidAmountAll,
        overpaidAmountUsed: carryOverTotalUsed,
        isPaid,
        overallMessage,
      };
    }

    res.status(200).json({ student: { ...student.toObject(), paymentStatus } });
  } catch (error) {
    console.error("Studentni olishda xatolik:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi", error });
  }
};


// O‘quvchiga xabar yuborish
export const sendCustomMessage = async (req, res) => {
  try {
    const { studentId, message } = req.body;
    const student = await Student.findById(studentId);

    if (!student || !student.chatId) {
      return res.status(404).json({ error: "O‘quvchi yoki chatId topilmadi" });
    }

    await sendMessageToUser(student.chatId, message);
    res.json({ success: true, message: "Xabar yuborildi ✅" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Guruhdagi barcha o‘quvchilarga xabar yuborish
export const sendMessageToGroup = async (req, res) => {
  try {
    const { groupId, message } = req.body;

    if (!groupId || !message) {
      return res.status(400).json({ error: "groupId yoki message yo‘q" });
    }

    // Guruhdagi barcha studentlarni olish
    const students = await Student.find({
      groupId, // <-- shu yerda 'groupId'
      chatId: { $exists: true, $ne: null },
    });

    console.log("Students found:", students.length);

    if (!students.length) {
      return res
        .status(404)
        .json({ error: "Guruhda chatId mavjud o‘quvchilar topilmadi" });
    }

    // Har bir o‘quvchiga xabar yuborish
    await Promise.all(
      students.map((student) =>
        sendMessageToUser(student.chatId, message, { parse_mode: "HTML" })
      )
    );

    res.json({
      success: true,
      sentCount: students.length,
      message: "Guruhga xabar yuborildi ✅",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};