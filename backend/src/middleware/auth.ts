import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { JwtPayload, AppError } from '../types';

/**
 * Extend Express Request interface to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Custom error class for authentication errors
 */
class AuthError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Verify JWT token and extract user information
 */
export const verifyToken = async (token: string): Promise<JwtPayload> => {
  try {
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new AuthError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token expired', 401);
    }
    throw error;
  }
};

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request object
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = await verifyToken(token);

    // Check if user exists in database
    const { data: user, error } = await db.getUserById(decoded.userId);
    if (error || !user) {
      throw new AuthError('User not found', 401);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      console.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};

/**
 * Optional authentication middleware
 * Similar to authenticate but doesn't fail if no token is provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    const { data: user, error } = await db.getUserById(decoded.userId);
    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email
      };
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role (for future use)
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // For now, all authenticated users have the same role
    // This can be extended later with role-based access control
    next();
  };
};

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP
 */
export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    const userRequests = requests.get(ip);
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      userRequests.count++;
      if (userRequests.count > maxRequests) {
        res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.'
        });
        return;
      }
    }

    next();
  };
};

/**
 * Generate JWT token for user
 */
export const generateToken = (userId: string, email: string): string => {
  const jwtSecret = process.env['JWT_SECRET'];
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  const payload: JwtPayload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(payload, jwtSecret);
};

/**
 * Refresh token middleware
 * Validates refresh token and issues new access token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AuthError('Refresh token required', 400);
    }

    // Verify refresh token (you might want to store refresh tokens in database)
    const decoded = await verifyToken(refreshToken);

    // Check if user still exists
    const { data: user, error } = await db.getUserById(decoded.userId);
    if (error || !user) {
      throw new AuthError('User not found', 401);
    }

    // Generate new access token
    const newToken = generateToken(user.id, user.email);

    res.json({
      success: true,
      data: {
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name
        }
      }
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};

export { AuthError };
