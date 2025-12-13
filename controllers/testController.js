import Test from "../models/TestModel.js";
import { nanoid } from "nanoid"; // unikal token yaratish uchun

// Barcha testlar (faqat o'qituvchi o'z testlari)
export const getAllTests = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const tests = await Test.find({ teacherId })
      .populate("subjectId", "name code")
      .sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bitta test
export const getTestById = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const test = await Test.findOne({ _id: req.params.id, teacherId }).populate(
      "subjectId",
      "name code"
    );
    if (!test)
      return res
        .status(404)
        .json({ message: "Test topilmadi yoki sizga tegishli emas" });
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Yangi test yaratish
export const createTest = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { title, subjectId, description, questions } = req.body;

    const newTest = new Test({
      title,
      subjectId,
      description,
      questions,
      teacherId,
    });
    const savedTest = await newTest.save();
    res.status(201).json(savedTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Testni yangilash
export const updateTest = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const test = await Test.findOne({ _id: req.params.id, teacherId });
    if (!test)
      return res
        .status(404)
        .json({ message: "Test topilmadi yoki sizga tegishli emas" });

    const { title, subjectId, description, questions } = req.body;
    test.title = title || test.title;
    test.subjectId = subjectId || test.subjectId;
    test.description = description || test.description;
    test.questions = questions || test.questions;

    const updatedTest = await test.save();
    res.json(updatedTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Testni o‘chirish
export const deleteTest = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const test = await Test.findOneAndDelete({ _id: req.params.id, teacherId });

    if (!test) {
      return res
        .status(404)
        .json({ message: "Test topilmadi yoki sizga tegishli emas" });
    }

    res.json({ message: "Test o‘chirildi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Testga yangi savol qo'shish
export const addQuestionToTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { question, options, correctAnswer, points } = req.body;

    // Testni topish
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test topilmadi" });

    // Yangi savolni qo'shish
    test.questions.push({
      question,
      options,
      correctAnswer,
      points: points || 1,
    });

    await test.save();
    res.status(200).json({ message: "Savol qo'shildi", test });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server xatoligi" });
  }
};

// Bitta savolni yangilash
export const updateQuestionInTest = async (req, res) => {
  const { testId, questionId } = req.params;
  const { question, options, correctAnswer, points } = req.body;

  try {
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test topilmadi" });

    const qIndex = test.questions.findIndex(q => q._id.toString() === questionId);
    if (qIndex === -1) return res.status(404).json({ message: "Savol topilmadi" });

    // Savolni yangilash
    test.questions[qIndex].question = question;
    test.questions[qIndex].options = options;
    test.questions[qIndex].correctAnswer = correctAnswer;
    test.questions[qIndex].points = points;

    await test.save();
    res.json({ message: "Savol yangilandi", question: test.questions[qIndex] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 1. Testga unikal havola yaratish
export const generateTestLink = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const test = await Test.findOne({ _id: req.params.id, teacherId });
    if (!test)
      return res
        .status(404)
        .json({ message: "Test topilmadi yoki sizga tegishli emas" });

    // Unikal token yaratish
    const linkToken = nanoid(10);
    test.linkToken = linkToken;
    await test.save();

    // FULL URL
    const link = `${process.env.FRONTEND_URL}/test/${linkToken}`;

    res.json({ message: "Test havolasi yaratildi", link });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 2. O‘quvchi testga kirish
export const getTestByLink = async (req, res) => {
  try {
    const { token } = req.params;
    const test = await Test.findOne({ linkToken: token }).populate(
      "subjectId",
      "name code"
    );
    if (!test) return res.status(404).json({ message: "Test topilmadi" });

    // Savollarni javobsiz yuborish
    const testWithoutAnswers = {
      ...test.toObject(),
      questions: test.questions.map((q) => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        points: q.points,
      })),
    };

    res.json(testWithoutAnswers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. O‘quvchi javob yuborish
export const submitTestAnswers = async (req, res) => {
  try {
    const { token } = req.params;
    const { studentName, studentSurname, answers } = req.body; // answers = [{ questionId, selectedOption }]

    const test = await Test.findOne({ linkToken: token });
    if (!test) return res.status(404).json({ message: "Test topilmadi" });

    // Natijani hisoblash
    let score = 0;
    answers.forEach((ans) => {
      const question = test.questions.id(ans.questionId);
      if (question && question.correctAnswer === ans.selectedOption) {
        score += question.points;
      }
    });

    // Natijani saqlash
    test.results.push({
      studentName,
      studentSurname,
      answers,
      score,
      submittedAt: new Date(),
    });

    await test.save();
    res.json({ message: "Javoblar saqlandi", score });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. O‘quvchilar natijalarini olish (ism, familiya, ball)
export const getTestResults = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const test = await Test.findOne({ _id: req.params.id, teacherId });
    if (!test)
      return res
        .status(404)
        .json({ message: "Test topilmadi yoki sizga tegishli emas" });

    const results = test.results.map((r) => ({
      studentName: r.studentName,
      studentSurname: r.studentSurname,
      score: r.score,
      submittedAt: r.submittedAt,
      answers: r.answers.map((a, index) => ({
        selectedOption: a.selectedOption,
        questionText: test.questions[index]?.question || "Savol topilmadi",
        correctAnswer: test.questions[index]?.correctAnswer || "",
      })),
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


