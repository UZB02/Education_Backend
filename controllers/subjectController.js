import Subject from "../models/SubjectModel.js";

// Barcha fanlar (faqat o‘qituvchi o‘z fanlari)
export const getAllSubjects = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // fanlar + ularni yaratgan o'qituvchi ma'lumotlari
    const subjects = await Subject.find({ teacherId })
      .populate("teacherId", "name lastname science points monthlySalary") // kerakli fieldlar
      .sort({ name: 1 });

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Yangi fan qo‘shish
export const createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const teacherId = req.user._id; // 🔹 _id dan foydalanamiz

    if (!teacherId) {
      return res.status(400).json({ message: "TeacherId mavjud emas" });
    }

    const existing = await Subject.findOne({ code, teacherId });
    if (existing)
      return res.status(400).json({ message: "Bu kodli fan mavjud" });

    const newSubject = new Subject({ name, code, description, teacherId });
    const savedSubject = await newSubject.save();

    res.status(201).json(savedSubject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Bitta fan
export const getSubjectById = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const subject = await Subject.findOne({ _id: req.params.id, teacherId });
    if (!subject)
      return res
        .status(404)
        .json({ message: "Fan topilmadi yoki sizga tegishli emas" });

    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fanni yangilash
export const updateSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const teacherId = req.user._id;

    const subject = await Subject.findOne({ _id: req.params.id, teacherId });
    if (!subject)
      return res
        .status(404)
        .json({ message: "Fan topilmadi yoki sizga tegishli emas" });

    subject.name = name || subject.name;
    subject.code = code || subject.code;
    subject.description = description || subject.description;

    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fanni o‘chirish
export const deleteSubject = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const subject = await Subject.findOne({ _id: req.params.id, teacherId });
    if (!subject) {
      return res
        .status(404)
        .json({ message: "Fan topilmadi yoki sizga tegishli emas" });
    }

    // ✅ deleteOne ishlatish
    await Subject.deleteOne({ _id: req.params.id });
    res.json({ message: "Fan o‘chirildi" });
  } catch (error) {
    console.error(error); // server console da xatoni ko‘rsatish
    res.status(500).json({ message: "Server xatosi: " + error.message });
  }
};

