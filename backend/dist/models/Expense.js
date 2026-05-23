import { Schema, model } from 'mongoose';
import { EXPENSE_CATEGORIES } from '../config/constants.js';
const ExpenseSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: EXPENSE_CATEGORIES,
            message: '{VALUE} is not a supported expense category'
        }
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot be more than 200 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    }
}, {
    timestamps: true
});
export const Expense = model('Expense', ExpenseSchema);
