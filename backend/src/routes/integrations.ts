import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { authenticate, rateLimit } from '../middleware/auth';

const router = Router();

// Validation schemas
const plaidLinkTokenSchema = z.object({
  userId: z.string().uuid()
});

const plaidExchangeTokenSchema = z.object({
  publicToken: z.string(),
  metadata: z.object({
    institution: z.object({
      name: z.string()
    }),
    accounts: z.array(z.object({
      id: z.string(),
      name: z.string(),
      mask: z.string(),
      type: z.string(),
      subtype: z.string()
    }))
  })
});

const quickbooksAuthSchema = z.object({
  code: z.string(),
  realmId: z.string()
});

const shopifyAuthSchema = z.object({
  shop: z.string(),
  code: z.string()
});

/**
 * @route   GET /api/integrations
 * @desc    Get user's connected integrations
 * @access  Private
 */
router.get('/', authenticate, rateLimit(100, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const { data: integrations, error } = await db.getUserIntegrations(userId);

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
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/integrations/plaid/link-token
 * @desc    Create Plaid link token for account connection
 * @access  Private
 */
router.post('/plaid/link-token', authenticate, rateLimit(20, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // TODO: Implement Plaid link token creation
    // This would require the Plaid SDK and proper configuration
    
    res.json({
      success: true,
      data: {
        linkToken: 'mock-link-token',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      },
      message: 'Plaid link token created successfully'
    });
  } catch (error) {
    console.error('Create Plaid link token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Plaid link token'
    });
  }
});

/**
 * @route   POST /api/integrations/plaid/exchange-token
 * @desc    Exchange Plaid public token for access token
 * @access  Private
 */
router.post('/plaid/exchange-token', authenticate, rateLimit(10, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { publicToken, metadata } = plaidExchangeTokenSchema.parse(req.body);
    const userId = req.user.id;

    // TODO: Implement Plaid token exchange
    // This would exchange the public token for an access token

    // Save integration to database
    const { data: integration, error } = await db.query(async (client) => {
      return await client
        .from('integrations')
        .insert([{
          user_id: userId,
          provider: 'plaid',
          access_token: 'mock-access-token', // This would be the real access token
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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

/**
 * @route   POST /api/integrations/quickbooks/auth
 * @desc    Authenticate with QuickBooks
 * @access  Private
 */
router.post('/quickbooks/auth', authenticate, rateLimit(10, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { code, realmId } = quickbooksAuthSchema.parse(req.body);
    const userId = req.user.id;

    // TODO: Implement QuickBooks OAuth token exchange
    // This would exchange the authorization code for access and refresh tokens

    // Save integration to database
    const { data: integration, error } = await db.query(async (client) => {
      return await client
        .from('integrations')
        .insert([{
          user_id: userId,
          provider: 'quickbooks',
          access_token: 'mock-access-token', // This would be the real access token
          refresh_token: 'mock-refresh-token', // This would be the real refresh token
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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

/**
 * @route   POST /api/integrations/shopify/auth
 * @desc    Authenticate with Shopify
 * @access  Private
 */
router.post('/shopify/auth', authenticate, rateLimit(10, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { shop, code } = shopifyAuthSchema.parse(req.body);
    const userId = req.user.id;

    // TODO: Implement Shopify OAuth token exchange
    // This would exchange the authorization code for access token

    // Save integration to database
    const { data: integration, error } = await db.query(async (client) => {
      return await client
        .from('integrations')
        .insert([{
          user_id: userId,
          provider: 'shopify',
          access_token: 'mock-access-token', // This would be the real access token
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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

/**
 * @route   DELETE /api/integrations/:id
 * @desc    Disconnect an integration
 * @access  Private
 */
router.delete('/:id', authenticate, rateLimit(20, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Verify the integration belongs to the user
    const { data: integration, error: fetchError } = await db.query(async (client) => {
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

    // Deactivate the integration
    const { error: updateError } = await db.query(async (client) => {
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
  } catch (error) {
    console.error('Disconnect integration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/integrations/:id/sync
 * @desc    Manually sync data from an integration
 * @access  Private
 */
router.post('/:id/sync', authenticate, rateLimit(10, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Verify the integration belongs to the user and is active
    const { data: integration, error: fetchError } = await db.query(async (client) => {
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

    // TODO: Implement data sync based on provider
    // This would fetch and store transactions from the connected account

    res.json({
      success: true,
      data: {
        syncedAt: new Date().toISOString(),
        recordsSynced: 0 // This would be the actual count
      },
      message: 'Data sync initiated successfully'
    });
  } catch (error) {
    console.error('Sync integration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/integrations/:id/status
 * @desc    Get integration status and health
 * @access  Private
 */
router.get('/:id/status', authenticate, rateLimit(50, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Get integration details
    const { data: integration, error } = await db.query(async (client) => {
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

    // TODO: Check integration health (token validity, API connectivity, etc.)

    res.json({
      success: true,
      data: {
        integration,
        status: 'healthy', // This would be determined by health checks
        lastSync: integration.updated_at,
        nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now
      }
    });
  } catch (error) {
    console.error('Get integration status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
