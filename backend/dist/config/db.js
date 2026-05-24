import mongoose from 'mongoose';
import dns from 'dns';
import { resolveSrv } from 'dns/promises';
import { env } from './env.js';
import { logger } from './logger.js';
// Setup custom DNS resolvers (Google and Cloudflare) to bypass local SRV lookup limitations
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    logger.info('Configured Google and Cloudflare DNS servers for SRV resolution.');
}
catch (dnsErr) {
    logger.warn('Failed to set custom DNS servers, using system default:', dnsErr.message);
}
export const connectDB = async () => {
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        attempt++;
        try {
            logger.info(`Database connection attempt ${attempt} of ${maxRetries}...`);
            mongoose.set('strictQuery', true);
            // Register connection lifecycle listeners
            mongoose.connection.removeAllListeners();
            mongoose.connection.on('error', (err) => {
                logger.error('MongoDB connection error occurred:', err);
            });
            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB connection lost. Connection lifecycle status: DISCONNECTED.');
            });
            mongoose.connection.on('reconnected', () => {
                logger.success('MongoDB reconnected successfully.');
            });
            // Try connection using standard environment URI
            logger.info(`Connecting using URI: ${env.MONGO_URI.replace(/:([^@]+)@/, ':****@')}`);
            await mongoose.connect(env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000 // 5 seconds timeout before failing
            });
            logger.success('Connected to MongoDB Atlas successfully.');
            return;
        }
        catch (err) {
            logger.warn(`Connection attempt ${attempt} failed: ${err.message}`);
            // If SRV query fails, attempt to format standard connection string
            if (err.message.includes('querySrv') && env.MONGO_URI.startsWith('mongodb+srv://')) {
                logger.info('SRV lookup failed. Attempting to convert SRV string to standard format...');
                try {
                    const match = env.MONGO_URI.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)\/?([^?]*)/);
                    if (match) {
                        const username = match[1];
                        const password = match[2];
                        const host = match[3];
                        const database = match[4] || 'budgetplanner';
                        logger.info(`Resolving SRV records for _mongodb._tcp.${host}...`);
                        const srvRecords = await resolveSrv(`_mongodb._tcp.${host}`);
                        const hostPorts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
                        const standardUri = `mongodb://${username}:${password}@${hostPorts}/${database}?ssl=true&authSource=admin&retryWrite=true&w=majority`;
                        logger.info('Connecting using resolved standard host list...');
                        await mongoose.connect(standardUri, {
                            serverSelectionTimeoutMS: 5000
                        });
                        logger.success('Connected to MongoDB Atlas successfully via standard format.');
                        return;
                    }
                }
                catch (srvFallbackErr) {
                    logger.error('Fallback standard connection conversion failed:', srvFallbackErr.message);
                }
            }
            if (attempt >= maxRetries) {
                logger.error('All connection attempts failed. Database connection failed.');
                throw err;
            }
            // Wait 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};
// Export a cleanup function for graceful shutdowns
export const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
    }
    catch (err) {
        logger.error('Error during database disconnection:', err);
    }
};
