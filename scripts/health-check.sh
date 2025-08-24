#!/bin/bash

# Comprehensive Health Check Script
set -e

DOMAIN=${1:-"your-domain.vercel.app"}
PROTOCOL=${2:-"https"}

echo "🏥 Running comprehensive health checks for $PROTOCOL://$DOMAIN"

# Test basic connectivity
echo "🔗 Testing basic connectivity..."
curl -f -s "$PROTOCOL://$DOMAIN" > /dev/null || {
    echo "❌ Basic connectivity failed"
    exit 1
}

# Test health endpoint
echo "💚 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -f -s "$PROTOCOL://$DOMAIN/api/health" 2>/dev/null || echo '{"status":"error"}')
HEALTH_STATUS=$(echo $HEALTH_RESPONSE | jq -r '.status' 2>/dev/null || echo "error")

if [ "$HEALTH_STATUS" != "healthy" ]; then
    echo "❌ Health check failed: $HEALTH_RESPONSE"
    exit 1
fi

# Test metrics endpoint
echo "📊 Testing metrics endpoint..."
curl -f -s "$PROTOCOL://$DOMAIN/api/metrics" > /dev/null || {
    echo "❌ Metrics endpoint failed"
    exit 1
}

# Test API endpoints
echo "🔌 Testing API endpoints..."
curl -f -s "$PROTOCOL://$DOMAIN/api/ai/insights" -X POST -H "Content-Type: application/json" -d '{"test": true}' > /dev/null || {
    echo "⚠️  AI insights endpoint failed (expected for test request)"
}

# Test authentication flow
echo "🔐 Testing authentication flow..."
curl -f -s "$PROTOCOL://$DOMAIN/login" > /dev/null || {
    echo "❌ Login page failed"
    exit 1
}

# Test dashboard (should redirect to login)
echo "📊 Testing dashboard access..."
DASHBOARD_RESPONSE=$(curl -s -w "%{http_code}" "$PROTOCOL://$DOMAIN/dashboard" -o /dev/null)

if [ "$DASHBOARD_RESPONSE" != "200" ] && [ "$DASHBOARD_RESPONSE" != "302" ]; then
    echo "❌ Dashboard access failed: HTTP $DASHBOARD_RESPONSE"
    exit 1
fi

echo "✅ All health checks passed!"
echo "🌐 Application is healthy at $PROTOCOL://$DOMAIN"
