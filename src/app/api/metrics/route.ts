import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const metrics = {
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external,
        arrayBuffers: process.memoryUsage().arrayBuffers
      },
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    };
    
    return NextResponse.json(metrics);
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to collect metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
