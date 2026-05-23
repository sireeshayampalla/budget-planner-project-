import { Schema, model } from 'mongoose';
const IncomeSchema = new Schema({
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
    source: {
        type: String,
        required: [true, 'Source is required'],
        trim: true,
        maxlength: [100, 'Source name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    }
}, {
    timestamps: true
});
export const Income = model('Income', IncomeSchema);
