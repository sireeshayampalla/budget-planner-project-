import { Response, NextFunction } from 'express';
import { InsightService } from '../services/insight.service.js';
import { Expense } from '../models/Expense.js';
import { Income } from '../models/Income.js';
import { Budget } from '../models/Budget.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';

import mongoose from 'mongoose';
import { formatAmount } from '../utils/helpers.js';

export class InsightController {
  /**
   * Fetch insights for a specific month and year
   */
  public static async getInsights(
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

      const insight = await InsightService.getInsight(userId, month, year);

      sendSuccess(res, 'Insights retrieved successfully', insight);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch aggregate data for the main dashboard dashboard
   */
  public static async getDashboardStats(
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

      const userIdObj = new mongoose.Types.ObjectId(userId);

      // Current month details
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

      // 1. Calculate totals for current month
      const currentMonthIncome = await Income.aggregate([
        { $match: { userId: userIdObj, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const currentMonthExpense = await Expense.aggregate([
        { $match: { userId: userIdObj, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const totalIncomeMonth = currentMonthIncome.length > 0 ? formatAmount(currentMonthIncome[0].total) : 0;
      const totalExpensesMonth = currentMonthExpense.length > 0 ? formatAmount(currentMonthExpense[0].total) : 0;
      const balanceMonth = formatAmount(totalIncomeMonth - totalExpensesMonth);

      // 1.5 Calculate total budget for current month
      const currentMonthBudget = await Budget.aggregate([
        { $match: { userId: userIdObj, month: currentMonth, year: currentYear } },
        { $group: { _id: null, total: { $sum: '$limit' } } }
      ]);
      const totalBudgetMonth = currentMonthBudget.length > 0 ? formatAmount(currentMonthBudget[0].total) : 0;
      const remainingBudgetMonth = formatAmount(totalBudgetMonth - totalExpensesMonth);


      // 2. All-time totals
      const allTimeIncome = await Income.aggregate([
        { $match: { userId: userIdObj } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const allTimeExpense = await Expense.aggregate([
        { $match: { userId: userIdObj } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const totalIncomeAllTime = allTimeIncome.length > 0 ? formatAmount(allTimeIncome[0].total) : 0;
      const totalExpensesAllTime = allTimeExpense.length > 0 ? formatAmount(allTimeExpense[0].total) : 0;
      const balanceAllTime = formatAmount(totalIncomeAllTime - totalExpensesAllTime);

      // 3. Category distribution (current month)
      const categoryDistribution = await Expense.aggregate([
        { $match: { userId: userIdObj, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: '$category', value: { $sum: '$amount' } } },
        { $project: { category: '$_id', value: { $round: ['$value', 2] }, _id: 0 } },
        { $sort: { value: -1 } }
      ]);

      // 4. Past 6 Months monthly trends (income vs expense)
      const monthlyTrends: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();

        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0, 23, 59, 59, 999);

        const incVal = await Income.aggregate([
          { $match: { userId: userIdObj, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const expVal = await Expense.aggregate([
          { $match: { userId: userIdObj, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const monthName = d.toLocaleString('default', { month: 'short' });

        monthlyTrends.push({
          month: `${monthName} ${y}`,
          income: incVal.length > 0 ? formatAmount(incVal[0].total) : 0,
          expenses: expVal.length > 0 ? formatAmount(expVal[0].total) : 0
        });
      }

      // 5. Latest 5 transactions (mixed)
      const latestExpenses = await Expense.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(5).lean();
      const latestIncomes = await Income.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(5).lean();

      const combinedTransactions = [
        ...latestExpenses.map((e) => ({
          _id: e._id,
          type: 'expense',
          amount: e.amount,
          categoryOrSource: e.category,
          description: e.description || '',
          date: e.date
        })),
        ...latestIncomes.map((i) => ({
          _id: i._id,
          type: 'income',
          amount: i.amount,
          categoryOrSource: i.source,
          description: i.description || '',
          date: i.date
        }))
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      sendSuccess(res, 'Dashboard statistics retrieved successfully', {
        monthly: {
          income: totalIncomeMonth,
          expenses: totalExpensesMonth,
          balance: balanceMonth,
          budget: totalBudgetMonth,
          remainingBudget: remainingBudgetMonth,
          month: currentMonth,
          year: currentYear
        },
        allTime: {
          income: totalIncomeAllTime,
          expenses: totalExpensesAllTime,
          balance: balanceAllTime
        },
        categoryDistribution,
        monthlyTrends,
        recentTransactions: combinedTransactions
      });
    } catch (error) {
      next(error);
    }
  }
}
