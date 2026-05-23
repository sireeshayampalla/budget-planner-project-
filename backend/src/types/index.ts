import { Request } from 'express';
import { Schema } from 'mongoose';
import { ExpenseCategory } from '../config/constants.js';

export interface IUser {
  _id: string | Schema.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  currency?: string;
  theme?: string;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpense {
  _id: string | Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId | string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IIncome {
  _id: string | Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId | string;
  amount: number;
  source: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInsight {
  _id: string | Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId | string;
  month: number; // 1-12
  year: number;
  spendingScore: number; // 0-100
  highestSpendingCategory: string;
  totalIncome: number;
  totalExpenses: number;
  insightsList: string[];
  savingsSuggestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBudget {
  _id: string | Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId | string;
  category: ExpenseCategory;
  limit: number;
  month: number; // 1-12
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

