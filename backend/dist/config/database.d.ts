import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
declare class DatabaseManager {
    private client;
    private static instance;
    private constructor();
    static getInstance(): DatabaseManager;
    getClient(): SupabaseClient<Database>;
    testConnection(): Promise<boolean>;
    query<T = any>(queryFn: (client: SupabaseClient<Database>) => Promise<{
        data: T | null;
        error: any;
    }>): Promise<{
        data: T | null;
        error: any;
    }>;
    getUserById(userId: string): Promise<{
        data: {
            id: string;
            email: string;
            full_name: string | null;
            avatar_url: string | null;
            created_at: string;
            updated_at: string;
        } | null;
        error: import("@supabase/supabase-js").PostgrestError | null;
    }>;
    getUserByEmail(email: string): Promise<{
        data: {
            id: string;
            email: string;
            full_name: string | null;
            avatar_url: string | null;
            created_at: string;
            updated_at: string;
        } | null;
        error: import("@supabase/supabase-js").PostgrestError | null;
    }>;
    createUser(userData: {
        id: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
    }): Promise<{
        data: {
            id: string;
            email: string;
            full_name: string | null;
            avatar_url: string | null;
            created_at: string;
            updated_at: string;
        } | null;
        error: import("@supabase/supabase-js").PostgrestError | null;
    }>;
    updateUser(userId: string, updates: Partial<{
        fullName: string;
        avatarUrl: string;
    }>): Promise<{
        data: {
            id: string;
            email: string;
            full_name: string | null;
            avatar_url: string | null;
            created_at: string;
            updated_at: string;
        } | null;
        error: import("@supabase/supabase-js").PostgrestError | null;
    }>;
    getUserTransactions(userId: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
        type?: 'income' | 'expense' | 'transfer';
    }): Promise<{
        data: {
            id: string;
            user_id: string;
            integration_id: string | null;
            external_id: string | null;
            amount: number;
            currency: string;
            description: string;
            category: string;
            transaction_date: string;
            type: string;
            metadata: import("./database.types").Json | null;
            created_at: string;
        }[] | null;
        error: import("@supabase/supabase-js").PostgrestError | null;
    }>;
    getUserIntegrations(userId: string): Promise<{
        data: {
            id: string;
            user_id: string;
            provider: string;
            access_token: string;
            refresh_token: string | null;
            expires_at: string | null;
            metadata: import("./database.types").Json | null;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        }[] | null;
        error: import("@supabase/supabase-js").PostgrestError | null;
    }>;
    getUserInsights(userId: string, type?: 'daily' | 'weekly' | 'monthly', limit?: number): Promise<{
        data: {
            id: string;
            user_id: string;
            type: string;
            title: string;
            content: string;
            score: number | null;
            metadata: import("./database.types").Json | null;
            created_at: string;
        }[] | null;
        error: import("@supabase/supabase-js").PostgrestError | null;
    }>;
    getUserSubscription(userId: string): Promise<{
        data: {
            id: string;
            user_id: string;
            stripe_customer_id: string | null;
            stripe_subscription_id: string | null;
            status: string;
            current_period_start: string | null;
            current_period_end: string | null;
            cancel_at_period_end: boolean;
            canceled_at: string | null;
            last_payment_date: string | null;
            last_payment_failed: string | null;
            created_at: string;
            updated_at: string;
        } | null;
        error: import("@supabase/supabase-js").PostgrestError | null;
    }>;
    executeRawSQL(sql: string, params?: any[]): Promise<{
        data: unknown;
        error: import("@supabase/supabase-js").PostgrestError | null;
    }>;
}
export declare const db: DatabaseManager;
export declare const supabase: SupabaseClient<Database, "public", {
    Tables: {
        users: {
            Row: {
                id: string;
                email: string;
                full_name: string | null;
                avatar_url: string | null;
                created_at: string;
                updated_at: string;
            };
            Insert: {
                id?: string;
                email: string;
                full_name?: string | null;
                avatar_url?: string | null;
                created_at?: string;
                updated_at?: string;
            };
            Update: {
                id?: string;
                email?: string;
                full_name?: string | null;
                avatar_url?: string | null;
                created_at?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        integrations: {
            Row: {
                id: string;
                user_id: string;
                provider: string;
                access_token: string;
                refresh_token: string | null;
                expires_at: string | null;
                metadata: import("./database.types").Json | null;
                is_active: boolean;
                created_at: string;
                updated_at: string;
            };
            Insert: {
                id?: string;
                user_id: string;
                provider: string;
                access_token: string;
                refresh_token?: string | null;
                expires_at?: string | null;
                metadata?: import("./database.types").Json | null;
                is_active?: boolean;
                created_at?: string;
                updated_at?: string;
            };
            Update: {
                id?: string;
                user_id?: string;
                provider?: string;
                access_token?: string;
                refresh_token?: string | null;
                expires_at?: string | null;
                metadata?: import("./database.types").Json | null;
                is_active?: boolean;
                created_at?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "integrations_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        transactions: {
            Row: {
                id: string;
                user_id: string;
                integration_id: string | null;
                external_id: string | null;
                amount: number;
                currency: string;
                description: string;
                category: string;
                transaction_date: string;
                type: string;
                metadata: import("./database.types").Json | null;
                created_at: string;
            };
            Insert: {
                id?: string;
                user_id: string;
                integration_id?: string | null;
                external_id?: string | null;
                amount: number;
                currency?: string;
                description: string;
                category: string;
                transaction_date: string;
                type: string;
                metadata?: import("./database.types").Json | null;
                created_at?: string;
            };
            Update: {
                id?: string;
                user_id?: string;
                integration_id?: string | null;
                external_id?: string | null;
                amount?: number;
                currency?: string;
                description?: string;
                category?: string;
                transaction_date?: string;
                type?: string;
                metadata?: import("./database.types").Json | null;
                created_at?: string;
            };
            Relationships: [{
                foreignKeyName: "transactions_integration_id_fkey";
                columns: ["integration_id"];
                isOneToOne: false;
                referencedRelation: "integrations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "transactions_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        insights: {
            Row: {
                id: string;
                user_id: string;
                type: string;
                title: string;
                content: string;
                score: number | null;
                metadata: import("./database.types").Json | null;
                created_at: string;
            };
            Insert: {
                id?: string;
                user_id: string;
                type: string;
                title: string;
                content: string;
                score?: number | null;
                metadata?: import("./database.types").Json | null;
                created_at?: string;
            };
            Update: {
                id?: string;
                user_id?: string;
                type?: string;
                title?: string;
                content?: string;
                score?: number | null;
                metadata?: import("./database.types").Json | null;
                created_at?: string;
            };
            Relationships: [{
                foreignKeyName: "insights_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        scores: {
            Row: {
                id: string;
                user_id: string;
                period: string;
                score: number;
                metrics: import("./database.types").Json;
                created_at: string;
            };
            Insert: {
                id?: string;
                user_id: string;
                period: string;
                score: number;
                metrics: import("./database.types").Json;
                created_at?: string;
            };
            Update: {
                id?: string;
                user_id?: string;
                period?: string;
                score?: number;
                metrics?: import("./database.types").Json;
                created_at?: string;
            };
            Relationships: [{
                foreignKeyName: "scores_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
        subscriptions: {
            Row: {
                id: string;
                user_id: string;
                stripe_customer_id: string | null;
                stripe_subscription_id: string | null;
                status: string;
                current_period_start: string | null;
                current_period_end: string | null;
                cancel_at_period_end: boolean;
                canceled_at: string | null;
                last_payment_date: string | null;
                last_payment_failed: string | null;
                created_at: string;
                updated_at: string;
            };
            Insert: {
                id?: string;
                user_id: string;
                stripe_customer_id?: string | null;
                stripe_subscription_id?: string | null;
                status?: string;
                current_period_start?: string | null;
                current_period_end?: string | null;
                cancel_at_period_end?: boolean;
                canceled_at?: string | null;
                last_payment_date?: string | null;
                last_payment_failed?: string | null;
                created_at?: string;
                updated_at?: string;
            };
            Update: {
                id?: string;
                user_id?: string;
                stripe_customer_id?: string | null;
                stripe_subscription_id?: string | null;
                status?: string;
                current_period_start?: string | null;
                current_period_end?: string | null;
                cancel_at_period_end?: boolean;
                canceled_at?: string | null;
                last_payment_date?: string | null;
                last_payment_failed?: string | null;
                created_at?: string;
                updated_at?: string;
            };
            Relationships: [{
                foreignKeyName: "subscriptions_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
    };
    Views: {
        cashflow_view: {
            Row: {
                user_id: string | null;
                date: string | null;
                total_income: number | null;
                total_expenses: number | null;
                net_cashflow: number | null;
            };
            Relationships: [{
                foreignKeyName: "cashflow_view_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "users";
                referencedColumns: ["id"];
            }];
        };
    };
    Functions: {
        calculate_financial_health_score: {
            Args: {
                user_uuid: string;
            };
            Returns: number;
        };
        get_income_breakdown: {
            Args: {
                user_uuid: string;
                days_back: number;
            };
            Returns: import("./database.types").Json;
        };
        get_spending_breakdown: {
            Args: {
                user_uuid: string;
                days_back: number;
            };
            Returns: import("./database.types").Json;
        };
        get_user_dashboard_data: {
            Args: {
                user_uuid: string;
                days_back: number;
            };
            Returns: import("./database.types").Json;
        };
        update_updated_at_column: {
            Args: Record<PropertyKey, never>;
            Returns: unknown;
        };
    };
    Enums: { [_ in never]: never; };
    CompositeTypes: { [_ in never]: never; };
}>;
export type { Database } from './database.types';
//# sourceMappingURL=database.d.ts.map