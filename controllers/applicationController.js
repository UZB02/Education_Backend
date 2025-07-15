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
