"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const plaidLinkTokenSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid()
});
const plaidExchangeTokenSchema = zod_1.z.object({
    publicToken: zod_1.z.string(),
    metadata: zod_1.z.object({
        institution: zod_1.z.object({
            name: zod_1.z.string()
        }),
        accounts: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            mask: zod_1.z.string(),
            type: zod_1.z.string(),
            subtype: zod_1.z.string()
        }))
    })
});
const quickbooksAuthSchema = zod_1.z.object({
    code: zod_1.z.string(),
    realmId: zod_1.z.string()
});
const shopifyAuthSchema = zod_1.z.object({
    shop: zod_1.z.string(),
    code: zod_1.z.string()
});
router.get('/', auth_1.authenticate, (0, auth_1.rateLimit)(100, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const userId = req.user.id;
        const { data: integrations, error } = await database_1.db.getUserIntegrations(userId);
        if (error) {
            console.error('Database error getting integrations:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to load integrations'
            });
        }
        res.json({
            success: true,
            data: {
                integrations: integrations || []
            }
        });
    }
    catch (error) {
        console.error('Get integrations error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/plaid/link-token', auth_1.authenticate, (0, auth_1.rateLimit)(20, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        res.json({
            success: true,
            data: {
                linkToken: 'mock-link-token',
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            },
            message: 'Plaid link token created successfully'
        });
    }
    catch (error) {
        console.error('Create Plaid link token error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create Plaid link token'
        });
    }
});
router.post('/plaid/exchange-token', auth_1.authenticate, (0, auth_1.rateLimit)(10, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { publicToken, metadata } = plaidExchangeTokenSchema.parse(req.body);
        const userId = req.user.id;
        const { data: integration, error } = await database_1.db.query(async (client) => {
            return await client
                .from('integrations')
                .insert([{
                    user_id: userId,
                    provider: 'plaid',
                    access_token: 'mock-access-token',
                    metadata: {
                        institution: metadata.institution,
                        accounts: metadata.accounts,
                        publicToken
                    },
                    is_active: true
                }])
                .select()
                .single();
        });
        if (error) {
            console.error('Database error saving Plaid integration:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save integration'
            });
        }
        res.json({
            success: true,
            data: {
                integration,
                message: 'Plaid account connected successfully'
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: error.errors
            });
        }
        console.error('Exchange Plaid token error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect Plaid account'
        });
    }
});
router.post('/quickbooks/auth', auth_1.authenticate, (0, auth_1.rateLimit)(10, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { code, realmId } = quickbooksAuthSchema.parse(req.body);
        const userId = req.user.id;
        const { data: integration, error } = await database_1.db.query(async (client) => {
            return await client
                .from('integrations')
                .insert([{
                    user_id: userId,
                    provider: 'quickbooks',
                    access_token: 'mock-access-token',
                    refresh_token: 'mock-refresh-token',
                    metadata: {
                        realmId,
                        companyName: 'Mock Company'
                    },
                    is_active: true
                }])
                .select()
                .single();
        });
        if (error) {
            console.error('Database error saving QuickBooks integration:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save integration'
            });
        }
        res.json({
            success: true,
            data: {
                integration,
                message: 'QuickBooks connected successfully'
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: error.errors
            });
        }
        console.error('QuickBooks auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect QuickBooks'
        });
    }
});
router.post('/shopify/auth', auth_1.authenticate, (0, auth_1.rateLimit)(10, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { shop, code } = shopifyAuthSchema.parse(req.body);
        const userId = req.user.id;
        const { data: integration, error } = await database_1.db.query(async (client) => {
            return await client
                .from('integrations')
                .insert([{
                    user_id: userId,
                    provider: 'shopify',
                    access_token: 'mock-access-token',
                    metadata: {
                        shop,
                        shopName: 'Mock Shopify Store'
                    },
                    is_active: true
                }])
                .select()
                .single();
        });
        if (error) {
            console.error('Database error saving Shopify integration:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save integration'
            });
        }
        res.json({
            success: true,
            data: {
                integration,
                message: 'Shopify connected successfully'
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: error.errors
            });
        }
        console.error('Shopify auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect Shopify'
        });
    }
});
router.delete('/:id', auth_1.authenticate, (0, auth_1.rateLimit)(20, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { id } = req.params;
        const userId = req.user.id;
        const { data: integration, error: fetchError } = await database_1.db.query(async (client) => {
            return await client
                .from('integrations')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();
        });
        if (fetchError || !integration) {
            return res.status(404).json({
                success: false,
                error: 'Integration not found'
            });
        }
        const { error: updateError } = await database_1.db.query(async (client) => {
            return await client
                .from('integrations')
                .update({ is_active: false })
                .eq('id', id)
                .eq('user_id', userId);
        });
        if (updateError) {
            console.error('Database error deactivating integration:', updateError);
            return res.status(500).json({
                success: false,
                error: 'Failed to disconnect integration'
            });
        }
        res.json({
            success: true,
            message: 'Integration disconnected successfully'
        });
    }
    catch (error) {
        console.error('Disconnect integration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/:id/sync', auth_1.authenticate, (0, auth_1.rateLimit)(10, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { id } = req.params;
        const userId = req.user.id;
        const { data: integration, error: fetchError } = await database_1.db.query(async (client) => {
            return await client
                .from('integrations')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();
        });
        if (fetchError || !integration) {
            return res.status(404).json({
                success: false,
                error: 'Active integration not found'
            });
        }
        res.json({
            success: true,
            data: {
                syncedAt: new Date().toISOString(),
                recordsSynced: 0
            },
            message: 'Data sync initiated successfully'
        });
    }
    catch (error) {
        console.error('Sync integration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/:id/status', auth_1.authenticate, (0, auth_1.rateLimit)(50, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { id } = req.params;
        const userId = req.user.id;
        const { data: integration, error } = await database_1.db.query(async (client) => {
            return await client
                .from('integrations')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();
        });
        if (error || !integration) {
            return res.status(404).json({
                success: false,
                error: 'Integration not found'
            });
        }
        res.json({
            success: true,
            data: {
                integration,
                status: 'healthy',
                lastSync: integration.updated_at,
                nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
            }
        });
    }
    catch (error) {
        console.error('Get integration status error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=integrations.js.map