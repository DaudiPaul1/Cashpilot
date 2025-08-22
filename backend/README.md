# CashPilot Backend API

A production-ready TypeScript backend for CashPilot, an AI-powered financial dashboard SaaS.

## 🚀 Features

- **TypeScript** - Full type safety and modern development experience
- **Express.js** - Fast, unopinionated web framework
- **Supabase** - PostgreSQL database with real-time capabilities
- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Protection against abuse
- **AI Integration** - Claude AI for financial insights
- **Stripe Integration** - Subscription and payment processing
- **Multiple Integrations** - Plaid, QuickBooks, Shopify support
- **Cron Jobs** - Automated data sync and insights generation
- **Comprehensive Error Handling** - Production-ready error management

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project
- Stripe account
- Claude AI API key
- Plaid, QuickBooks, Shopify developer accounts (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp ../env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key

   # JWT
   JWT_SECRET=your_jwt_secret_key_here

   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Claude AI
   CLAUDE_API_KEY=sk-ant-api03-...

   # Plaid (optional)
   PLAID_CLIENT_ID=your_plaid_client_id
   PLAID_SECRET=your_plaid_secret
   PLAID_ENV=sandbox

   # QuickBooks (optional)
   QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
   QUICKBOOKS_SECRET=your_quickbooks_client_secret

   # Shopify (optional)
   SHOPIFY_CLIENT_ID=your_shopify_client_id
   SHOPIFY_CLIENT_SECRET=your_shopify_client_secret

   # Server
   PORT=4000
   NODE_ENV=development
   ```

4. **Database Setup**
   - Run the SQL schema in your Supabase SQL Editor
   - The schema is located in `../database/schema.sql`

5. **Build the project**
   ```bash
   npm run build
   ```

## 🚀 Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 📚 API Documentation

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe"
}
```

#### `POST /api/auth/login`
Authenticate user
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### `GET /api/auth/me`
Get current user profile (requires authentication)

#### `PUT /api/auth/profile`
Update user profile (requires authentication)
```json
{
  "fullName": "John Smith",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### Dashboard Endpoints

#### `GET /api/dashboard/overview`
Get dashboard overview with KPIs and recent data
```
Query params: days (optional, default: 30)
```

#### `GET /api/dashboard/transactions`
Get paginated transactions
```
Query params: 
- page (optional, default: 1)
- limit (optional, default: 20)
- type (optional: income, expense, transfer)
- startDate (optional)
- endDate (optional)
```

#### `GET /api/dashboard/analytics`
Get detailed analytics and breakdowns
```
Query params: days (optional, default: 30)
```

#### `GET /api/dashboard/insights`
Get AI-generated insights
```
Query params:
- type (optional: daily, weekly, monthly)
- limit (optional, default: 10)
```

### AI Endpoints

#### `POST /api/ai/generate-insight`
Generate AI-powered financial insight
```json
{
  "type": "daily",
  "focus": "spending"
}
```

#### `POST /api/ai/calculate-score`
Calculate comprehensive financial health score

#### `POST /api/ai/forecast`
Generate cash flow forecast
```json
{
  "period": "30"
}
```

### Integration Endpoints

#### `GET /api/integrations`
Get user's connected integrations

#### `POST /api/integrations/plaid/link-token`
Create Plaid link token for account connection

#### `POST /api/integrations/plaid/exchange-token`
Exchange Plaid public token for access token
```json
{
  "publicToken": "public-sandbox-token",
  "metadata": {
    "institution": { "name": "Bank Name" },
    "accounts": [...]
  }
}
```

#### `POST /api/integrations/quickbooks/auth`
Authenticate with QuickBooks
```json
{
  "code": "authorization_code",
  "realmId": "company_realm_id"
}
```

#### `POST /api/integrations/shopify/auth`
Authenticate with Shopify
```json
{
  "shop": "store.myshopify.com",
  "code": "authorization_code"
}
```

### Stripe Endpoints

#### `POST /api/stripe/create-subscription`
Create a new subscription
```json
{
  "priceId": "price_1234567890",
  "paymentMethodId": "pm_1234567890"
}
```

#### `GET /api/stripe/subscription`
Get current subscription status

#### `POST /api/stripe/cancel-subscription`
Cancel subscription
```json
{
  "cancelAtPeriodEnd": true
}
```

#### `GET /api/stripe/prices`
Get available subscription prices

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `CLAUDE_API_KEY` | Claude AI API key | Yes |
| `PLAID_CLIENT_ID` | Plaid client ID | No |
| `PLAID_SECRET` | Plaid secret | No |
| `QUICKBOOKS_CLIENT_ID` | QuickBooks client ID | No |
| `QUICKBOOKS_SECRET` | QuickBooks client secret | No |
| `SHOPIFY_CLIENT_ID` | Shopify client ID | No |
| `SHOPIFY_CLIENT_SECRET` | Shopify client secret | No |
| `PORT` | Server port | No (default: 4000) |
| `NODE_ENV` | Environment | No (default: development) |

### Database Schema

The database uses PostgreSQL with the following main tables:
- `users` - User accounts
- `integrations` - Connected third-party services
- `transactions` - Financial transactions
- `insights` - AI-generated insights
- `scores` - Financial health scores
- `subscriptions` - Stripe subscriptions

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Protection against API abuse
- **Input Validation** - Zod schema validation for all inputs
- **CORS Protection** - Configured for production domains
- **Helmet.js** - Security headers
- **SQL Injection Protection** - Parameterized queries via Supabase

## 🤖 AI Integration

The backend integrates with Claude AI for:
- Financial insights generation
- Spending pattern analysis
- Personalized recommendations
- Cash flow forecasting

## 🔄 Cron Jobs

Automated tasks scheduled via node-cron:
- **Daily insights** - Generate insights at 9 AM daily
- **Weekly scores** - Calculate financial health scores every Sunday
- **Data sync** - Sync integration data every 6 hours

## 📊 Monitoring

- **Health Check** - `/api/health` endpoint for monitoring
- **Request Logging** - All requests logged with timing
- **Error Tracking** - Comprehensive error handling and logging
- **Database Monitoring** - Connection health checks

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.ts
```

## 🚀 Deployment

### Railway
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Render
1. Create a new Web Service
2. Connect your repository
3. Set build command: `npm run build`
4. Set start command: `npm start`

### Vercel
1. Import your repository
2. Set environment variables
3. Deploy

## 📝 Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for functions

### Error Handling
- Always use try-catch blocks
- Return consistent error responses
- Log errors appropriately
- Use custom error classes

### Database Operations
- Use the database manager for all operations
- Handle errors gracefully
- Use transactions when needed
- Validate data before saving

### API Design
- Use RESTful conventions
- Return consistent response formats
- Include proper HTTP status codes
- Validate all inputs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@cashpilot.com or create an issue in the repository.
