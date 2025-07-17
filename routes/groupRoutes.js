import express from "express";
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../controllers/groupController.js";

const router = express.Router();

router.get("/", getAllGroups); // GET /api/groups?adminId=...
router.get("/:id", getGroupById); // GET /api/groups/:id?adminId=...
router.post("/", createGroup); // POST /api/groups (adminId in body)
router.put("/:id", updateGroup); // PUT /api/groups/:id (adminId in body)
router.delete("/:id", deleteGroup); // DELETE /api/groups/:id?adminId=...

export default router;
