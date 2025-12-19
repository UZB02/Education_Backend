import Teacher from "../models/teacherModel.js";
import Payment from "../models/PaymentModel.js";
import Student from "../models/studentModel.js";
import Group from "../models/groupModel.js";
import SalaryHistory from "../models/salaryHistoryModel.js";
import { sendMessageToTeacher } from "../bot/teachersBot.js";

// GET: Faqat kirgan userga tegishli o'qituvchilar + maoshlar tarixi
export const getAllTeachers = async (req, res) => {
  const { userId } = req.query;
  try {
    const teachers = await Teacher.find({ userId })
      .populate("salaries")
      .sort({ createdAt: -1 });

    // 🔁 Har bir o‘qituvchining oyligini hisoblash
    for (const teacher of teachers) {
      await calculateTeacherSalaryInternal(teacher._id);
    }

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "O'qituvchilarni olishda xatolik", error });
  }
};

// GET: Bitta o‘qituvchini olish va unga tegishli maoshlar tarixi bilan + statistikasi
export const getTeacherById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const teacher = await Teacher.findOne({ _id: id, userId }).populate({
      path: "salaries",
      options: { sort: { month: -1 } },
    });

    if (!teacher) {
      return res
        .status(404)
        .json({ message: "O‘qituvchi topilmadi yoki sizga tegishli emas" });
    }

    // 🧠 Joriy oy statistikasi
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 🔹 Teacherga tegishli guruhlarni olish
    const groups = await Group.find({ teachers: id }).select("_id");
    const groupIds = groups.map((g) => g._id);

    // 🔹 Guruhga tegishli o‘quvchilar
    const students = await Student.find({ groupId: { $in: groupIds } }).select(
      "_id"
    );
    const studentIds = students.map((s) => s._id);

    // 🔹 Shu oyda qilgan to‘lovlar
    const payments = await Payment.find({
      studentId: { $in: studentIds },
      paidAt: { $gte: monthStart, $lte: monthEnd },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // 🔹 Hisoblangan maosh
    let calculatedSalary = 0;
    if (teacher.fixedSalary && teacher.fixedSalary > 0) {
      // Agar fixed salary belgilangan bo‘lsa, uni olamiz
      calculatedSalary = teacher.fixedSalary;
    } else {
      // Aks holda foiz asosida hisoblaymiz
      calculatedSalary = (totalPaid * teacher.percentage) / 100;
    }

    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    // 🔹 Shu oyda o‘qituvchiga berilgan oyliklar tarixi
    const paidSalaries = await SalaryHistory.find({
      teacherId: id,
      month: currentMonth,
    });

    const totalPaidOut = paidSalaries.reduce((sum, s) => sum + s.amount, 0);
    const remainingSalary = calculatedSalary - totalPaidOut;

    // 🔹 Qarzdorlik (agar ko‘proq to‘langan bo‘lsa)
    const overpaidAmount =
      totalPaidOut > calculatedSalary ? totalPaidOut - calculatedSalary : 0;

    // 🔚 Javob
    res.json({
      teacher,
      salaryStats: {
        month: currentMonth,
        percentage: teacher.percentage,
        fixedSalary: teacher.fixedSalary,
        totalCollectedFromStudents: totalPaid,
        calculatedSalary,
        totalPaidOut,
        remainingSalary: remainingSalary < 0 ? 0 : remainingSalary,
        overpaid: overpaidAmount,
        isOverpaid: overpaidAmount > 0,
      },
    });
  } catch (error) {
    console.error("getTeacherById xatolik:", error);
    res.status(500).json({ message: "O‘qituvchini olishda xatolik", error });
  }
};


function generateRandomPassword() {
  return Math.random().toString(36).slice(-8);
}

export const createTeacher = async (req, res) => {
  try {
    const { name, lastname, science, userId, phone, percentage, fixedSalary } =
      req.body;

    if (!name || !lastname || !science || !userId) {
      return res
        .status(400)
        .json({ message: "Barcha maydonlar to‘ldirilishi shart" });
    }

    // 🔥 Random parol yaratamiz
    const rawPassword = generateRandomPassword();

    // 🔥 Teacher yaratamiz
    const newTeacher = new Teacher({
      name,
      lastname,
      science,
      userId,
      phone,
      percentage: Number(percentage) || 0, // foiz
      fixedSalary: Number(fixedSalary) || 0, // belgilangan summa
      password: rawPassword, // ❗ HASH YO‘Q
    });

    await newTeacher.save();

    // 🔥 Parolni qaytaramiz (botga yuborish uchun)
    res.status(201).json({
      message: "O‘qituvchi muvaffaqiyatli yaratildi",
      teacher: newTeacher,
      password: rawPassword, // UI yoki botga yuborish uchun
    });
  } catch (error) {
    res.status(500).json({ message: "O'qituvchini yaratishda xatolik", error });
  }
};


// PUT: O'qituvchini yangilash
export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lastname, science, userId, phone, percentage, fixedSalary } =
      req.body;

    const teacher = await Teacher.findOne({ _id: id, userId });
    if (!teacher) {
      return res.status(404).json({ message: "O‘qituvchi topilmadi" });
    }

    if (name) teacher.name = name;
    if (lastname) teacher.lastname = lastname;
    if (science) teacher.science = science;
    if (phone) teacher.phone = phone;

    // 🔹 Foizni yangilash
    if (typeof percentage !== "undefined") {
      teacher.percentage = Number(percentage) || 0;
    }

    // 🔹 Belgilangan summani yangilash
    if (typeof fixedSalary !== "undefined") {
      teacher.fixedSalary = Number(fixedSalary) || 0;
    }

    await teacher.save();
    res.status(200).json({ message: "O‘qituvchi yangilandi", teacher });
  } catch (error) {
    res.status(500).json({ message: "Yangilashda xatolik", error });
  }
};


// DELETE: Faqat o‘zining o‘qituvchisini o‘chirish
export const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  try {
    const teacher = await Teacher.findOneAndDelete({ _id: id, userId });
    if (!teacher) {
      return res
        .status(404)
        .json({ message: "O‘qituvchi topilmadi yoki sizga tegishli emas" });
    }
    res.json({ message: "O'qituvchi o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: "O'chirishda xatolik", error });
  }
};

// POST: Ball qo‘shish
export const addPointsToTeacher = async (req, res) => {
  const { id } = req.params;
  const { points, userId } = req.body;

  try {
    const teacher = await Teacher.findOne({ _id: id, userId });
    if (!teacher)
      return res.status(404).json({ message: "O‘qituvchi topilmadi" });

    const pointsToAdd = parseInt(points);
    if (isNaN(pointsToAdd)) {
      return res.status(400).json({ message: "Noto‘g‘ri ball qiymati" });
    }

    teacher.points += pointsToAdd;
    await teacher.save();

    res.status(200).json({ message: "Ball qo‘shildi", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error: error.message });
  }
};

// POST: Ball ayirish
export const subtractPointsFromTeacher = async (req, res) => {
  const { id } = req.params;
  const { points, userId } = req.body;

  try {
    const teacher = await Teacher.findOne({ _id: id, userId });
    if (!teacher)
      return res.status(404).json({ message: "O‘qituvchi topilmadi" });

    const pointsToSubtract = parseInt(points);
    if (isNaN(pointsToSubtract) || pointsToSubtract < 0) {
      return res.status(400).json({ message: "Noto‘g‘ri ball qiymati" });
    }

    teacher.points -= pointsToSubtract;
    if (teacher.points < 0) teacher.points = 0;

    await teacher.save();
    res.status(200).json({ message: "Ball ayirildi", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server xatosi", error: error.message });
  }
};

// Ichki foydalanish uchun – joriy oy maoshini hisoblash
const calculateTeacherSalaryInternal = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) return null;

  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  const groups = await Group.find({ teacher: teacherId }).select("_id");
  const groupIds = groups.map((group) => group._id);

  const students = await Student.find({ groupId: { $in: groupIds } }).select("_id");
  const studentIds = students.map((student) => student._id);

  const payments = await Payment.find({
    studentId: { $in: studentIds },
    paidAt: { $gte: start, $lte: end },
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  // 🔹 Foiz yoki fixedSalaryga moslab hisoblash
  let salary = 0;
  if (teacher.fixedSalary && teacher.fixedSalary > 0) {
    salary = teacher.fixedSalary;
  } else {
    salary = (totalPaid * teacher.percentage) / 100;
  }

  teacher.monthlySalary = salary;
  await teacher.save();

  return salary;
};



export const getTeacherMonthlyStats = async (req, res) => {
  try {
    const teacherId = req.params.id;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "O‘qituvchi topilmadi" });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const groups = await Group.find({ teacher: teacherId }).select("_id");
    const groupIds = groups.map((g) => g._id);

    const students = await Student.find({ groupId: { $in: groupIds } }).select(
      "_id"
    );
    const studentIds = students.map((s) => s._id);

    const payments = await Payment.find({
      studentId: { $in: studentIds },
      paidAt: { $gte: monthStart, $lte: monthEnd },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // 🔹 Foiz yoki fixedSalaryga moslab hisoblash
    let calculatedSalary = 0;
    if (teacher.fixedSalary && teacher.fixedSalary > 0) {
      calculatedSalary = teacher.fixedSalary;
    } else {
      calculatedSalary = (totalPaid * teacher.percentage) / 100;
    }

    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const paidSalaries = await SalaryHistory.find({
      teacherId: teacherId,
      month: currentMonth,
    });

    const totalPaidOut = paidSalaries.reduce((sum, s) => sum + s.amount, 0);
    const remainingSalary = calculatedSalary - totalPaidOut;

    res.json({
      teacher: {
        name: teacher.name,
        lastname: teacher.lastname,
        percentage: teacher.percentage,
        fixedSalary: teacher.fixedSalary,
      },
      month: currentMonth,
      totalCollectedFromStudents: totalPaid,
      calculatedSalary,
      totalPaidOut,
      remainingSalary: remainingSalary < 0 ? 0 : remainingSalary,
    });
  } catch (err) {
    console.error("getTeacherMonthlyStats xatolik:", err);
    res.status(500).json({ message: "Xatolik", error: err.message });
  }
};

// O‘qituvchiga xabar yuborish
export const sendCustomMessageToTeacher = async (req, res) => {
  try {
    const { teacherId, message } = req.body;

    // Teacherni ID orqali topish
    const teacher = await Teacher.findById(teacherId);

    if (!teacher || !teacher.chatId) {
      return res
        .status(404)
        .json({ error: "O‘qituvchi yoki chatId topilmadi" });
    }

    // Telegram orqali xabar yuborish
    await sendMessageToTeacher(teacher.chatId, message);

    res.json({ success: true, message: "Xabar yuborildi ✅" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};