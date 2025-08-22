-- Normalized Cashflow View
-- Provides a unified view of all financial data for easy querying

CREATE OR REPLACE VIEW cashflow_view AS
SELECT 
    t.id,
    t.user_id,
    t.integration_id,
    i.provider as source,
    t.external_id,
    t.amount,
    t.currency,
    t.description,
    t.category,
    t.transaction_date,
    t.type,
    t.metadata,
    t.created_at,
    -- Normalized fields for easier querying
    CASE 
        WHEN t.type = 'income' THEN t.amount 
        ELSE 0 
    END as income_amount,
    CASE 
        WHEN t.type = 'expense' THEN ABS(t.amount) 
        ELSE 0 
    END as expense_amount,
    -- Month and year for grouping
    EXTRACT(YEAR FROM t.transaction_date) as year,
    EXTRACT(MONTH FROM t.transaction_date) as month,
    DATE_TRUNC('month', t.transaction_date) as month_start,
    -- Week for weekly analysis
    EXTRACT(WEEK FROM t.transaction_date) as week,
    DATE_TRUNC('week', t.transaction_date) as week_start,
    -- Day of week for patterns
    EXTRACT(DOW FROM t.transaction_date) as day_of_week,
    -- Quarter for quarterly analysis
    EXTRACT(QUARTER FROM t.transaction_date) as quarter
FROM transactions t
LEFT JOIN integrations i ON t.integration_id = i.id
WHERE t.amount IS NOT NULL;

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_cashflow_view_user_date 
ON transactions(user_id, transaction_date);

CREATE INDEX IF NOT EXISTS idx_cashflow_view_type 
ON transactions(type);

-- Helper function to get cashflow summary
CREATE OR REPLACE FUNCTION get_cashflow_summary(
    user_uuid UUID,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'period', json_build_object(
            'start_date', start_date,
            'end_date', end_date,
            'days', end_date - start_date
        ),
        'summary', json_build_object(
            'total_income', COALESCE(SUM(income_amount), 0),
            'total_expenses', COALESCE(SUM(expense_amount), 0),
            'net_cashflow', COALESCE(SUM(income_amount), 0) - COALESCE(SUM(expense_amount), 0),
            'transaction_count', COUNT(*),
            'savings_rate', CASE 
                WHEN COALESCE(SUM(income_amount), 0) > 0 
                THEN ((COALESCE(SUM(income_amount), 0) - COALESCE(SUM(expense_amount), 0)) / COALESCE(SUM(income_amount), 0)) * 100
                ELSE 0 
            END
        ),
        'daily_breakdown', (
            SELECT json_agg(
                json_build_object(
                    'date', transaction_date,
                    'income', SUM(income_amount),
                    'expenses', SUM(expense_amount),
                    'net', SUM(income_amount) - SUM(expense_amount),
                    'count', COUNT(*)
                )
            )
            FROM cashflow_view
            WHERE user_id = user_uuid 
                AND transaction_date BETWEEN start_date AND end_date
            GROUP BY transaction_date
            ORDER BY transaction_date
        ),
        'category_breakdown', (
            SELECT json_agg(
                json_build_object(
                    'category', category,
                    'income', SUM(income_amount),
                    'expenses', SUM(expense_amount),
                    'count', COUNT(*)
                )
            )
            FROM cashflow_view
            WHERE user_id = user_uuid 
                AND transaction_date BETWEEN start_date AND end_date
            GROUP BY category
            ORDER BY SUM(expense_amount) DESC
        ),
        'source_breakdown', (
            SELECT json_agg(
                json_build_object(
                    'source', COALESCE(source, 'manual'),
                    'income', SUM(income_amount),
                    'expenses', SUM(expense_amount),
                    'count', COUNT(*)
                )
            )
            FROM cashflow_view
            WHERE user_id = user_uuid 
                AND transaction_date BETWEEN start_date AND end_date
            GROUP BY source
            ORDER BY SUM(income_amount) DESC
        )
    ) INTO result
    FROM cashflow_view
    WHERE user_id = user_uuid 
        AND transaction_date BETWEEN start_date AND end_date;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get monthly trends
CREATE OR REPLACE FUNCTION get_monthly_trends(
    user_uuid UUID,
    months_back INTEGER DEFAULT 6
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'month', month_start,
            'year', year,
            'month_number', month,
            'income', SUM(income_amount),
            'expenses', SUM(expense_amount),
            'net_cashflow', SUM(income_amount) - SUM(expense_amount),
            'transaction_count', COUNT(*),
            'savings_rate', CASE 
                WHEN SUM(income_amount) > 0 
                THEN ((SUM(income_amount) - SUM(expense_amount)) / SUM(income_amount)) * 100
                ELSE 0 
            END
        )
    ) INTO result
    FROM cashflow_view
    WHERE user_id = user_uuid 
        AND month_start >= DATE_TRUNC('month', CURRENT_DATE - (months_back || ' months')::INTERVAL)
    GROUP BY year, month, month_start
    ORDER BY month_start;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get weekly patterns
CREATE OR REPLACE FUNCTION get_weekly_patterns(
    user_uuid UUID,
    weeks_back INTEGER DEFAULT 4
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'week', week_start,
            'week_number', week,
            'income', SUM(income_amount),
            'expenses', SUM(expense_amount),
            'net_cashflow', SUM(income_amount) - SUM(expense_amount),
            'transaction_count', COUNT(*),
            'daily_average', SUM(expense_amount) / 7
        )
    ) INTO result
    FROM cashflow_view
    WHERE user_id = user_uuid 
        AND week_start >= DATE_TRUNC('week', CURRENT_DATE - (weeks_back || ' weeks')::INTERVAL)
    GROUP BY week, week_start
    ORDER BY week_start;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get spending patterns by day of week
CREATE OR REPLACE FUNCTION get_day_of_week_patterns(
    user_uuid UUID,
    days_back INTEGER DEFAULT 90
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'day_of_week', day_of_week,
            'day_name', CASE day_of_week
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END,
            'total_spending', SUM(expense_amount),
            'transaction_count', COUNT(*),
            'average_spending', AVG(expense_amount)
        )
    ) INTO result
    FROM cashflow_view
    WHERE user_id = user_uuid 
        AND transaction_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        AND type = 'expense'
    GROUP BY day_of_week
    ORDER BY day_of_week;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
