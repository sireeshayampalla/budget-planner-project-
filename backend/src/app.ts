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
import { env } from './config/env.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Dynamically echo the origin if CLIENT_URL is wildcard '*' or not set, supporting credentials: true
    if (env.CLIENT_URL === '*' || !env.CLIENT_URL) {
      callback(null, true);
    } else {
      const allowedOrigins = env.CLIENT_URL.split(',').map(o => o.trim());
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
