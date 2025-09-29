import Progress from "../models/progressModel.js";
import Student from "../models/studentModel.js";
import Attendance from "../models/attendanceModel.js";

// ------------------ Helper: Level hisoblash ------------------
const calculateLevel = (attendanceScore, teacherFeedback) => {
  const score = (attendanceScore || 0) * 0.5 + (teacherFeedback || 0) * 0.5;
  if (score >= 80) return "Yuqori";
  if (score >= 60) return "O‘rta";
  return "Past";
};

// ------------------ Helper: Progress hisoblash ------------------
const computeProgress = (attendances = [], teacherFeedback = 0) => {
  const attendanceScore = attendances.reduce((sum, att) => {
    if (att.status === "present") return sum + 5;
    if (att.status === "late") return sum + 2;
    return sum;
  }, 0);

  const feedbackScore = teacherFeedback || 0;
  const overallLevel = calculateLevel(attendanceScore, feedbackScore);

  return { attendanceScore, feedbackScore, overallLevel };
};

// ------------------ CREATE PROGRESS ------------------
export const createProgress = async (req, res) => {
  try {
    const { studentId, teacherFeedback = 0, description } = req.body;
    let { date } = req.body;

    if (!date) date = new Date().toISOString().split("T")[0];

    const student = await Student.findById(studentId).populate("groupId");
    if (!student) return res.status(404).json({ message: "Student topilmadi" });

    const subject = student.groupId?.name || "";

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      studentId,
      date: { $gte: start, $lte: end },
    });

    const { attendanceScore, overallLevel } = computeProgress(
      attendances,
      teacherFeedback
    );

    const progress = await Progress.create({
      studentId,
      subject,
      attendanceRate: attendanceScore,
      teacherFeedback,
      description,
      overallLevel,
      date: new Date(date),
    });

    res.status(201).json(progress);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Progress yaratishda xatolik", error: err.message });
  }
};

// ------------------ UPDATE PROGRESS ------------------
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherFeedback = 0, description } = req.body;

    const progress = await Progress.findById(id);
    if (!progress)
      return res.status(404).json({ message: "Progress topilmadi" });

    const start = new Date(progress.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(progress.date);
    end.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      studentId: progress.studentId,
      date: { $gte: start, $lte: end },
    });

    const { attendanceScore, overallLevel } = computeProgress(
      attendances,
      teacherFeedback
    );

    progress.attendanceRate = attendanceScore;
    progress.teacherFeedback = teacherFeedback;
    progress.description = description || progress.description;
    progress.overallLevel = overallLevel;

    await progress.save();
    res.status(200).json(progress);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Progress yangilashda xatolik", error: err.message });
  }
};

// ------------------ GET STUDENT PROGRESS (kunlik) ------------------
export const getStudentProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const progresses = await Progress.find({ studentId: id })
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    const attendances = await Attendance.find({ studentId: id });

    const allDatesSet = new Set([
      ...attendances.map((a) => a.date.toDateString()),
      ...progresses.map((p) => p.date.toDateString()),
    ]);

    const allDates = Array.from(allDatesSet).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    const result = allDates.map((dateStr) => {
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr);
      end.setHours(23, 59, 59, 999);

      const dayAttendances = attendances.filter(
        (a) => a.date >= start && a.date <= end
      );
      const dayProgress = progresses.find(
        (p) => p.date.toDateString() === dateStr
      );

      const teacherFeedback = dayProgress?.teacherFeedback || 0;
      const subject = dayProgress?.subject || "";
      const description = dayProgress?.description || "";

      const { attendanceScore, overallLevel } = computeProgress(
        dayAttendances,
        teacherFeedback
      );

      return {
        studentId: id,
        studentName:
          dayProgress?.studentId?.name +
          " " +
          (dayProgress?.studentId?.lastname || ""),
        date: start,
        attendanceRate: attendanceScore,
        teacherFeedback,
        overallLevel,
        description,
        subject,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    res
      .status(500)
      .json({
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
    const progresses = await Progress.find({
      studentId: id,
      date: { $gte: start, $lte: end },
    });

    const allDatesSet = new Set([
      ...attendances.map((a) => a.date.toDateString()),
      ...progresses.map((p) => p.date.toDateString()),
    ]);

    const allDates = Array.from(allDatesSet).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const dailyProgress = allDates.map((dateStr) => {
      const dayStart = new Date(dateStr);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dateStr);
      dayEnd.setHours(23, 59, 59, 999);

      const dayAttendances = attendances.filter(
        (a) => a.date >= dayStart && a.date <= dayEnd
      );
      const dayProgress = progresses.find(
        (p) => p.date.toDateString() === dateStr
      );

      const teacherFeedback = dayProgress?.teacherFeedback || 0;
      const subject = dayProgress?.subject || "";
      const description = dayProgress?.description || "";

      const { attendanceScore, overallLevel } = computeProgress(
        dayAttendances,
        teacherFeedback
      );

      return {
        date: dayStart,
        attendanceRate: attendanceScore,
        teacherFeedback,
        overallLevel,
        description,
        subject,
      };
    });

    const totalAttendance = dailyProgress.reduce(
      (sum, d) => sum + d.attendanceRate,
      0
    );
    const totalFeedback = dailyProgress.reduce(
      (sum, d) => sum + d.teacherFeedback,
      0
    );
    const overallLevel = calculateLevel(totalAttendance, totalFeedback);

    res
      .status(200)
      .json({
        studentId: id,
        month,
        year,
        totalAttendance,
        totalFeedback,
        overallLevel,
        dailyProgress,
      });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "O‘quvchi oylik progressini olishda xatolik",
        error: err.message,
      });
  }
};

// ------------------ GET STUDENT YEARLY PROGRESS ------------------
export const getStudentYearlyProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { year } = req.query;
    if (!year) return res.status(400).json({ message: "Yil kerak" });

    const monthlyData = [];

    for (let i = 0; i < 12; i++) {
      const start = new Date(year, i, 1);
      const end = new Date(year, i + 1, 0, 23, 59, 59);

      const attendances = await Attendance.find({
        studentId: id,
        date: { $gte: start, $lte: end },
      });
      const progresses = await Progress.find({
        studentId: id,
        date: { $gte: start, $lte: end },
      });

      const allDatesSet = new Set([
        ...attendances.map((a) => a.date.toDateString()),
        ...progresses.map((p) => p.date.toDateString()),
      ]);

      const allDates = Array.from(allDatesSet).sort(
        (a, b) => new Date(a) - new Date(b)
      );

      const dailyProgress = allDates.map((dateStr) => {
        const dayStart = new Date(dateStr);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateStr);
        dayEnd.setHours(23, 59, 59, 999);

        const dayAttendances = attendances.filter(
          (a) => a.date >= dayStart && a.date <= dayEnd
        );
        const dayProgress = progresses.find(
          (p) => p.date.toDateString() === dateStr
        );

        const teacherFeedback = dayProgress?.teacherFeedback || 0;
        const subject = dayProgress?.subject || "";
        const description = dayProgress?.description || "";

        const { attendanceScore, overallLevel } = computeProgress(
          dayAttendances,
          teacherFeedback
        );

        return {
          date: dayStart,
          attendanceRate: attendanceScore,
          teacherFeedback,
          overallLevel,
          description,
          subject,
        };
      });

      const totalAttendance = dailyProgress.reduce(
        (sum, d) => sum + d.attendanceRate,
        0
      );
      const totalFeedback = dailyProgress.reduce(
        (sum, d) => sum + d.teacherFeedback,
        0
      );
      const overallLevel = calculateLevel(totalAttendance, totalFeedback);

      monthlyData.push({
        month: i + 1,
        totalAttendance,
        totalFeedback,
        overallLevel,
        dailyProgress,
      });
    }

    res.status(200).json(monthlyData);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Yillik progress olishda xatolik", error: err.message });
  }
};

// ------------------ GET GROUP PROGRESS STATS ------------------
export const getGroupProgressStats = async (req, res) => {
  try {
    const { groupId, type, year, month } = req.query;
    if (!groupId) return res.status(400).json({ message: "Guruh ID kerak" });

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
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        start = firstDay;
        end = new Date(firstDay);
        end.setDate(end.getDate() + 6);
      } else if (type === "monthly") {
        start = new Date(currentYear, currentMonth, 1);
        end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      } else if (type === "yearly") {
        start = new Date(currentYear, 0, 1);
        end = new Date(currentYear, 11, 31, 23, 59, 59);
      } else {
        return res.status(400).json({ message: "Type noto‘g‘ri" });
      }

      const attendances = await Attendance.find({
        studentId: student._id,
        date: { $gte: start, $lte: end },
      });
      const progresses = await Progress.find({
        studentId: student._id,
        date: { $gte: start, $lte: end },
      });

      const totalFeedback = progresses.reduce(
        (sum, p) => sum + (p.teacherFeedback || 0),
        0
      );
      const { attendanceScore, overallLevel } = computeProgress(
        attendances,
        totalFeedback
      );

      stats.push({
        studentId: student._id,
        studentName: student.name + " " + (student.lastname || ""),
        attendanceScore,
        teacherFeedback: totalFeedback,
        totalScore: attendanceScore + totalFeedback,
        overallLevel,
      });
    }

    stats.sort((a, b) => b.totalScore - a.totalScore);

    res.status(200).json(stats);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Guruh statistikasi olishda xatolik",
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


// ------------------ GET ALL PROGRESS ------------------
export const getAllProgress = async (req, res) => {
  try {
    const progresses = await Progress.find()
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    res.status(200).json(progresses);
  } catch (err) {
    res.status(500).json({
      message: "Progresslarni olishda xatolik",
      error: err.message,
    });
  }
};
