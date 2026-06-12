import { Router } from "express";
import { checkRole } from "../middleware/checkRole";
import AnalyticsService from "../services/AnalyticsService";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, parseISO } from "date-fns";

const router = Router();

// Вспомогательная функция для парсинга дат
function getDateRange(period: string, start?: string, end?: string): { startDate: Date, endDate: Date } {
  const now = new Date();
  
  if (period === 'month') {
    return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
  }
  if (period === 'quarter') {
    return { startDate: startOfQuarter(now), endDate: endOfQuarter(now) };
  }
  if (period === 'year') {
    return { startDate: startOfYear(now), endDate: endOfYear(now) };
  }
  
  // Custom period
  if (start && end) {
    return { startDate: parseISO(start), endDate: parseISO(end) };
  }
  
  // Default to current month
  return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
}

// GET /api/analytics/expenses
router.get("/expenses", checkRole(["DEPUTY", "ADMIN", "DIRECTOR", "ACCOUNTANT"]), async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query as { period?: string, startDate?: string, endDate?: string };
    const range = getDateRange(period || 'month', startDate, endDate);
    
    const stats = await AnalyticsService.getExpensesStatistics(range.startDate, range.endDate);
    return res.json(stats);
  } catch (error: any) {
    console.error("Expenses analytics error:", error);
    return res.status(500).json({ error: "Failed to fetch expenses analytics" });
  }
});

// GET /api/analytics/employee-usage
router.get("/employee-usage", checkRole(["DEPUTY", "ADMIN", "DIRECTOR", "ZAVHOZ", "ACCOUNTANT"]), async (req, res) => {
  try {
    const { period, startDate, endDate, type } = req.query as { period?: string, startDate?: string, endDate?: string, type?: string };
    const range = getDateRange(period || 'month', startDate, endDate);
    
    const stats = await AnalyticsService.getEmployeeUsageStatistics(range.startDate, range.endDate, type);
    return res.json(stats);
  } catch (error: any) {
    console.error("Employee usage analytics error:", error);
    return res.status(500).json({ error: "Failed to fetch employee usage analytics" });
  }
});

export default router;
