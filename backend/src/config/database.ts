import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/**
 * Database configuration and client setup for CashPilot
 * Uses Supabase as the primary database with PostgreSQL
 */

class DatabaseManager {
  private client: SupabaseClient<Database>;
  private static instance: DatabaseManager;

  private constructor() {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_KEY environment variables.');
    }

    this.client = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getClient(): SupabaseClient<Database> {
    return this.client;
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Execute a database query with error handling
   */
  public async query<T = any>(
    queryFn: (client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: any }> {
    try {
      return await queryFn(this.client);
    } catch (error) {
      console.error('Database query error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(userId: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  }

  /**
   * Get user by email
   */
  public async getUserByEmail(email: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    return { data, error };
  }

  /**
   * Create a new user
   */
  public async createUser(userData: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }) {
    const { data, error } = await this.client
      .from('users')
      .insert([userData])
      .select()
      .single();

    return { data, error };
  }

  /**
   * Update user
   */
  public async updateUser(userId: string, updates: Partial<{
    fullName: string;
    avatarUrl: string;
  }>) {
    const { data, error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Get user transactions
   */
  public async getUserTransactions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      type?: 'income' | 'expense' | 'transfer';
    } = {}
  ) {
    let query = this.client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    if (options.startDate) {
      query = query.gte('transaction_date', options.startDate.toISOString().split('T')[0]);
    }

    if (options.endDate) {
      query = query.lte('transaction_date', options.endDate.toISOString().split('T')[0]);
    }

    if (options.type) {
      query = query.eq('type', options.type);
    }

    const { data, error } = await query;

    return { data, error };
  }

  /**
   * Get user integrations
   */
  public async getUserIntegrations(userId: string) {
    const { data, error } = await this.client
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    return { data, error };
  }

  /**
   * Get user insights
   */
  public async getUserInsights(
    userId: string,
    type?: 'daily' | 'weekly' | 'monthly',
    limit: number = 10
  ) {
    let query = this.client
      .from('insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    return { data, error };
  }

  /**
   * Get user subscription
   */
  public async getUserSubscription(userId: string) {
    const { data, error } = await this.client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { data, error };
  }

  /**
   * Execute raw SQL query (use with caution)
   */
  public async executeRawSQL(sql: string, params: any[] = []) {
    const { data, error } = await this.client.rpc('exec_sql', {
      sql_query: sql,
      params: params
    });

    return { data, error };
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance();

// Export client for direct access if needed
export const supabase = db.getClient();

// Export types for database schema
export type { Database } from './database.types';
