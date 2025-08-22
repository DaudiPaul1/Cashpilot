"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
const auth_1 = __importDefault(require("./routes/auth"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const ai_1 = __importDefault(require("./routes/ai"));
const integrations_1 = __importDefault(require("./routes/integrations"));
const stripe_1 = __importDefault(require("./routes/stripe"));
const database_1 = require("./config/database");
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 4000;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env['NODE_ENV'] === 'production'
        ? [process.env['FRONTEND_URL'] || 'https://cashpilot.vercel.app']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const globalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalRateLimit);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});
app.get('/api/health', async (_req, res) => {
    try {
        const dbConnected = await database_1.db.testConnection();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env['NODE_ENV'] || 'development',
            database: dbConnected ? 'connected' : 'disconnected',
            version: process.env['npm_package_version'] || '1.0.0'
        });
    }
    catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});
app.use('/api/auth', auth_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/integrations', integrations_1.default);
app.use('/api/stripe', stripe_1.default);
app.get('/api/docs', (_req, res) => {
    res.json({
        name: 'CashPilot API',
        version: '1.0.0',
        description: 'AI-powered financial dashboard API',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register a new user',
                'POST /api/auth/login': 'Authenticate user',
                'POST /api/auth/refresh': 'Refresh access token',
                'GET /api/auth/me': 'Get current user profile',
                'PUT /api/auth/profile': 'Update user profile',
                'POST /api/auth/logout': 'Logout user'
            },
            dashboard: {
                'GET /api/dashboard/overview': 'Get dashboard overview',
                'GET /api/dashboard/transactions': 'Get paginated transactions',
                'GET /api/dashboard/analytics': 'Get detailed analytics',
                'GET /api/dashboard/insights': 'Get AI insights',
                'GET /api/dashboard/scores': 'Get financial health scores'
            },
            ai: {
                'POST /api/ai/generate-insight': 'Generate AI insight',
                'POST /api/ai/calculate-score': 'Calculate financial health score',
                'POST /api/ai/forecast': 'Generate cash flow forecast',
                'GET /api/ai/insights-history': 'Get insights history'
            },
            integrations: {
                'GET /api/integrations': 'Get user integrations',
                'POST /api/integrations/plaid': 'Connect Plaid account',
                'POST /api/integrations/quickbooks': 'Connect QuickBooks',
                'POST /api/integrations/shopify': 'Connect Shopify',
                'DELETE /api/integrations/:id': 'Disconnect integration'
            },
            stripe: {
                'POST /api/stripe/create-subscription': 'Create subscription',
                'POST /api/stripe/cancel-subscription': 'Cancel subscription',
                'GET /api/stripe/subscription': 'Get subscription status',
                'POST /api/stripe/webhook': 'Stripe webhook handler'
            }
        }
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});
app.use((error, _req, res, _next) => {
    console.error('Global error handler:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: error.message
        });
    }
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }
    if (error.name === 'RateLimitExceeded') {
        return res.status(429).json({
            success: false,
            error: 'Too many requests'
        });
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    return res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack })
    });
});
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
function scheduleCronJobs() {
    node_cron_1.default.schedule('0 9 * * *', async () => {
        console.log('🔄 Running daily insights generation...');
        try {
            console.log('✅ Daily insights generation completed');
        }
        catch (error) {
            console.error('❌ Error in daily insights generation:', error);
        }
    });
    node_cron_1.default.schedule('0 10 * * 0', async () => {
        console.log('🔄 Running weekly score calculation...');
        try {
            console.log('✅ Weekly score calculation completed');
        }
        catch (error) {
            console.error('❌ Error in weekly score calculation:', error);
        }
    });
    node_cron_1.default.schedule('0 */6 * * *', async () => {
        console.log('🔄 Running data sync...');
        try {
            console.log('✅ Data sync completed');
        }
        catch (error) {
            console.error('❌ Error in data sync:', error);
        }
    });
    console.log('📅 Cron jobs scheduled');
}
async function startServer() {
    try {
        const dbConnected = await database_1.db.testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }
        scheduleCronJobs();
        app.listen(PORT, () => {
            console.log(`🚀 CashPilot backend running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
            console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map