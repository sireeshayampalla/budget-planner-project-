import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import incomeRoutes from './routes/income.routes.js';
import insightRoutes from './routes/insight.routes.js';
import budgetRoutes from './routes/budget.routes.js';


import healthRoutes from './routes/health.routes.js';

import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Logging Middleware
app.use(morgan('dev'));

// Parse JSON Bodies
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/incomes', incomeRoutes); // support both plural and singular
app.use('/api/insights', insightRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/health', healthRoutes);


// Base route for backward compatibility
app.get('/', (req, res) => {
  res.json({ message: 'Budget Planner API is running' });
});

// Error handling middleware (must be registered last)
app.use(errorHandler);

export default app;
