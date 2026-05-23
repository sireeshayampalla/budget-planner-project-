import { Response, NextFunction } from 'express';
import { Expense } from '../models/Expense.js';
import { InsightService } from '../services/insight.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';

export class ExpenseController {
  /**
   * Get all expenses for current user
   */
  public static async getExpenses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { category, startDate, endDate, limit, page, search } = req.query;

      const query: any = { userId };

      if (category) {
        query.category = category;
      }

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      if (search) {
        query.description = { $regex: search as string, $options: 'i' };
      }

      const limitNum = parseInt(limit as string, 10) || 50;
      const pageNum = parseInt(page as string, 10) || 1;
      const skip = (pageNum - 1) * limitNum;

      const expenses = await Expense.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Expense.countDocuments(query);

      sendSuccess(res, 'Expenses retrieved successfully', {
        expenses,
        pagination: {
          total,
          limit: limitNum,
          page: pageNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a new expense
   */
  public static async createExpense(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { amount, category, description, date } = req.body;

      const parsedDate = date ? new Date(date) : new Date();

      const expense = new Expense({
        userId,
        amount,
        category,
        description,
        date: parsedDate
      });

      await expense.save();

      // Reactively trigger updates to user insights for this month/year
      const month = parsedDate.getMonth() + 1;
      const year = parsedDate.getFullYear();
      if (userId) {
        await InsightService.generateMonthlyInsight(userId, month, year);
      }

      sendSuccess(res, 'Expense added successfully', expense, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing expense
   */
  public static async updateExpense(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { amount, category, description, date } = req.body;

      const expense = await Expense.findOne({ _id: id, userId });
      if (!expense) {
        sendError(res, 'Expense not found or unauthorized', 404);
        return;
      }

      const originalDate = new Date(expense.date);

      if (amount !== undefined) expense.amount = amount;
      if (category !== undefined) expense.category = category;
      if (description !== undefined) expense.description = description;
      if (date !== undefined) expense.date = new Date(date);

      await expense.save();

      // Trigger insight generation for the original and new month/year (in case the date was changed)
      const month1 = originalDate.getMonth() + 1;
      const year1 = originalDate.getFullYear();
      const month2 = expense.date.getMonth() + 1;
      const year2 = expense.date.getFullYear();

      if (userId) {
        await InsightService.generateMonthlyInsight(userId, month1, year1);
        if (month1 !== month2 || year1 !== year2) {
          await InsightService.generateMonthlyInsight(userId, month2, year2);
        }
      }

      sendSuccess(res, 'Expense updated successfully', expense);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an expense
   */
  public static async deleteExpense(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const expense = await Expense.findOne({ _id: id, userId });
      if (!expense) {
        sendError(res, 'Expense not found or unauthorized', 404);
        return;
      }

      await expense.deleteOne();

      // Update insights
      const expenseDate = new Date(expense.date);
      const month = expenseDate.getMonth() + 1;
      const year = expenseDate.getFullYear();

      if (userId) {
        await InsightService.generateMonthlyInsight(userId, month, year);
      }

      sendSuccess(res, 'Expense deleted successfully', { id });
    } catch (error) {
      next(error);
    }
  }
}
