import { RESPONSE_STATUS } from '../config/constants.js';
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        status: RESPONSE_STATUS.SUCCESS,
        message,
        data
    });
};
export const sendError = (res, message, statusCode = 500, error = null) => {
    const responseBody = {
        status: RESPONSE_STATUS.ERROR,
        message
    };
    if (error && process.env.NODE_ENV !== 'production') {
        responseBody.error = error.message || error;
    }
    return res.status(statusCode).json(responseBody);
};
