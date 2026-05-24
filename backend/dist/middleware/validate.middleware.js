import { sendError } from '../utils/response.js';
export const validateBody = (rules) => {
    return (req, res, next) => {
        const errors = [];
        for (const rule of rules) {
            let val = req.body[rule.field];
            if (typeof val === 'string') {
                val = val.trim();
                req.body[rule.field] = val;
            }
            // Check required
            if (rule.required && (val === undefined || val === null || val === '')) {
                errors.push(`${rule.field} is required`);
                continue;
            }
            if (val === undefined || val === null || val === '') {
                continue; // Optional field is missing
            }
            // Check types & validations
            if (rule.type === 'string') {
                if (typeof val !== 'string') {
                    errors.push(`${rule.field} must be a string`);
                }
                else {
                    if (rule.min !== undefined && val.length < rule.min) {
                        errors.push(`${rule.field} must be at least ${rule.min} characters long`);
                    }
                    if (rule.max !== undefined && val.length > rule.max) {
                        errors.push(`${rule.field} cannot exceed ${rule.max} characters`);
                    }
                    if (rule.enum && !rule.enum.includes(val)) {
                        errors.push(`${rule.field} must be one of: ${rule.enum.join(', ')}`);
                    }
                }
            }
            else if (rule.type === 'number') {
                const num = Number(val);
                if (isNaN(num)) {
                    errors.push(`${rule.field} must be a number`);
                }
                else {
                    if (rule.min !== undefined && num < rule.min) {
                        errors.push(`${rule.field} must be at least ${rule.min}`);
                    }
                    if (rule.max !== undefined && num > rule.max) {
                        errors.push(`${rule.field} cannot exceed ${rule.max}`);
                    }
                }
            }
            else if (rule.type === 'date') {
                const date = new Date(val);
                if (isNaN(date.getTime())) {
                    errors.push(`${rule.field} must be a valid date`);
                }
            }
            else if (rule.type === 'email') {
                const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
                if (typeof val !== 'string' || !emailRegex.test(val)) {
                    errors.push(`${rule.field} must be a valid email address`);
                }
            }
        }
        if (errors.length > 0) {
            sendError(res, `Validation failed: ${errors.join('. ')}`, 400);
            return;
        }
        next();
    };
};
