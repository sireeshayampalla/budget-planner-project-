import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);
// Load environment variables from backend/.env relative to this config file
dotenv.config({ path: path.resolve(currentDir, '../../.env') });
export const env = {
    PORT: parseInt(process.env.PORT || '5000', 10),
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_123_change_me',
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLIENT_URL: process.env.CLIENT_URL || '*'
};
// Validate critical environment configurations
if (!process.env.JWT_SECRET) {
    console.warn('[WARN] JWT_SECRET is not set in environment. Using default fallback key for development.');
}
if (!process.env.MONGO_URI) {
    console.warn('[WARN] MONGO_URI is not set in environment. Using default local MongoDB connection.');
}
