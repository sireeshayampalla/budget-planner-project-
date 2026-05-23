import { Response, NextFunction } from 'express';
import { Income } from '../models/Income.js';
import { InsightService } from '../services/insight.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';

export class IncomeController {
  /**
   * Get all income entries for current user
   */
  public static async getIncomes(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { startDate, endDate, limit, page, search } = req.query;

      const query: any = { userId };

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      if (search) {
        query.$or = [
          { source: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } }
        ];
      }

      const limitNum = parseInt(limit as string, 10) || 50;
      const pageNum = parseInt(page as string, 10) || 1;
      const skip = (pageNum - 1) * limitNum;

      const incomes = await Income.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Income.countDocuments(query);

      sendSuccess(res, 'Incomes retrieved successfully', {
        incomes,
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
   * Add a new income entry
   */
  public static async createIncome(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { amount, source, description, date } = req.body;

      const parsedDate = date ? new Date(date) : new Date();

      const income = new Income({
        userId,
        amount,
        source,
        description,
        date: parsedDate
      });

      await income.save();

      // Trigger insights update
      const month = parsedDate.getMonth() + 1;
      const year = parsedDate.getFullYear();
      if (userId) {
        await InsightService.generateMonthlyInsight(userId, month, year);
      }

      sendSuccess(res, 'Income added successfully', income, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing income entry
   */
  public static async updateIncome(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { amount, source, description, date } = req.body;

      const income = await Income.findOne({ _id: id, userId });
      if (!income) {
        sendError(res, 'Income entry not found or unauthorized', 404);
        return;
      }

      const originalDate = new Date(income.date);

      if (amount !== undefined) income.amount = amount;
      if (source !== undefined) income.source = source;
      if (description !== undefined) income.description = description;
      if (date !== undefined) income.date = new Date(date);

      await income.save();

      // Trigger insights updates
      const month1 = originalDate.getMonth() + 1;
      const year1 = originalDate.getFullYear();
      const month2 = income.date.getMonth() + 1;
      const year2 = income.date.getFullYear();

      if (userId) {
        await InsightService.generateMonthlyInsight(userId, month1, year1);
        if (month1 !== month2 || year1 !== year2) {
          await InsightService.generateMonthlyInsight(userId, month2, year2);
        }
      }

      sendSuccess(res, 'Income updated successfully', income);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an income entry
   */
  public static async deleteIncome(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const income = await Income.findOne({ _id: id, userId });
      if (!income) {
        sendError(res, 'Income entry not found or unauthorized', 404);
        return;
      }

      await income.deleteOne();

      // Update insights
      const incomeDate = new Date(income.date);
      const month = incomeDate.getMonth() + 1;
      const year = incomeDate.getFullYear();

      if (userId) {
        await InsightService.generateMonthlyInsight(userId, month, year);
      }

      sendSuccess(res, 'Income entry deleted successfully', { id });
    } catch (error) {
      next(error);
    }
  }
}
