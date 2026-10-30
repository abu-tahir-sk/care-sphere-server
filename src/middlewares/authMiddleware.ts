import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'CareSphere_SuperSecret_JWT_Key_2026_SecureKey';

    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
};

// Optional auth middleware: attaches user if token is present, but doesn't block guests
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'CareSphere_SuperSecret_JWT_Key_2026_SecureKey';
      const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
      req.user = decoded;
    }
  } catch (error) {
    // Ignore invalid token for optional auth
  }
  next();
};
