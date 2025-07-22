import express from "express";
import {
  getColumns,
  addColumn,
  deleteColumn,
  updateColumn
} from "../controllers/columnController.js";

const router = express.Router();

router.get("/:adminId", getColumns);
router.post("/", addColumn);
router.delete("/:id", deleteColumn);
router.put("/:id", updateColumn);

export default router;
