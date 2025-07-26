import Teacher from "../models/teacherModel.js";

// GET: Faqat kirgan userga tegishli o'qituvchilar + maoshlar tarixi
export const getAllTeachers = async (req, res) => {
  const { userId } = req.query;
  try {
    const teachers = await Teacher.find({ userId })
      .populate("salaries") // maoshlar tarixi ni olish
      .sort({ createdAt: -1 });

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "O'qituvchilarni olishda xatolik", error });
  }
};

// GET: Bitta o‘qituvchini olish va unga tegishli maoshlar tarixi bilan
export const getTeacherById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const teacher = await Teacher.findOne({ _id: id, userId })
      .populate({
        path: "salaries",
        options: { sort: { month: -1 } }, // Oy bo‘yicha kamayish tartibida
      });

    if (!teacher) {
      return res.status(404).json({ message: "O‘qituvchi topilmadi yoki sizga tegishli emas" });
    }

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: "O‘qituvchini olishda xatolik", error });
  }
};

// POST: Yangi o'qituvchi qo'shish
export const createTeacher = async (req, res) => {
  try {
    const { name, lastname, science, userId } = req.body;
    if (!name || !lastname || !science || !userId) {
      return res
        .status(400)
        .json({ message: "Barcha maydonlar to‘ldirilishi shart" });
    }

    const newTeacher = new Teacher({ name, lastname, science, userId });
    await newTeacher.save();

    res.status(201).json(newTeacher);
  } catch (error) {
    res.status(500).json({ message: "O'qituvchini yaratishda xatolik", error });
  }
};

// PUT: O'qituvchini yangilash
export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lastname, science, userId } = req.body;

    const teacher = await Teacher.findOne({ _id: id, userId });
    if (!teacher) {
      return res.status(404).json({ message: "O‘qituvchi topilmadi" });
    }

    if (name) teacher.name = name;
    if (lastname) teacher.lastname = lastname;
    if (science) teacher.science = science;

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
