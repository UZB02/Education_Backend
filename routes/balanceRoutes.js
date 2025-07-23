import express from "express";
import {
  getRealBalance,
  increaseBalance,
  syncBalanceToReal
} from "../controllers/balanceController.js";

const router = express.Router();

router.get("/real", getRealBalance);
router.post("/increase", increaseBalance);
router.post("/sync", syncBalanceToReal);

export default router;
