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

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const students = await Promise.all(
      studentsRaw.map(async (student) => {
        const group = student.groupId;
        let paymentStatus = null;

        if (group && group.monthlyFee) {
          const payments = await Payment.find({
            studentId: student._id,
            paidAt: { $gte: startDate, $lte: endDate },
          });

          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
          const isPaid = totalPaid >= group.monthlyFee;
          const remainingAmount = Math.max(group.monthlyFee - totalPaid, 0);

          paymentStatus = {
            isPaid,
            totalPaid,
            remainingAmount,
            message: isPaid
              ? "To'langan"
              : "Qarzdor",
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

// Yangi student qo‘shish
export const addStudent = async (req, res) => {
  try {
    const { name, lastname, phone, location, groupId, description, admin, applicationId } = req.body;

    if (!name || !lastname || !groupId || !admin) {
      return res.status(400).json({ message: "Majburiy maydonlar to‘ldirilmagan" });
    }

    const newStudent = await Student.create({
      name,
      lastname,
      phone,
      location,
      groupId,
      description,
      admin,
      // applicationId,
    });

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
// Yordamchi funksiyalar
const dayToIndex = {
  Dushanba: 1,
  Seshanba: 2,
  Chorshanba: 3,
  Payshanba: 4,
  Juma: 5,
  Shanba: 6,
  Yakshanba: 7,
};

// Shu oyda berilgan kunlar qancha bor
function getTotalDaysInMonth(year, month, dayIndex) {
  const date = new Date(year, month, 1);
  let count = 0;
  while (date.getMonth() === month) {
    if (date.getDay() === dayIndex % 7) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

// Shu kundan keyin berilgan kunlar qancha bor
function getRemainingDaysInMonth(year, month, dayIndex, startDay) {
  const date = new Date(year, month, startDay);
  let count = 0;
  while (date.getMonth() === month) {
    if (date.getDay() === dayIndex % 7 && date.getDate() >= startDay) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).populate("groupId");

    if (!student) return res.status(404).json({ message: "Student topilmadi" });

    const group = student.groupId;
    let paymentStatus = null;

    if (group && group.monthlyFee) {
      const monthlyFee = group.monthlyFee;
      const startDate = student.joinedAt || student.createdAt;
      const now = new Date();

      const months = [];
      let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

      let totalPaidAll = 0;
      while (current <= now) {
        const startOfMonth = new Date(
          current.getFullYear(),
          current.getMonth(),
          1
        );
        const endOfMonth = new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        // Oydagi dars kunlari
        const allDaysInMonth = group.days.reduce((sum, day) => {
          return (
            sum +
            getTotalDaysInMonth(
              current.getFullYear(),
              current.getMonth(),
              dayToIndex[day]
            )
          );
        }, 0);

        // Qo‘shilgan kundan keyingi darslar (faqat birinchi oy uchun)
        let daysLeft = allDaysInMonth;
        if (
          current.getFullYear() === startDate.getFullYear() &&
          current.getMonth() === startDate.getMonth()
        ) {
          daysLeft = group.days.reduce((sum, day) => {
            return (
              sum +
              getRemainingDaysInMonth(
                current.getFullYear(),
                current.getMonth(),
                dayToIndex[day],
                startDate.getDate()
              )
            );
          }, 0);
        }

        // Pro-rata summa
        const feeForThisMonth =
          allDaysInMonth > 0
            ? Math.round(monthlyFee * (daysLeft / allDaysInMonth))
            : 0;

        // Shu oy uchun to‘lovlar
        const payments = await Payment.find({
          studentId: id,
          paidAt: { $gte: startOfMonth, $lte: endOfMonth },
        });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        totalPaidAll += totalPaid;

        months.push({
          month: current.toLocaleString("uz-UZ", {
            month: "long",
            year: "numeric",
          }),
          totalPaid,
          remainingAmount: Math.max(feeForThisMonth - totalPaid, 0),
          overpaidAmount: Math.max(totalPaid - feeForThisMonth, 0),
          message: totalPaid >= feeForThisMonth ? "To'langan" : "Qarzdor",
        });

        current.setMonth(current.getMonth() + 1);
      }

      // Umumiy holat
      const shouldPayTotal = months.reduce(
        (sum, m) => sum + (m.remainingAmount + m.totalPaid),
        0
      );
      const remainingAmountAll = Math.max(shouldPayTotal - totalPaidAll, 0);
      const overpaidAmountAll = Math.max(totalPaidAll - shouldPayTotal, 0);
      const isPaid = totalPaidAll >= shouldPayTotal;
      const overallMessage = isPaid
        ? overpaidAmountAll > 0
          ? "Haqdor"
          : "To'langan"
        : "Qarzdor";

      // Agar barcha qarzlar to'langan bo'lsa, qarzdor oylarni ham "To'langan" ga o'zgartirish
      if (isPaid) {
        months.forEach((m) => {
          if (m.message === "Qarzdor") m.message = "To'langan";
        });
      }

      paymentStatus = {
        months,
        totalPaid: totalPaidAll,
        shouldPayTotal,
        remainingAmount: remainingAmountAll,
        overpaidAmount: overpaidAmountAll,
        isPaid,
        overallMessage,
      };
    }

    const studentWithStatus = {
      ...student.toObject(),
      paymentStatus,
    };

    res.status(200).json({ student: studentWithStatus });
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