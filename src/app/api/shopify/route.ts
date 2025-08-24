import { NextRequest, NextResponse } from 'next/server';
import { validateShopifyCredentials, syncShopifyData, ShopifyClient } from '@/lib/integrations/shopify';
import { auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { action, shopDomain, accessToken } = body;

    switch (action) {
      case 'validate':
        const validation = await validateShopifyCredentials(shopDomain, accessToken);
        return NextResponse.json(validation);

      case 'sync':
        if (!shopDomain || !accessToken) {
          return NextResponse.json({ error: 'Missing shop domain or access token' }, { status: 400 });
        }

        const client = new ShopifyClient(shopDomain, accessToken);
        const transactions = await syncShopifyData(client, userId);
        
        return NextResponse.json({
          success: true,
          transactions,
          count: transactions.length
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Shopify API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const shopDomain = searchParams.get('shopDomain');
    const accessToken = searchParams.get('accessToken');

    if (!shopDomain || !accessToken) {
      return NextResponse.json({ error: 'Missing shop domain or access token' }, { status: 400 });
    }

    // Validate credentials
    const validation = await validateShopifyCredentials(shopDomain, accessToken);
    
    if (!validation.isValid) {
      return NextResponse.json(validation, { status: 400 });
    }

    // Get shop info
    return NextResponse.json({
      success: true,
      shopInfo: validation.shopInfo
    });
  } catch (error) {
    console.error('Shopify API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
