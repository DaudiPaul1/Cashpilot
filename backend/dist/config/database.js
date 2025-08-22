"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.db = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class DatabaseManager {
    constructor() {
        const supabaseUrl = process.env['SUPABASE_URL'];
        const supabaseKey = process.env['SUPABASE_KEY'];
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_KEY environment variables.');
        }
        this.client = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            db: {
                schema: 'public'
            }
        });
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    getClient() {
        return this.client;
    }
    async testConnection() {
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
        }
        catch (error) {
            console.error('❌ Database connection test failed:', error);
            return false;
        }
    }
    async query(queryFn) {
        try {
            return await queryFn(this.client);
        }
        catch (error) {
            console.error('Database query error:', error);
            return { data: null, error };
        }
    }
    async getUserById(userId) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    }
    async getUserByEmail(email) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        return { data, error };
    }
    async createUser(userData) {
        const { data, error } = await this.client
            .from('users')
            .insert([userData])
            .select()
            .single();
        return { data, error };
    }
    async updateUser(userId, updates) {
        const { data, error } = await this.client
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        return { data, error };
    }
    async getUserTransactions(userId, options = {}) {
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
    async getUserIntegrations(userId) {
        const { data, error } = await this.client
            .from('integrations')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);
        return { data, error };
    }
    async getUserInsights(userId, type, limit = 10) {
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
    async getUserSubscription(userId) {
        const { data, error } = await this.client
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();
        return { data, error };
    }
    async executeRawSQL(sql, params = []) {
        const { data, error } = await this.client.rpc('exec_sql', {
            sql_query: sql,
            params: params
        });
        return { data, error };
    }
}
exports.db = DatabaseManager.getInstance();
exports.supabase = exports.db.getClient();
//# sourceMappingURL=database.js.map