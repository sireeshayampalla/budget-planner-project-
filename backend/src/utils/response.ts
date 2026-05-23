import { Response } from 'express';
import { RESPONSE_STATUS } from '../config/constants.js';

export const sendSuccess = (res: Response, message: string, data: any = null, statusCode: number = 200): Response => {
  return res.status(statusCode).json({
    status: RESPONSE_STATUS.SUCCESS,
    message,
    data
  });
};

export const sendError = (res: Response, message: string, statusCode: number = 500, error: any = null): Response => {
  const responseBody: any = {
    status: RESPONSE_STATUS.ERROR,
    message
  };

  if (error && process.env.NODE_ENV !== 'production') {
    responseBody.error = error.message || error;
  }

  return res.status(statusCode).json(responseBody);
};
