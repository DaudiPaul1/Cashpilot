"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthError = exports.refreshToken = exports.generateToken = exports.rateLimit = exports.requireRole = exports.optionalAuth = exports.authenticate = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
class AuthError extends Error {
    constructor(message, statusCode = 401) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AuthError = AuthError;
const verifyToken = async (token) => {
    try {
        const jwtSecret = process.env['JWT_SECRET'];
        if (!jwtSecret) {
            throw new AuthError('JWT secret not configured', 500);
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new AuthError('Invalid token', 401);
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new AuthError('Token expired', 401);
        }
        throw error;
    }
};
exports.verifyToken = verifyToken;
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthError('No token provided', 401);
        }
        const token = authHeader.substring(7);
        const decoded = await (0, exports.verifyToken)(token);
        const { data: user, error } = await database_1.db.getUserById(decoded.userId);
        if (error || !user) {
            throw new AuthError('User not found', 401);
        }
        req.user = {
            id: user.id,
            email: user.email
        };
        next();
    }
    catch (error) {
        if (error instanceof AuthError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        else {
            console.error('Authentication error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        const decoded = await (0, exports.verifyToken)(token);
        const { data: user, error } = await database_1.db.getUserById(decoded.userId);
        if (!error && user) {
            req.user = {
                id: user.id,
                email: user.email
            };
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const userRequests = requests.get(ip);
        if (!userRequests || now > userRequests.resetTime) {
            requests.set(ip, { count: 1, resetTime: now + windowMs });
        }
        else {
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
exports.rateLimit = rateLimit;
const generateToken = (userId, email) => {
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
        throw new Error('JWT secret not configured');
    }
    const payload = {
        userId,
        email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
    return jsonwebtoken_1.default.sign(payload, jwtSecret);
};
exports.generateToken = generateToken;
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new AuthError('Refresh token required', 400);
        }
        const decoded = await (0, exports.verifyToken)(refreshToken);
        const { data: user, error } = await database_1.db.getUserById(decoded.userId);
        if (error || !user) {
            throw new AuthError('User not found', 401);
        }
        const newToken = (0, exports.generateToken)(user.id, user.email);
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
    }
    catch (error) {
        if (error instanceof AuthError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        else {
            console.error('Token refresh error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};
exports.refreshToken = refreshToken;
//# sourceMappingURL=auth.js.map