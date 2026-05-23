import { Schema, model } from 'mongoose';
import type { IInsight } from '../types/index.js';

const InsightSchema = new Schema<IInsight>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  spendingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  highestSpendingCategory: {
    type: String,
    default: 'None'
  },
  totalIncome: {
    type: Number,
    required: true,
    default: 0
  },
  totalExpenses: {
    type: Number,
    required: true,
    default: 0
  },
  insightsList: [{
    type: String
  }],
  savingsSuggestions: [{
    type: String
  }]
}, {
  timestamps: true
});

// Ensure a single user only has one insight record per month/year combination
InsightSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export const Insight = model<IInsight>('Insight', InsightSchema);
export { IInsight };
