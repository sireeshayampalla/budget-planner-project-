import { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';

export class UserController {
  /**
   * Get current user profile
   */
  public static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const user = await User.findById(userId).select('-password');
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }
      sendSuccess(res, 'User profile retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { username, email, avatar, currency, theme } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          sendError(res, 'Email already in use', 400);
          return;
        }
        user.email = email;
      }

      if (username) {
        user.username = username;
      }

      if (avatar !== undefined) {
        user.avatar = avatar;
      }

      if (currency !== undefined) {
        user.currency = currency;
      }

      if (theme !== undefined) {
        user.theme = theme;
      }

      await user.save();

      sendSuccess(res, 'Profile updated successfully', {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          currency: user.currency,
          theme: user.theme
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  public static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        sendError(res, 'Current password and new password are required', 400);
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        sendError(res, 'Incorrect current password', 400);
        return;
      }

      user.password = newPassword;
      await user.save();

      sendSuccess(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}
