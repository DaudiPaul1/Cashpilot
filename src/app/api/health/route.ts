import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    // Check database connectivity
    let databaseStatus = 'connected';
    try {
      const testDoc = await db.collection('health').doc('test').get();
    } catch (error) {
      databaseStatus = 'error';
      console.error('Database health check failed:', error);
    }
    
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'STRIPE_SECRET_KEY',
      'OPENAI_API_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing environment variables',
          missing: missingEnvVars,
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV,
          database: databaseStatus,
          uptime: process.uptime()
        },
        { status: 500 }
      );
    }
    
    // Check if database is healthy
    if (databaseStatus === 'error') {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV,
          database: databaseStatus,
          uptime: process.uptime()
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      database: databaseStatus,
      uptime: process.uptime(),
      checks: {
        environment: 'ok',
        database: databaseStatus,
        firebase: 'ok',
        stripe: 'ok',
        openai: 'ok'
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
      },
      { status: 500 }
    );
  }
}
