import { Response, NextFunction } from 'express';
import { Budget } from '../models/Budget.js';
import { Expense } from '../models/Expense.js';
import { InsightService } from '../services/insight.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';
import mongoose from 'mongoose';
import { formatAmount } from '../utils/helpers.js';

export class BudgetController {
  /**
   * Get all budgets for the current user for a specific month and year.
   */
  public static async getBudgets(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const now = new Date();
      const month = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);
      const year = parseInt(req.query.year as string, 10) || now.getFullYear();

      const budgets = await Budget.find({ userId, month, year }).sort({ category: 1 });

      sendSuccess(res, 'Budgets retrieved successfully', {
        budgets,
        month,
        year
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update a budget limit
   */
  public static async createBudget(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { category, limit, month, year } = req.body;
      const now = new Date();
      const parsedMonth = parseInt(month, 10) || (now.getMonth() + 1);
      const parsedYear = parseInt(year, 10) || now.getFullYear();

      // We use findOneAndUpdate with upsert: true so that setting a budget limit
      // for a category in a month overrides/updates or creates it cleanly
      const budget = await Budget.findOneAndUpdate(
        { userId, category, month: parsedMonth, year: parsedYear },
        { limit },
        { new: true, upsert: true, runValidators: true }
      );

      // Reactively regenerate insights
      if (userId) {
        await InsightService.generateMonthlyInsight(userId, parsedMonth, parsedYear);
      }

      sendSuccess(res, 'Budget limit set successfully', budget, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a budget by ID
   */
  public static async updateBudget(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { limit } = req.body;

      const budget = await Budget.findOne({ _id: id, userId });
      if (!budget) {
        sendError(res, 'Budget not found or unauthorized', 404);
        return;
      }

      budget.limit = limit;
      await budget.save();

      // Reactively regenerate insights
      if (userId) {
        await InsightService.generateMonthlyInsight(userId, budget.month, budget.year);
      }

      sendSuccess(res, 'Budget updated successfully', budget);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a budget
   */
  public static async deleteBudget(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const budget = await Budget.findOne({ _id: id, userId });
      if (!budget) {
        sendError(res, 'Budget not found or unauthorized', 404);
        return;
      }

      const { month, year } = budget;
      await budget.deleteOne();

      // Reactively regenerate insights
      if (userId) {
        await InsightService.generateMonthlyInsight(userId, month, year);
      }

      sendSuccess(res, 'Budget deleted successfully', { id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Category Budget vs Expense breakdown for charts
   */
  public static async getBudgetVSExpense(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const now = new Date();
      const month = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);
      const year = parseInt(req.query.year as string, 10) || now.getFullYear();

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      const userIdObj = new mongoose.Types.ObjectId(userId);

      // Fetch budgets
      const budgets = await Budget.find({ userId, month, year }).lean();

      // Aggregate expenses by category for this month
      const expensesAgg = await Expense.aggregate([
        {
          $match: {
            userId: userIdObj,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' }
          }
        }
      ]);

      const expensesMap = new Map<string, number>();
      expensesAgg.forEach((item) => {
        expensesMap.set(item._id, formatAmount(item.total));
      });

      // Construct a combined list for charting
      const breakdown = budgets.map((b) => {
        const actual = expensesMap.get(b.category) || 0;
        return {
          id: b._id,
          category: b.category,
          budgetLimit: b.limit,
          actualSpent: actual,
          remaining: formatAmount(Math.max(0, b.limit - actual)),
          overrun: formatAmount(Math.max(0, actual - b.limit)),
          percentageSpent: b.limit > 0 ? formatAmount((actual / b.limit) * 100) : 0
        };
      });

      sendSuccess(res, 'Budget vs Expense analysis retrieved successfully', {
        breakdown,
        month,
        year
      });
    } catch (error) {
      next(error);
    }
  }
}
