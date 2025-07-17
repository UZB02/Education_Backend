import Application from "../models/Application.js";

export const getByAdmin = async (req, res) => {
  try {
    const applications = await Application.find({ admin: req.params.adminId });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addApplication = async (req, res) => {
  try {
    const app = await Application.create(req.body);
    res.status(201).json(app);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.body;
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { columnId },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Ariza topilmadi" });
    }

    // Eski statusni eslab qolamiz
    const oldStatus = application.status;

    // Agar status "active" ga o'zgarayotgan bo‘lsa
    if (status === "active" && oldStatus !== "active") {
      application.columnId = null; // ustun bilan bog‘liqlikni uzamiz
    }

    // Statusni yangilaymiz
    application.status = status;
    await application.save();

    res.status(200).json({ message: "Status yangilandi", application });
  } catch (error) {
    console.error("Status yangilash xatosi:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
};