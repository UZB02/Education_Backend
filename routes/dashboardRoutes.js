import express from "express";
import {
  getDashboardSummary,
  getApplicationsByMonth,
  getPaymentsByMonth,
  getExpensesByMonth,
  getBalanceByMonth,
  getRecentActivity,
  getStudentsByMonth
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/summary/:adminId", getDashboardSummary);
router.get("/applications-by-month/:adminId", getApplicationsByMonth);
router.get("/payments-by-month/:adminId", getPaymentsByMonth);
router.get("/expenses-by-month/:adminId", getExpensesByMonth);
router.get("/balance-by-month/:adminId", getBalanceByMonth);
router.get("/recent-activity/:adminId", getRecentActivity);
router.get("/students-by-month/:adminId", getStudentsByMonth); 

export default router;
