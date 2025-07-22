import Column from "../models/Column.js";

export const getColumns = async (req, res) => {
  const { adminId } = req.params;
  const columns = await Column.find({ userId: adminId });
  res.json(columns);
};

export const addColumn = async (req, res) => {
  const column = await Column.create(req.body);
  res.json(column);
};

export const deleteColumn = async (req, res) => {
  try {
    const deleted = await Column.findOneAndDelete({ _id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: "Column topilmadi" });
    }
    res.json({ message: "Column va unga bog'liq applicationlar o'chirildi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Yangi qo‘shilgan updateColumn funksiyasi
export const updateColumn = async (req, res) => {
  try {
    const updated = await Column.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Column topilmadi" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
