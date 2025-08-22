-- CashPilot Database Schema
-- Run this in Supabase SQL Editor to set up the complete database

-- =====================================================
-- CORE TABLES
-- =====================================================

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
  provider VARCHAR NOT NULL, -- 'plaid', 'quickbooks', 'shopify'
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
  type VARCHAR(20), -- 'income', 'expense', 'transfer'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  score DECIMAL(3,2), -- 0.00 to 1.00
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id);

-- Integration indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user_provider ON integrations(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active);

-- Insight indexes
CREATE INDEX IF NOT EXISTS idx_insights_user_type ON insights(user_id, type);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at);

-- Score indexes
CREATE INDEX IF NOT EXISTS idx_scores_user_period ON scores(user_id, period);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

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

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Calculate user financial health score
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

-- Get user dashboard data
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

-- Get spending breakdown by category
CREATE OR REPLACE FUNCTION get_spending_breakdown(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'category', category,
      'total', SUM(ABS(amount)),
      'count', COUNT(*),
      'average', AVG(ABS(amount))
    )
  ) INTO result
  FROM transactions
  WHERE user_id = user_uuid 
    AND type = 'expense'
    AND transaction_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY category
  ORDER BY SUM(ABS(amount)) DESC;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get income breakdown by source
CREATE OR REPLACE FUNCTION get_income_breakdown(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'source', COALESCE(metadata->>'source', 'Other'),
      'total', SUM(amount),
      'count', COUNT(*),
      'average', AVG(amount)
    )
  ) INTO result
  FROM transactions
  WHERE user_id = user_uuid 
    AND type = 'income'
    AND transaction_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY COALESCE(metadata->>'source', 'Other')
  ORDER BY SUM(amount) DESC;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp on users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (FOR TESTING)
-- =====================================================

-- Insert sample user (for testing)
INSERT INTO users (id, email, full_name) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@cashpilot.com',
  'Test User'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample transactions (for testing)
INSERT INTO transactions (user_id, amount, description, category, transaction_date, type) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 5000.00, 'Salary Payment', 'Salary', CURRENT_DATE - INTERVAL '7 days', 'income'),
  ('550e8400-e29b-41d4-a716-446655440000', -120.50, 'Grocery Shopping', 'Food & Dining', CURRENT_DATE - INTERVAL '5 days', 'expense'),
  ('550e8400-e29b-41d4-a716-446655440000', -89.99, 'Internet Bill', 'Utilities', CURRENT_DATE - INTERVAL '3 days', 'expense'),
  ('550e8400-e29b-41d4-a716-446655440000', 1500.00, 'Freelance Project', 'Freelance', CURRENT_DATE - INTERVAL '2 days', 'income'),
  ('550e8400-e29b-41d4-a716-446655440000', -45.00, 'Gas Station', 'Transportation', CURRENT_DATE - INTERVAL '1 day', 'expense');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'integrations', 'transactions', 'insights', 'scores', 'subscriptions')
ORDER BY table_name;

-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'integrations', 'transactions', 'insights', 'scores', 'subscriptions');

-- Test functions
SELECT calculate_financial_health_score('550e8400-e29b-41d4-a716-446655440000');
SELECT get_user_dashboard_data('550e8400-e29b-41d4-a716-446655440000', 30);
SELECT get_spending_breakdown('550e8400-e29b-41d4-a716-446655440000', 30);
SELECT get_income_breakdown('550e8400-e29b-41d4-a716-446655440000', 30);
