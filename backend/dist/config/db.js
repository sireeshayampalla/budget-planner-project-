import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';
let mongod = null;
export const connectDB = async () => {
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
            logger.success('MongoDB reconnected successfully.');
        });
        // Connect to MongoDB
        try {
            await mongoose.connect(env.MONGO_URI, {
                serverSelectionTimeoutMS: 3000 // 3 seconds timeout before throwing error
            });
            logger.success('Database connected successfully.');
        }
        catch (connectionError) {
            logger.warn(`Cloud database connection failed: ${connectionError.message || connectionError}`);
            logger.info('Attempting fallback to local in-memory MongoDB (mongodb-memory-server)...');
            const { MongoMemoryServer } = await import('mongodb-memory-server');
            mongod = await MongoMemoryServer.create();
            const inMemoryUri = mongod.getUri();
            logger.info(`Connecting to in-memory MongoDB at ${inMemoryUri}...`);
            await mongoose.connect(inMemoryUri);
            logger.success('In-memory Database connected successfully.');
        }
    }
    catch (error) {
        logger.error('Database connection failed:', error);
        // Rethrow to let server.ts know the connection failed
        throw error;
    }
};
// Export a cleanup function for graceful shutdowns
export const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        if (mongod) {
            await mongod.stop();
            logger.info('In-memory MongoDB server stopped.');
        }
    }
    catch (err) {
        logger.error('Error during database disconnection:', err);
    }
};
