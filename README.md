# CashPilot 🚀

**AI-Powered Financial Dashboard & Analytics Platform**

CashPilot is a comprehensive financial management platform that connects to your bank accounts, accounting software, and e-commerce platforms to provide intelligent insights, automated scoring, and actionable recommendations for better financial health.

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with Supabase
- Secure password hashing with bcrypt
- Protected API routes with middleware

### 💳 Financial Integrations
- **Plaid**: Connect bank accounts and pull real-time transactions
- **QuickBooks**: Sync accounting data and business transactions
- **Shopify**: Import e-commerce sales and order data
- **Stripe**: Handle subscriptions and payments

### 🤖 AI-Powered Insights
- **Daily Insights**: Personalized financial recommendations
- **Weekly Scores**: Comprehensive financial health scoring
- **Trend Analysis**: Identify spending patterns and opportunities
- **Smart Categorization**: Automatic transaction categorization

### 📊 Dashboard & Analytics
- **Real-time KPIs**: Income, expenses, cash flow, savings rate
- **Interactive Charts**: Cash flow trends and spending breakdowns
- **Transaction History**: Detailed transaction management
- **Account Balances**: Multi-account overview

### 🔄 Automation
- **Cron Jobs**: Automated daily insights and weekly scoring
- **Webhooks**: Real-time data synchronization
- **Scheduled Tasks**: Background processing and updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- API keys for integrations (Plaid, QuickBooks, Shopify, Stripe, OpenAI)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd cash-pilot
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your API keys:

```bash
cp env.example .env.local
```

Required environment variables:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Plaid
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# QuickBooks
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:3001/api/auth/quickbooks/callback

# Shopify
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_products,read_orders,read_customers

# OpenAI
OPENAI_API_KEY=sk-...

# Backend
BACKEND_PORT=3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  external_id VARCHAR,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  category VARCHAR(100),
  transaction_date DATE NOT NULL,
  type VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  score DECIMAL(3,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,
  score DECIMAL(3,2) NOT NULL,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  status VARCHAR(50),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_failed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_integrations_user_provider ON integrations(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_insights_user_type ON insights(user_id, type);
CREATE INDEX IF NOT EXISTS idx_scores_user_period ON scores(user_id, period);
```

### 4. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:3001
```

### 5. Test the Setup

1. Visit `http://localhost:3000`
2. Create a new account or sign in
3. Connect your first integration (Plaid sandbox recommended for testing)
4. Generate your first AI insight

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Integrations
- `POST /api/integrations/plaid/link-token` - Get Plaid link token
- `POST /api/integrations/plaid/exchange-token` - Exchange Plaid token
- `GET /api/integrations/plaid/transactions` - Pull Plaid transactions
- `GET /api/integrations/quickbooks/auth-url` - QuickBooks OAuth URL
- `GET /api/integrations/shopify/auth-url` - Shopify OAuth URL

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview with KPIs
- `GET /api/dashboard/trends` - Financial trends analysis
- `GET /api/dashboard/spending` - Spending analysis
- `GET /api/dashboard/income` - Income analysis
- `GET /api/dashboard/accounts` - Account balances

### AI & Insights
- `POST /api/ai/insights/daily` - Generate daily insight
- `POST /api/ai/scores/weekly` - Generate weekly score
- `GET /api/ai/insights` - Get insights history
- `GET /api/ai/scores` - Get scores history

### Stripe
- `POST /api/stripe/create-checkout-session` - Create checkout session
- `POST /api/stripe/create-portal-session` - Create customer portal
- `POST /api/stripe/webhook` - Stripe webhook handler
- `GET /api/stripe/subscription` - Get subscription status

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render/Railway)

1. Connect your GitHub repo to Render/Railway
2. Set environment variables
3. Configure build command: `npm install`
4. Configure start command: `npm run start`

### Environment Variables for Production

Update your environment variables for production:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

## 📁 Project Structure

```
cash-pilot/
├── backend/
│   ├── config/
│   │   └── database.js          # Supabase configuration
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── dashboard.js         # Dashboard data routes
│   │   ├── integrations.js      # OAuth integration routes
│   │   ├── stripe.js            # Stripe payment routes
│   │   └── ai.js                # AI insights routes
│   └── server.js                # Express server
├── src/
│   └── app/
│       ├── page.tsx             # Main dashboard
│       ├── layout.tsx           # App layout
│       └── globals.css          # Global styles
├── package.json                 # Dependencies
├── env.example                  # Environment template
└── README.md                    # This file
```

## 🔒 Security

- All API routes are protected with JWT authentication
- Passwords are hashed using bcrypt
- Environment variables for sensitive data
- CORS configured for production domains
- Helmet.js for security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email support@cashpilot.com or create an issue in this repository.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced AI features (predictive analytics)
- [ ] Multi-currency support
- [ ] Tax optimization insights
- [ ] Investment portfolio tracking
- [ ] Team collaboration features
- [ ] API rate limiting
- [ ] Advanced reporting
- [ ] Export functionality
- [ ] Webhook integrations

---

**Built with ❤️ using Next.js, Express.js, Supabase, and OpenAI**
