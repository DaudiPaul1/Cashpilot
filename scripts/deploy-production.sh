#!/bin/bash

# Complete Production Deployment Script
set -e

echo "🚀 CASHPILOT PRODUCTION DEPLOYMENT"
echo "=================================="

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Uncommitted changes detected"
    exit 1
fi

# Check branch
if [ "$(git branch --show-current)" != "clean-main" ]; then
    echo "❌ Error: Must be on clean-main branch"
    exit 1
fi

# Validate environment
echo "🔧 Validating environment..."
if [ -f "./scripts/validate-env.sh" ]; then
    ./scripts/validate-env.sh
else
    echo "⚠️  Environment validation script not found, skipping..."
fi

# Run tests
echo "🧪 Running tests..."
npm run build

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
sleep 60

# Run health checks
echo "🏥 Running health checks..."
if [ -f "./scripts/health-check.sh" ]; then
    ./scripts/health-check.sh
else
    echo "⚠️  Health check script not found, skipping..."
fi

# Setup monitoring
echo "📊 Setting up monitoring..."
if [ -f "./scripts/setup-monitoring.sh" ]; then
    ./scripts/setup-monitoring.sh
else
    echo "⚠️  Monitoring setup script not found, skipping..."
fi

echo "✅ PRODUCTION DEPLOYMENT COMPLETED!"
echo "🌐 Your application is live at: https://your-domain.vercel.app"
echo "📊 Monitor at: https://vercel.com/dashboard"
