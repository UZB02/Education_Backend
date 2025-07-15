import express from "express";
import {
  getColumns,
  addColumn,
  deleteColumn,
} from "../controllers/columnController.js";

const router = express.Router();

router.get("/:adminId", getColumns);
router.post("/", addColumn);
router.delete("/:id", deleteColumn);

export default router;
