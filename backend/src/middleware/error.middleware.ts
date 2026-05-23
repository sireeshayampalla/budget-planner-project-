import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(`Unhandled error during request: ${req.method} ${req.originalUrl}`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  sendError(res, message, statusCode, err);
};
