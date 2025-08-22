import Progress from "../models/progressModel.js";
import Student from "../models/studentModel.js";
import Attendance from "../models/attendanceModel.js";

// ------------------ Helper: Progress darajasini hisoblash ------------------


// Helper: Level hisoblashconst calculateLevel = (attendanceScore, teacherFeedback) => {
const calculateLevel = (attendanceScore, teacherFeedback) => {
  const score = attendanceScore * 0.5 + teacherFeedback * 0.5;
  if (score >= 80) return "Yuqori";
  if (score >= 60) return "O‘rta";
  return "Past";
};
// ------------------ GROUP STATISTICS ------------------
export const getGroupProgressStats = async (req, res) => {
  try {
    const { groupId, type, year, month } = req.query;

    if (!groupId) return res.status(400).json({ message: "Guruh ID kerak" });

    // Guruhdagi o‘quvchilar
    const students = await Student.find({ groupId });

    if (!students.length)
      return res.status(404).json({ message: "Guruhda o‘quvchi yo‘q" });

    const stats = [];

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    for (const student of students) {
      let start, end;

      if (type === "weekly") {
        const now = new Date();
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay())); // Dushanba
        start = firstDay;
        end = new Date(firstDay);
        end.setDate(end.getDate() + 6); // Yakshanba
      } else if (type === "monthly") {
        start = new Date(currentYear, currentMonth, 1);
        end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      } else if (type === "yearly") {
        start = new Date(currentYear, 0, 1);
        end = new Date(currentYear, 11, 31, 23, 59, 59);
      } else {
        return res.status(400).json({ message: "Type noto‘g‘ri" });
      }

      // Attendance ma'lumotlarini olish
      const attendances = await Attendance.find({
        studentId: student._id,
        date: { $gte: start, $lte: end },
      });

      // Shu davrdagi progresslar
      const progresses = await Progress.find({
        studentId: student._id,
        date: { $gte: start, $lte: end },
      });

      // Attendance score
      let totalAttendance = 0;
      attendances.forEach((a) => {
        if (a.status === "present") totalAttendance += 5;
        else if (a.status === "late") totalAttendance += 2;
      });

      // Teacher feedback jamlash
      let totalTeacherFeedback = 0;
      progresses.forEach((p) => {
        totalTeacherFeedback += p.teacherFeedback || 0;
      });

      const totalScore = totalAttendance + totalTeacherFeedback;
      const overallLevel = calculateLevel(totalAttendance, totalTeacherFeedback);

      stats.push({
        studentId: student._id,
        studentName: student.name + " " + student.lastname,
        attendanceScore: totalAttendance,
        teacherFeedback: totalTeacherFeedback,
        totalScore,
        overallLevel,
      });
    }

    // Ballar bo‘yicha kamayish tartibida sort
    stats.sort((a, b) => b.totalScore - a.totalScore);

    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Guruh statistikasi olishda xatolik",
      error: err.message,
    });
  }
};

// ------------------ CREATE PROGRESS ------------------
export const createProgress = async (req, res) => {
  try {
    const { studentId, teacherFeedback, description } = req.body;
    let { date } = req.body;

    // Agar date kelmagan bo‘lsa, bugungi sanani olish
    if (!date) {
      const today = new Date();
      date = today.toISOString().split("T")[0]; // masalan: "2025-08-22"
    }

    // Studentni topish
    const student = await Student.findById(studentId).populate("groupId");
    if (!student) {
      return res.status(404).json({ message: "Student topilmadi" });
    }

    const subject = student.groupId?.name;
    if (!subject) {
      return res
        .status(400)
        .json({ message: "Student guruhga biriktirilmagan" });
    }

    // Attendance hisoblash
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      studentId,
      date: { $gte: start, $lte: end },
    });

    const attendanceScore = attendances.reduce((sum, att) => {
      if (att.status === "present") return sum + 5;
      if (att.status === "late") return sum + 2;
      return sum; // absent = 0
    }, 0);

    // Umumiy darajani hisoblash
    const overallLevel = calculateLevel(attendanceScore, teacherFeedback);

    // Yangi progress yaratish
    const progress = await Progress.create({
      studentId,
      subject,
      attendanceRate: attendanceScore,
      teacherFeedback,
      description, // 🆕 qo‘shildi
      overallLevel,
      date: new Date(date), // har doim Date object bo‘lishi uchun
    });

    res.status(201).json(progress);
  } catch (err) {
    res.status(500).json({
      message: "Progress yaratishda xatolik",
      error: err.message,
    });
  }
};



// ------------------ GET ALL PROGRESS ------------------
export const getAllProgress = async (req, res) => {
  try {
    const progress = await Progress.find()
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    res.status(200).json(progress);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Progresslarni olishda xatolik", error: err.message });
  }
};

// ------------------ GET STUDENT PROGRESS (kunlik) ------------------
export const getStudentProgress = async (req, res) => {
  try {
    const { id } = req.params;

    // progresslar (oxirgi yozuvdan boshlab)
    let progresses = await Progress.find({ studentId: id })
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    progresses = await Promise.all(
      progresses.map(async (p) => {
        const start = new Date(p.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(p.date);
        end.setHours(23, 59, 59, 999);

        // Shu kunda barcha attendance yozuvlarini olish
        const attendances = await Attendance.find({
          studentId: id,
          date: { $gte: start, $lte: end },
        });

        // Attendance score jamlab hisoblash
        const attendanceScore = attendances.reduce((sum, att) => {
          if (att.status === "present") return sum + 5;
          if (att.status === "late") return sum + 2;
          return sum; // absent = 0
        }, 0);

        // Teacher feedback bo'lmasa 0 qabul qilamiz
        const feedbackScore = p.teacherFeedback || 0;

        const overallLevel = calculateLevel(attendanceScore, feedbackScore);

        return {
          ...p.toObject(),
          attendanceRate: attendanceScore,
          overallLevel,
        };
      })
    );

    res.status(200).json(progresses);
  } catch (err) {
    res.status(500).json({
      message: "O‘quvchi progressini olishda xatolik",
      error: err.message,
    });
  }
};



// ------------------ GET STUDENT MONTHLY PROGRESS ------------------
export const getStudentMonthlyProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    if (!month || !year)
      return res
        .status(400)
        .json({ message: "Oy va yil parametrlarini kiriting" });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const attendances = await Attendance.find({
      studentId: id,
      date: { $gte: start, $lte: end },
    });

    const totalAttendance = attendances.reduce((sum, att) => {
      if (att.status === "present") return sum + 5;
      if (att.status === "late") return sum + 2;
      return sum; // absent = 0
    }, 0);

    const progresses = await Progress.find({
      studentId: id,
      date: { $gte: start, $lte: end },
    });

    const totalFeedback =
      progresses.reduce((sum, p) => sum + p.teacherFeedback, 0) || 0;

    const overallLevel = calculateLevel(totalAttendance, totalFeedback);

    res.status(200).json({
      studentId: id,
      month,
      year,
      totalAttendance,
      totalFeedback,
      overallLevel,
    });
  } catch (err) {
    res.status(500).json({
      message: "O‘quvchi oylik progressini olishda xatolik",
      error: err.message,
    });
  }
};

// ------------------ UPDATE PROGRESS ------------------
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherFeedback, description } = req.body; // 🆕 description qo‘shildi

    const progress = await Progress.findById(id);
    if (!progress) {
      return res.status(404).json({ message: "Progress topilmadi" });
    }

    // AttendanceRateni Attendance collectiondan olish
    const start = new Date(progress.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(progress.date);
    end.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      studentId: progress.studentId,
      date: { $gte: start, $lte: end },
    });

    const attendanceScore = attendances.reduce((sum, att) => {
      if (att.status === "present") return sum + 5;
      if (att.status === "late") return sum + 2;
      return sum; // absent = 0
    }, 0);

    // Umumiy level qayta hisoblash
    const overallLevel = calculateLevel(attendanceScore, teacherFeedback);

    // Ma’lumotlarni yangilash
    progress.attendanceRate = attendanceScore;
    progress.teacherFeedback = teacherFeedback;
    progress.description = description || progress.description; // 🆕 yangilash
    progress.overallLevel = overallLevel;

    await progress.save();

    res.status(200).json(progress);
  } catch (err) {
    res.status(500).json({
      message: "Progress yangilashda xatolik",
      error: err.message,
    });
  }
};

// ------------------ DELETE PROGRESS ------------------
export const deleteProgress = async (req, res) => {
  try {
    const { id } = req.params;
    await Progress.findByIdAndDelete(id);
    res.status(200).json({ message: "Progress o‘chirildi" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Progress o‘chirishda xatolik", error: err.message });
  }
};

// ------------------ GET STUDENT YEARLY PROGRESS (oylik) ------------------
export const getStudentYearlyProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { year } = req.query;

    if (!year) return res.status(400).json({ message: "Yil kerak" });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      days: [], // kunlik tafsilotlar
      attendanceScore: 0,
      teacherFeedback: 0,
    }));

    for (let i = 0; i < 12; i++) {
      const start = new Date(year, i, 1);
      const end = new Date(year, i + 1, 0, 23, 59, 59);

      // Shu oy uchun barcha attendance yozuvlari
      const attendances = await Attendance.find({
        studentId: id,
        date: { $gte: start, $lte: end },
      });

      // Har bir attendance score hisoblanadi
      const dailyData = attendances.map((att) => {
        let score = 0;
        if (att.status === "present") score = 5;
        else if (att.status === "late") score = 2;
        return {
          date: att.date,
          status: att.status,
          score,
        };
      });

      // Oy bo‘yicha jami attendance balli
      const attendanceScore = dailyData.reduce((sum, d) => sum + d.score, 0);

      // Shu oy progresslari
      const progresses = await Progress.find({
        studentId: id,
        date: { $gte: start, $lte: end },
      });

      const totalFeedback =
        progresses.reduce((sum, p) => sum + (p.teacherFeedback || 0), 0);

      monthlyData[i].days = dailyData; 
      monthlyData[i].attendanceScore = attendanceScore;
      monthlyData[i].teacherFeedback = totalFeedback;
    }

    // Natija
    const result = monthlyData.map((m) => ({
      month: m.month,
      totalAttendance: m.attendanceScore,
      totalFeedback: m.teacherFeedback,
      details: m.days, // kunlik tafsilotlar
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      message: "Yillik progress olishda xatolik",
      error: err.message,
    });
  }
};
