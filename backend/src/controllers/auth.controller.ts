import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedRequest } from '../types/index.js';

export class AuthController {
  /**
   * Register a new user
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password } = req.body;
      const cleanEmail = email.trim().toLowerCase();

      logger.info(`Processing registration request for username: "${username}", email: "${cleanEmail}"`);

      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        logger.warn(`Registration failed: Email "${cleanEmail}" is already registered`);
        sendError(res, 'Email already registered', 400);
        return;
      }

      const user = new User({ username, email, password });
      await user.save();

      logger.success(`User "${username}" registered successfully with ID: ${user._id}`);

      const token = generateToken({
        id: user._id.toString(),
        email: user.email,
        username: user.username
      });

      sendSuccess(res, 'Registration successful', {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          currency: user.currency,
          theme: user.theme
        }
      }, 201);
    } catch (error: any) {
      logger.error('Registration error occurred:', error);
      next(error);
    }
  }

  /**
   * Authenticate a user
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const cleanEmail = email.trim().toLowerCase();

      logger.info(`Processing login request for email: "${cleanEmail}"`);

      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        logger.warn(`Login failed: No user found with email "${cleanEmail}"`);
        sendError(res, 'Invalid credentials', 401);
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        logger.warn(`Login failed: Password mismatch for email "${cleanEmail}"`);
        sendError(res, 'Invalid credentials', 401);
        return;
      }

      logger.success(`User logged in successfully: "${user.username}" (${cleanEmail})`);

      const token = generateToken({
        id: user._id.toString(),
        email: user.email,
        username: user.username
      });

      sendSuccess(res, 'Login successful', {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          currency: user.currency,
          theme: user.theme
        }
      });
    } catch (error: any) {
      logger.error('Login error occurred:', error);
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  public static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, 'Profile retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset user password (mock implementation for demo)
   */
  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, newPassword } = req.body;
      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim();

      logger.info(`Processing forgotPassword password reset request for username: "${cleanUsername}", email: "${cleanEmail}"`);

      const user = await User.findOne({
        email: cleanEmail,
        username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') }
      });
      if (!user) {
        logger.warn(`Password reset failed: No user matches username "${cleanUsername}" and email "${cleanEmail}"`);
        sendError(res, 'No matching user found with the provided username and email.', 404);
        return;
      }

      user.password = newPassword;
      await user.save();

      logger.success(`Password reset successful for user "${user.username}" (${cleanEmail})`);

      sendSuccess(res, 'Password reset successful. You can now log in.');
    } catch (error: any) {
      logger.error('Password reset error occurred:', error);
      next(error);
    }
  }
}

