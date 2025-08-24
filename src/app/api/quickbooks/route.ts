import { NextRequest, NextResponse } from 'next/server';
import { validateQuickBooksCredentials, syncQuickBooksData, QuickBooksClient } from '@/lib/integrations/quickbooks';
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
    const { action, realmId, accessToken } = body;

    switch (action) {
      case 'validate':
        const validation = await validateQuickBooksCredentials(realmId, accessToken);
        return NextResponse.json(validation);

      case 'sync':
        if (!realmId || !accessToken) {
          return NextResponse.json({ error: 'Missing realm ID or access token' }, { status: 400 });
        }

        const client = new QuickBooksClient(realmId, accessToken);
        const transactions = await syncQuickBooksData(client, userId);
        
        return NextResponse.json({
          success: true,
          transactions,
          count: transactions.length
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('QuickBooks API error:', error);
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
    const realmId = searchParams.get('realmId');
    const accessToken = searchParams.get('accessToken');

    if (!realmId || !accessToken) {
      return NextResponse.json({ error: 'Missing realm ID or access token' }, { status: 400 });
    }

    // Validate credentials
    const validation = await validateQuickBooksCredentials(realmId, accessToken);
    
    if (!validation.isValid) {
      return NextResponse.json(validation, { status: 400 });
    }

    // Get company info
    return NextResponse.json({
      success: true,
      companyInfo: validation.companyInfo
    });
  } catch (error) {
    console.error('QuickBooks API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
