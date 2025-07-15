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
  await Column.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};
