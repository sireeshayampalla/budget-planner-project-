import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export const connectDB = async (): Promise<void> => {
  try {
    logger.info(`Attempting to connect to MongoDB at ${env.MONGO_URI}...`);
    
    // Configure Mongoose options
    mongoose.set('strictQuery', true);

    // Register mongoose connection events for lifecycle logs
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error occurred:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Attempting auto-reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully.');
    });

    // Connect to MongoDB
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout before throwing error
    });

    logger.success('Database connected successfully.');
  } catch (error: any) {
    logger.error('Database connection failed:', error);
    // Rethrow to let server.ts know the connection failed
    throw error;
  }
};
