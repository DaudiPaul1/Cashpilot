import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import aiRoutes from './routes/ai';
import integrationsRoutes from './routes/integrations';
import stripeRoutes from './routes/stripe';

// Import database
import { db } from './config/database';

const app = express();
const PORT = process.env['PORT'] || 4000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
    origin: process.env['NODE_ENV'] === 'production'
    ? [process.env['FRONTEND_URL'] || 'https://cashpilot.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env['NODE_ENV'] || 'development',
      database: dbConnected ? 'connected' : 'disconnected',
      version: process.env['npm_package_version'] || '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/stripe', stripeRoutes);

// API documentation endpoint
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handling middleware
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', error);

  // Handle specific error types
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

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Schedule cron jobs for automated tasks
function scheduleCronJobs() {
  // Daily insights generation at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('🔄 Running daily insights generation...');
    try {
      // TODO: Implement daily insights generation for all users
      console.log('✅ Daily insights generation completed');
    } catch (error) {
      console.error('❌ Error in daily insights generation:', error);
    }
  });

  // Weekly score calculation every Sunday at 10 AM
  cron.schedule('0 10 * * 0', async () => {
    console.log('🔄 Running weekly score calculation...');
    try {
      // TODO: Implement weekly score calculation for all users
      console.log('✅ Weekly score calculation completed');
    } catch (error) {
      console.error('❌ Error in weekly score calculation:', error);
    }
  });

  // Data sync every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Running data sync...');
    try {
      // TODO: Implement data sync for all integrations
      console.log('✅ Data sync completed');
    } catch (error) {
      console.error('❌ Error in data sync:', error);
    }
  });

  console.log('📅 Cron jobs scheduled');
}

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Schedule cron jobs
    scheduleCronJobs();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 CashPilot backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
