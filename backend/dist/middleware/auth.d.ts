import { Request, Response, NextFunction } from 'express';
import { JwtPayload, AppError } from '../types';
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
declare class AuthError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
export declare const verifyToken: (token: string) => Promise<JwtPayload>;
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (requiredRole: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const rateLimit: (maxRequests?: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const generateToken: (userId: string, email: string) => string;
export declare const refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export { AuthError };
//# sourceMappingURL=auth.d.ts.map