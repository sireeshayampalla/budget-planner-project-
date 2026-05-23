import { Schema, model } from 'mongoose';
import { EXPENSE_CATEGORIES } from '../config/constants.js';
const BudgetSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: EXPENSE_CATEGORIES,
            message: '{VALUE} is not a supported expense category'
        }
    },
    limit: {
        type: Number,
        required: [true, 'Budget limit is required'],
        min: [0.01, 'Budget limit must be greater than 0']
    },
    month: {
        type: Number,
        required: [true, 'Month is required'],
        min: [1, 'Month must be between 1 and 12'],
        max: [12, 'Month must be between 1 and 12']
    },
    year: {
        type: Number,
        required: [true, 'Year is required']
    }
}, {
    timestamps: true
});
// Compound index to guarantee a user has exactly one budget limit per category per month/year
BudgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });
export const Budget = model('Budget', BudgetSchema);
