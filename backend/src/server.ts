import net from 'net';
import mongoose from 'mongoose';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

let activeServer: any = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viteConfigPath = path.resolve(__dirname, '../../frontend/vite.config.ts');

// Helper to kill any process holding a specific port on Windows
const killProcessOnPort = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    // Windows command to find listening PID on specific port
    const cmd = `netstat -ano | findstr LISTENING | findstr :${port}`;
    exec(cmd, (err, stdout) => {
      if (err || !stdout) {
        return resolve(false);
      }
      
      const lines = stdout.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        return resolve(false);
      }

      const pidsToKill = new Set<string>();
      for (const line of lines) {
        const parts = line.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid)) && Number(pid) > 0 && pid !== process.pid.toString()) {
          pidsToKill.add(pid);
        }
      }

      if (pidsToKill.size === 0) {
        return resolve(false);
      }

      const pids = Array.from(pidsToKill);
      let completedCount = 0;
      let killedAny = false;

      pids.forEach((pid) => {
        logger.warn(`Port ${port} occupied by process PID ${pid}. Attempting to clean up...`);
        exec(`taskkill /F /PID ${pid}`, (killErr) => {
          completedCount++;
          if (!killErr) {
            killedAny = true;
            logger.success(`Successfully killed process PID ${pid} occupying port ${port}`);
          } else {
            logger.error(`Failed to kill process PID ${pid} on port ${port}:`, killErr);
          }
          if (completedCount === pids.length) {
            // Give a tiny timeout for Windows OS to free the socket resource
            setTimeout(() => resolve(killedAny), 500);
          }
        });
      });
    });
  });
};

// Helper to dynamically update the Vite proxy configuration target
const updateViteProxyPort = (port: number) => {
  try {
    if (fs.existsSync(viteConfigPath)) {
      let content = fs.readFileSync(viteConfigPath, 'utf8');
      const regex = /target:\s*['"`]http:\/\/localhost:\d+['"`]/g;
      const newTarget = `target: 'http://localhost:${port}'`;
      if (regex.test(content)) {
        content = content.replace(regex, newTarget);
        fs.writeFileSync(viteConfigPath, content, 'utf8');
        logger.info(`Automatically updated Vite proxy target to port ${port} in vite.config.ts`);
      }
    }
  } catch (err) {
    logger.error('Failed to update Vite proxy target port:', err);
  }
};

const startServer = async () => {
  try {
    const targetPort = env.PORT || 5000;

    // 1. Proactively free up the port to prevent "Port already busy" errors on Windows
    await killProcessOnPort(targetPort);

    // 2. Connect to the MongoDB database first
    await connectDB();

    // 3. Start Express server on the target port
    activeServer = app.listen(targetPort, () => {
      logger.success(`Budget Planner Server Running on port ${targetPort}`);
      // Rewrite Vite proxy config target to point to our active port
      updateViteProxyPort(targetPort);
    });

    activeServer.on('error', async (err: any) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${targetPort} is still busy. Server cannot start.`);
        process.exit(1);
      } else {
        logger.error('Server experienced a runtime error:', err);
      }
    });

  } catch (error: any) {
    logger.error('Error during server startup phase:', error);
    process.exit(1);
  }
};

// Graceful shutdown helper
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  if (activeServer) {
    activeServer.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await disconnectDB();
        logger.info('MongoDB connection closed.');
        process.exit(0);
      } catch (dbErr: any) {
        logger.error('Error closing MongoDB connection during shutdown', dbErr);
        process.exit(1);
      }
    });
    
    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcing process exit.');
      process.exit(1);
    }, 10000);
  } else {
    try {
      await disconnectDB();
      logger.info('MongoDB connection closed.');
      process.exit(0);
    } catch (dbErr: any) {
      logger.error('Error closing MongoDB connection during shutdown', dbErr);
      process.exit(1);
    }
  }
};

// Register shutdown listeners
process.once('SIGTERM', () => handleShutdown('SIGTERM'));
process.once('SIGINT', () => handleShutdown('SIGINT'));

// Global Error Catching (Crash Prevention)
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception caught (prevented server crash):', err);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection caught (prevented server crash):', reason);
});

// Run the startup function
startServer();
