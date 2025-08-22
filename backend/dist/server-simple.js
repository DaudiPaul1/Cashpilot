"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 4000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['NODE_ENV'] === 'production'
        ? [process.env['FRONTEND_URL'] || 'https://cashpilot.vercel.app']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/api/health', async (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env['NODE_ENV'] || 'development',
        version: process.env['npm_package_version'] || '1.0.0'
    });
});
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'demo@cashpilot.com' && password === 'demo123') {
        res.json({
            success: true,
            data: {
                user: {
                    id: 'demo-user-123',
                    email: 'demo@cashpilot.com',
                    firstName: 'Demo',
                    lastName: 'User',
                    fullName: 'Demo User',
                    avatarUrl: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                tokens: {
                    accessToken: 'mock-access-token-' + Date.now(),
                    refreshToken: 'mock-refresh-token-' + Date.now()
                }
            }
        });
    }
    else {
        res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }
});
app.post('/api/auth/register', (req, res) => {
    const { email, password, firstName, lastName, companyName } = req.body;
    res.json({
        success: true,
        data: {
            user: {
                id: 'new-user-' + Date.now(),
                email,
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`,
                companyName,
                avatarUrl: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            tokens: {
                accessToken: 'mock-access-token-' + Date.now(),
                refreshToken: 'mock-refresh-token-' + Date.now()
            }
        }
    });
});
app.get('/api/dashboard/overview', (req, res) => {
    res.json({
        success: true,
        data: {
            kpis: {
                totalIncome: 125000,
                totalExpenses: 82000,
                netCashFlow: 43000,
                savingsRate: 34.4,
                transactionCount: 156,
                accountsReceivable: 15000,
                accountsPayable: 8000,
                cashRunway: 180
            },
            recentTransactions: [
                {
                    id: '1',
                    date: '2024-01-15',
                    amount: 2500,
                    description: 'Salary - Tech Corp',
                    category: 'Income',
                    type: 'income'
                },
                {
                    id: '2',
                    date: '2024-01-14',
                    amount: 120,
                    description: 'Grocery Store',
                    category: 'Food & Dining',
                    type: 'expense'
                },
                {
                    id: '3',
                    date: '2024-01-13',
                    amount: 85,
                    description: 'Gas Station',
                    category: 'Transportation',
                    type: 'expense'
                }
            ],
            chartData: [
                { date: '2024-01-10', income: 2500, expenses: 1800, net: 700 },
                { date: '2024-01-11', income: 0, expenses: 950, net: -950 },
                { date: '2024-01-12', income: 0, expenses: 1200, net: -1200 },
                { date: '2024-01-13', income: 0, expenses: 850, net: -850 },
                { date: '2024-01-14', income: 0, expenses: 1100, net: -1100 },
                { date: '2024-01-15', income: 2500, expenses: 1300, net: 1200 }
            ],
            insights: [
                {
                    id: '1',
                    title: 'Strong Savings Performance',
                    content: 'Your savings rate of 34.4% is excellent! You\'re saving more than the recommended 20% of your income.',
                    score: 0.85,
                    category: 'positive',
                    metadata: {
                        recommendation: 'Consider increasing your emergency fund to 6 months of expenses.',
                        positive_observation: 'Your spending is well-controlled and you have a positive cash flow.',
                        key_metrics: { savingsRate: 34.4, cashFlow: 43000 }
                    },
                    createdAt: new Date().toISOString()
                }
            ],
            scores: [
                {
                    id: '1',
                    score: 85,
                    grade: 'A',
                    period: 'weekly',
                    breakdown: {
                        cashFlow: 90,
                        savings: 85,
                        debt: 80,
                        emergency: 85
                    },
                    insights: 'Excellent financial health with strong cash flow and savings.',
                    createdAt: new Date().toISOString()
                }
            ]
        }
    });
});
app.post('/api/ai/generate-insight', (req, res) => {
    res.json({
        success: true,
        data: {
            id: 'insight-' + Date.now(),
            title: 'AI Generated Insight',
            content: 'This is a mock AI-generated insight based on your financial data.',
            score: 0.75,
            category: 'positive',
            metadata: {
                recommendation: 'Mock recommendation from AI.',
                positive_observation: 'Mock positive observation.',
                key_metrics: { metric1: 100, metric2: 200 }
            },
            createdAt: new Date().toISOString()
        }
    });
});
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack })
        }
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Endpoint not found',
            path: req.originalUrl
        }
    });
});
app.listen(PORT, () => {
    console.log(`🚀 CashPilot Backend Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📚 API Base: http://localhost:${PORT}/api`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
//# sourceMappingURL=server-simple.js.map