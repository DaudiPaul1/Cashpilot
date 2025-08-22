"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters')
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required')
});
router.post('/register', (0, auth_2.rateLimit)(5, 15 * 60 * 1000), async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const { email, password, fullName } = validatedData;
        const { data: existingUser } = await database_1.db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        const userId = crypto.randomUUID();
        const { data: user, error } = await database_1.db.createUser({
            id: userId,
            email,
            fullName,
            avatarUrl: undefined
        });
        if (error) {
            console.error('Database error creating user:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create user'
            });
        }
        const token = (0, auth_1.generateToken)(userId, email);
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    avatarUrl: user.avatar_url
                },
                token
            },
            message: 'User registered successfully'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/login', (0, auth_2.rateLimit)(10, 15 * 60 * 1000), async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const { email, password } = validatedData;
        const { data: user, error } = await database_1.db.getUserByEmail(email);
        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        const token = (0, auth_1.generateToken)(user.id, user.email);
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    avatarUrl: user.avatar_url
                },
                token
            },
            message: 'Login successful'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/refresh', (0, auth_2.rateLimit)(20, 15 * 60 * 1000), async (req, res) => {
    try {
        const validatedData = refreshTokenSchema.parse(req.body);
        const { refreshToken } = validatedData;
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env['JWT_SECRET'];
        if (!jwtSecret) {
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
        }
        try {
            const decoded = jwt.verify(refreshToken, jwtSecret);
            const { data: user, error } = await database_1.db.getUserById(decoded.userId);
            if (error || !user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
            }
            const newToken = (0, auth_1.generateToken)(user.id, user.email);
            res.json({
                success: true,
                data: {
                    token: newToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.full_name,
                        avatarUrl: user.avatar_url
                    }
                }
            });
        }
        catch (jwtError) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token'
            });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { data: user, error } = await database_1.db.getUserById(req.user.id);
        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    avatarUrl: user.avatar_url,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at
                }
            }
        });
    }
    catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.put('/profile', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const updateSchema = zod_1.z.object({
            fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').optional(),
            avatarUrl: zod_1.z.string().url('Invalid avatar URL').optional()
        });
        const validatedData = updateSchema.parse(req.body);
        const { data: user, error } = await database_1.db.updateUser(req.user.id, validatedData);
        if (error) {
            console.error('Database error updating user:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update user'
            });
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    avatarUrl: user.avatar_url,
                    updatedAt: user.updated_at
                }
            },
            message: 'Profile updated successfully'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/logout', auth_1.authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map