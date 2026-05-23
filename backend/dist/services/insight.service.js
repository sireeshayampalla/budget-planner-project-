import { Expense } from '../models/Expense.js';
import { Income } from '../models/Income.js';
import { Insight } from '../models/Insight.js';
import { Budget } from '../models/Budget.js';
import { getMonthDateRange, formatAmount } from '../utils/helpers.js';
import mongoose from 'mongoose';
export class InsightService {
    /**
     * Generates or updates spending insights for a user for a specific month and year.
     */
    static async generateMonthlyInsight(userId, month, year) {
        const { start, end } = getMonthDateRange(month, year);
        const userIdObj = new mongoose.Types.ObjectId(userId);
        // 1. Calculate Total Income
        const incomeAgg = await Income.aggregate([
            {
                $match: {
                    userId: userIdObj,
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const totalIncome = incomeAgg.length > 0 ? formatAmount(incomeAgg[0].total) : 0;
        // 2. Calculate Total Expenses & Group by Category
        const expenseAgg = await Expense.aggregate([
            {
                $match: {
                    userId: userIdObj,
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' }
                }
            }
        ]);
        let totalExpenses = 0;
        const categoryTotals = {};
        expenseAgg.forEach((item) => {
            const amount = formatAmount(item.total);
            totalExpenses += amount;
            categoryTotals[item._id] = amount;
        });
        totalExpenses = formatAmount(totalExpenses);
        // 3. Find Highest Spending Category
        let highestSpendingCategory = 'None';
        let highestSpendingAmount = 0;
        Object.entries(categoryTotals).forEach(([category, amount]) => {
            if (amount > highestSpendingAmount) {
                highestSpendingAmount = amount;
                highestSpendingCategory = category;
            }
        });
        // 4. Calculate Spending Score (0 - 100)
        let spendingScore = 100;
        const insightsList = [];
        const savingsSuggestions = [];
        if (totalIncome > 0) {
            const savingsRate = (totalIncome - totalExpenses) / totalIncome;
            const savingsPercent = formatAmount(savingsRate * 100);
            if (savingsPercent < 0) {
                spendingScore -= 45;
                insightsList.push(`Alert: You overspent by ₹${formatAmount(totalExpenses - totalIncome)} more than your income this month!`);
            }
            else if (savingsPercent < 10) {
                spendingScore -= 20;
                insightsList.push(`You saved ${savingsPercent}% of your income. That's a start, but aim for at least 15-20%.`);
            }
            else if (savingsPercent >= 20) {
                insightsList.push(`Great job! You saved ${savingsPercent}% of your income, hitting the ideal 20% savings rule.`);
            }
            else {
                spendingScore -= 10;
                insightsList.push(`You saved ${savingsPercent}% of your income. Solid effort, try tightening up discretionary categories.`);
            }
        }
        else {
            if (totalExpenses > 0) {
                spendingScore = 30; // low score if spending without registered income
                insightsList.push('Alert: Expenses registered this month, but no income has been added yet.');
            }
            else {
                spendingScore = 100; // default for inactive users
                insightsList.push('No income or expenses recorded for this period yet.');
            }
        }
        // 4.5 Evaluate Category Budgets and apply deductions
        const budgets = await Budget.find({ userId, month, year }).lean();
        let totalBudgetLimit = 0;
        budgets.forEach((b) => {
            totalBudgetLimit += b.limit;
            const actual = categoryTotals[b.category] || 0;
            if (actual > b.limit) {
                spendingScore -= 10;
                insightsList.push(`Alert: You exceeded your ${b.category} budget of ₹${formatAmount(b.limit)} by spending ₹${formatAmount(actual)}!`);
                // Add corresponding category savings recommendations if they aren't already included
                if (b.category === 'Shopping' && !savingsSuggestions.includes('Try implementing a "30-day rule" before making non-essential purchases to limit impulse shopping.')) {
                    savingsSuggestions.push('Try implementing a "30-day rule" before making non-essential purchases to limit impulse shopping.');
                }
                else if (b.category === 'Food' && !savingsSuggestions.includes('Meal prep and planning weekly groceries can significantly drop dining-out and takeout costs.')) {
                    savingsSuggestions.push('Meal prep and planning weekly groceries can significantly drop dining-out and takeout costs.');
                }
                else if (b.category === 'Entertainment' && !savingsSuggestions.includes('Review subscription services (Netflix, Spotify, gym) and cancel any you haven\'t used in the past month.')) {
                    savingsSuggestions.push('Review subscription services (Netflix, Spotify, gym) and cancel any you haven\'t used in the past month.');
                }
                else if (b.category === 'Travel' && !savingsSuggestions.includes('Consider carpooling, public transportation, or planning travel in off-peak seasons to reduce travel costs.')) {
                    savingsSuggestions.push('Consider carpooling, public transportation, or planning travel in off-peak seasons to reduce travel costs.');
                }
                else if (b.category === 'Bills' && !savingsSuggestions.includes('Audit utilities and recurring costs. Contact service providers to negotiate better rates or switch to cheaper plans.')) {
                    savingsSuggestions.push('Audit utilities and recurring costs. Contact service providers to negotiate better rates or switch to cheaper plans.');
                }
                else if (b.category === 'Health' && !savingsSuggestions.includes('Check if you can make use of generic prescriptions or insurance rebates to save on health.')) {
                    savingsSuggestions.push('Check if you can make use of generic prescriptions or insurance rebates to save on health.');
                }
            }
        });
        if (totalBudgetLimit > 0 && totalExpenses > totalBudgetLimit) {
            spendingScore -= 15;
            insightsList.push(`Alert: Your total monthly spend (₹${formatAmount(totalExpenses)}) exceeded your total budget allowance (₹${formatAmount(totalBudgetLimit)}) by ₹${formatAmount(totalExpenses - totalBudgetLimit)}!`);
        }
        // 5. Category Concentration penalty & specific insights
        if (totalExpenses > 0 && highestSpendingCategory !== 'None') {
            const highestPct = (highestSpendingAmount / totalExpenses) * 100;
            insightsList.push(`Your highest spending category is ${highestSpendingCategory}, making up ${formatAmount(highestPct)}% of your expenses.`);
            if (highestPct > 50) {
                spendingScore -= 15;
                insightsList.push(`Caution: Over 50% of your expenses went to ${highestSpendingCategory}. Consider diversifying your budget.`);
            }
            // Add savings suggestions based on categories
            if (highestSpendingCategory === 'Shopping') {
                savingsSuggestions.push('Try implementing a "30-day rule" before making non-essential purchases to limit impulse shopping.');
            }
            else if (highestSpendingCategory === 'Food') {
                savingsSuggestions.push('Meal prep and planning weekly groceries can significantly drop dining-out and takeout costs.');
            }
            else if (highestSpendingCategory === 'Entertainment') {
                savingsSuggestions.push('Review subscription services (Netflix, Spotify, gym) and cancel any you haven\'t used in the past month.');
            }
            else if (highestSpendingCategory === 'Travel') {
                savingsSuggestions.push('Consider carpooling, public transportation, or planning travel in off-peak seasons to reduce travel costs.');
            }
            else if (highestSpendingCategory === 'Bills') {
                savingsSuggestions.push('Audit utilities and recurring costs. Contact service providers to negotiate better rates or switch to cheaper plans.');
            }
            else if (highestSpendingCategory === 'Health') {
                savingsSuggestions.push('Check if you can make use of generic prescriptions or insurance rebates to save on health.');
            }
        }
        // Standard savings tips
        if (savingsSuggestions.length < 3) {
            savingsSuggestions.push('Adopt the 50/30/20 rule: 50% on Needs, 30% on Wants, and 20% on Savings.');
            savingsSuggestions.push('Set up an automatic transfer to your savings account on payday to "pay yourself first".');
        }
        // Clamp score
        spendingScore = Math.max(0, Math.min(100, spendingScore));
        // 6. Save or Update in database
        const insight = await Insight.findOneAndUpdate({ userId, month, year }, {
            spendingScore,
            highestSpendingCategory,
            totalIncome,
            totalExpenses,
            insightsList,
            savingsSuggestions
        }, { new: true, upsert: true });
        return insight;
    }
    /**
     * Helper to retrieve insights. Generates them on the fly if they do not exist.
     */
    static async getInsight(userId, month, year) {
        let insight = await Insight.findOne({ userId, month, year });
        if (!insight) {
            insight = await this.generateMonthlyInsight(userId, month, year);
        }
        return insight;
    }
}
