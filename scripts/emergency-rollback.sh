#!/bin/bash

# Emergency Rollback Script
set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "==============================="

# Notify team
echo "📢 Notifying team..."
# Add your notification logic here (Slack, email, etc.)
# Example: curl -X POST -H 'Content-type: application/json' --data '{"text":"🚨 Emergency rollback initiated for CashPilot"}' $SLACK_WEBHOOK_URL

# Rollback application
echo "🔄 Rolling back application..."
if [ -f "./scripts/rollback-app.sh" ]; then
    ./scripts/rollback-app.sh
else
    echo "⚠️  Application rollback script not found, attempting manual rollback..."
    # Manual rollback logic
    PREVIOUS_DEPLOYMENT=$(vercel ls | grep -A 1 "cashpilot" | tail -n 1 | awk '{print $1}' 2>/dev/null || echo "")
    if [ -n "$PREVIOUS_DEPLOYMENT" ]; then
        echo "📥 Rolling back to deployment: $PREVIOUS_DEPLOYMENT"
        vercel rollback $PREVIOUS_DEPLOYMENT
    else
        echo "❌ No previous deployment found for rollback"
    fi
fi

# Rollback database if needed
read -p "Do you want to rollback database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Rolling back database..."
    if [ -f "./scripts/rollback-db.sh" ]; then
        ./scripts/rollback-db.sh
    else
        echo "⚠️  Database rollback script not found"
    fi
fi

# Verify rollback
echo "✅ Verifying rollback..."
if [ -f "./scripts/health-check.sh" ]; then
    ./scripts/health-check.sh
else
    echo "⚠️  Health check script not found, manual verification required"
fi

echo "✅ Emergency rollback completed!"
echo "📢 Please investigate the issue and plan next steps."
echo "📞 Contact the technical team immediately."
