# CashPilot Database Documentation 🗄️

## Overview

CashPilot uses **Supabase** as its primary database, providing PostgreSQL with real-time capabilities, authentication, and edge functions.

## Database Schema

### Core Tables

#### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. Integrations Table
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL, -- 'plaid', 'quickbooks', 'shopify'
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  external_id VARCHAR,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  category VARCHAR(100),
  transaction_date DATE NOT NULL,
  type VARCHAR(20), -- 'income', 'expense', 'transfer'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. Insights Table
```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  score DECIMAL(3,2), -- 0.00 to 1.00
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. Scores Table
```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. Subscriptions Table
```sql
CREATE TABLE subscriptions (
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
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_integrations_user_provider ON integrations(user_id, provider);
CREATE INDEX idx_insights_user_type ON insights(user_id, type);
CREATE INDEX idx_scores_user_period ON scores(user_id, period);
```

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON insights
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scores" ON scores
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

## Database Functions

### 1. Calculate User Financial Health Score
```sql
CREATE OR REPLACE FUNCTION calculate_financial_health_score(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_income DECIMAL := 0;
  total_expenses DECIMAL := 0;
  savings_rate DECIMAL := 0;
  score DECIMAL := 0;
BEGIN
  -- Calculate total income and expenses for last 30 days
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0)
  INTO total_income, total_expenses
  FROM transactions 
  WHERE user_id = user_uuid 
    AND transaction_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calculate savings rate
  IF total_income > 0 THEN
    savings_rate := (total_income - total_expenses) / total_income;
  END IF;
  
  -- Calculate score (0-100)
  score := GREATEST(0, LEAST(100, 
    CASE 
      WHEN savings_rate >= 0.2 THEN 100
      WHEN savings_rate >= 0.1 THEN 80
      WHEN savings_rate >= 0.05 THEN 60
      WHEN savings_rate >= 0 THEN 40
      ELSE 20
    END
  ));
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;
```

### 2. Get User Dashboard Data
```sql
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'kpis', json_build_object(
      'total_income', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
      'total_expenses', COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0),
      'transaction_count', COUNT(*),
      'savings_rate', CASE 
        WHEN SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) > 0 
        THEN (SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END)) / SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END)
        ELSE 0 
      END
    ),
    'recent_transactions', (
      SELECT json_agg(
        json_build_object(
          'id', t.id,
          'amount', t.amount,
          'description', t.description,
          'category', t.category,
          'type', t.type,
          'date', t.transaction_date
        )
      )
      FROM transactions t
      WHERE t.user_id = user_uuid
      ORDER BY t.transaction_date DESC
      LIMIT 10
    )
  ) INTO result
  FROM transactions
  WHERE user_id = user_uuid 
    AND transaction_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## Migration Scripts

### Initial Setup
```sql
-- Run this in Supabase SQL Editor
-- 1. Create tables
-- 2. Create indexes
-- 3. Enable RLS
-- 4. Create policies
-- 5. Create functions

-- See schema.sql for complete setup
```

### Data Migration
```sql
-- Example: Migrate from old schema
-- ALTER TABLE old_transactions ADD COLUMN new_field VARCHAR;
-- UPDATE old_transactions SET new_field = 'default_value';
```

## Backup Strategy

### Automated Backups
- Supabase provides automatic daily backups
- Point-in-time recovery available
- Cross-region replication for disaster recovery

### Manual Backups
```bash
# Export data (if needed)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore data
psql $DATABASE_URL < backup_20240813.sql
```

## Performance Optimization

### Query Optimization
- Use indexes for frequently queried columns
- Implement pagination for large datasets
- Use materialized views for complex aggregations

### Monitoring
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Security Considerations

### Data Encryption
- All data encrypted at rest
- TLS encryption in transit
- API keys stored securely

### Access Control
- Row Level Security enabled
- Service role for backend operations
- Anon role for public access

### Audit Logging
```sql
-- Enable audit logging (if needed)
CREATE EXTENSION IF NOT EXISTS pgaudit;
ALTER SYSTEM SET pgaudit.log = 'all';
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Check network connectivity
   - Verify connection pool settings
   - Monitor query performance

2. **Permission Errors**
   - Verify RLS policies
   - Check user authentication
   - Confirm service role permissions

3. **Performance Issues**
   - Analyze slow queries
   - Check index usage
   - Monitor resource usage

### Debug Queries
```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Check table statistics
SELECT * FROM pg_stat_user_tables;

-- Check index usage
SELECT * FROM pg_stat_user_indexes;
```

## Environment Variables

```env
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## API Integration

The database is accessed through:
- **Supabase Client** (frontend)
- **Supabase Service Role** (backend)
- **Direct PostgreSQL** (advanced operations)

See `backend/config/database.js` for connection configuration.
