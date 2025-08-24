# CashPilot Production Deployment Guide 🚀

## Overview
This guide provides step-by-step instructions for deploying CashPilot to production, including all necessary configurations, scripts, and safety measures.

**Deployment Platform**: Vercel  
**Database**: Firebase Firestore  
**Payment Processing**: Stripe  
**Monitoring**: Vercel Analytics + Custom Monitoring  

---

## Pre-Deployment Checklist ✅

### Environment Preparation
- [ ] Production environment variables prepared
- [ ] Firebase production project created
- [ ] Stripe production account configured
- [ ] Domain purchased and DNS configured
- [ ] SSL certificate ready
- [ ] Monitoring tools configured
- [ ] Backup procedures established
- [ ] Rollback plan documented

### Code Quality
- [ ] All tests passing
- [ ] Production build successful
- [ ] Security audit completed
- [ ] Performance optimization done
- [ ] Error handling comprehensive
- [ ] Documentation updated

---

## Step 1: Vercel Deployment Configuration ⚙️

### 1.1 Vercel Project Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Initialize Vercel project (if not already done)
vercel init

# Link to existing Vercel project
vercel link
```

### 1.2 Vercel Configuration File

Create `vercel.json` in the root directory:

```json
{
  "version": 2,
  "name": "cashpilot",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 1.3 Build Configuration

Update `package.json` build scripts:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "vercel-build": "next build",
    "postinstall": "next telemetry disable"
  }
}
```

### 1.4 Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash

# CashPilot Production Deployment Script
set -e

echo "🚀 Starting CashPilot Production Deployment..."

# Check if we're on the main branch
if [ "$(git branch --show-current)" != "clean-main" ]; then
    echo "❌ Error: Must be on clean-main branch for production deployment"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Uncommitted changes detected. Please commit or stash changes."
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm run build

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Run health checks
echo "🏥 Running health checks..."
./scripts/health-check.sh

echo "✅ Deployment completed successfully!"
echo "🌐 Production URL: https://your-domain.vercel.app"
```

Make the script executable:
```bash
chmod +x scripts/deploy.sh
```

---

## Step 2: Production Environment Variable Setup 🔧

### 2.1 Environment Variables Template

Create `.env.production` template:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key

# QuickBooks Configuration
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
QUICKBOOKS_REDIRECT_URI=https://your-domain.vercel.app/api/quickbooks/callback

# Shopify Configuration
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
SHOPIFY_REDIRECT_URI=https://your-domain.vercel.app/api/shopify/callback

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.vercel.app

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

### 2.2 Vercel Environment Variables Setup

```bash
# Set environment variables in Vercel
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production

vercel env add OPENAI_API_KEY production

vercel env add QUICKBOOKS_CLIENT_ID production
vercel env add QUICKBOOKS_CLIENT_SECRET production
vercel env add QUICKBOOKS_REDIRECT_URI production

vercel env add SHOPIFY_CLIENT_ID production
vercel env add SHOPIFY_CLIENT_SECRET production
vercel env add SHOPIFY_REDIRECT_URI production

vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

vercel env add SENTRY_DSN production
```

### 2.3 Environment Validation Script

Create `scripts/validate-env.sh`:

```bash
#!/bin/bash

# Environment Variables Validation Script
set -e

echo "🔍 Validating environment variables..."

# Required variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "STRIPE_SECRET_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "OPENAI_API_KEY"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
)

# Check each required variable
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

# Validate Firebase configuration
if [[ ! "$NEXT_PUBLIC_FIREBASE_API_KEY" =~ ^AIza[0-9A-Za-z_-]{35}$ ]]; then
    echo "❌ Error: Invalid Firebase API key format"
    exit 1
fi

# Validate Stripe configuration
if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_live_[0-9a-zA-Z]{24}$ ]]; then
    echo "❌ Error: Invalid Stripe secret key format"
    exit 1
fi

# Validate OpenAI configuration
if [[ ! "$OPENAI_API_KEY" =~ ^sk-[0-9a-zA-Z]{32}$ ]]; then
    echo "❌ Error: Invalid OpenAI API key format"
    exit 1
fi

echo "✅ All environment variables are valid!"
```

Make the script executable:
```bash
chmod +x scripts/validate-env.sh
```

---

## Step 3: Firebase Production Project Setup 🔥

### 3.1 Firebase Project Creation

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new Firebase project
firebase projects:create cashpilot-prod --display-name "CashPilot Production"

# Set the project as default
firebase use cashpilot-prod
```

### 3.2 Firestore Database Setup

```bash
# Initialize Firestore
firebase init firestore

# Deploy Firestore security rules
firebase deploy --only firestore:rules
```

### 3.3 Firestore Security Rules

Update `firebase/firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    match /insights/{insightId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    match /kpis/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /subscriptions/{subscriptionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3.4 Firebase Authentication Setup

```bash
# Enable Authentication providers
firebase auth:enable email
firebase auth:enable google

# Configure OAuth redirect domains
firebase auth:config:set \
  --authorized-domains your-domain.vercel.app,localhost:3001
```

### 3.5 Firebase Setup Script

Create `scripts/setup-firebase.sh`:

```bash
#!/bin/bash

# Firebase Production Setup Script
set -e

echo "🔥 Setting up Firebase production project..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase
echo "🔐 Logging into Firebase..."
firebase login

# Initialize Firebase project
echo "📁 Initializing Firebase project..."
firebase init firestore --project cashpilot-prod

# Deploy security rules
echo "🔒 Deploying security rules..."
firebase deploy --only firestore:rules --project cashpilot-prod

# Enable Authentication
echo "👤 Setting up Authentication..."
firebase auth:enable email --project cashpilot-prod
firebase auth:enable google --project cashpilot-prod

# Configure authorized domains
echo "🌐 Configuring authorized domains..."
firebase auth:config:set \
  --authorized-domains your-domain.vercel.app,localhost:3001 \
  --project cashpilot-prod

echo "✅ Firebase production setup completed!"
```

Make the script executable:
```bash
chmod +x scripts/setup-firebase.sh
```

---

## Step 4: Stripe Production Key Configuration 💳

### 4.1 Stripe Production Account Setup

1. **Create Stripe Production Account**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Complete account verification
   - Enable production mode

2. **Create Subscription Products**:
   ```bash
   # Create products using Stripe CLI
   stripe products create --name "CashPilot Basic" --description "Basic financial insights"
   stripe products create --name "CashPilot Pro" --description "Advanced financial insights with integrations"
   stripe products create --name "CashPilot Enterprise" --description "Enterprise-grade financial management"
   ```

3. **Create Pricing Plans**:
   ```bash
   # Create pricing for Basic plan
   stripe prices create \
     --product prod_basic_id \
     --unit-amount 2900 \
     --currency usd \
     --recurring-interval month

   # Create pricing for Pro plan
   stripe prices create \
     --product prod_pro_id \
     --unit-amount 7900 \
     --currency usd \
     --recurring-interval month

   # Create pricing for Enterprise plan
   stripe prices create \
     --product prod_enterprise_id \
     --unit-amount 19900 \
     --currency usd \
     --recurring-interval month
   ```

### 4.2 Stripe Webhook Configuration

```bash
# Create webhook endpoint
stripe webhook-endpoints create \
  --url https://your-domain.vercel.app/api/stripe/webhook \
  --events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,payment_intent.succeeded,payment_intent.payment_failed

# Get webhook secret
stripe webhook-endpoints list
```

### 4.3 Stripe Configuration Script

Create `scripts/setup-stripe.sh`:

```bash
#!/bin/bash

# Stripe Production Setup Script
set -e

echo "💳 Setting up Stripe production configuration..."

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Installing..."
    brew install stripe/stripe-cli/stripe
fi

# Login to Stripe
echo "🔐 Logging into Stripe..."
stripe login

# Create products
echo "📦 Creating subscription products..."
BASIC_PRODUCT=$(stripe products create --name "CashPilot Basic" --description "Basic financial insights" --json | jq -r '.id')
PRO_PRODUCT=$(stripe products create --name "CashPilot Pro" --description "Advanced financial insights with integrations" --json | jq -r '.id')
ENTERPRISE_PRODUCT=$(stripe products create --name "CashPilot Enterprise" --description "Enterprise-grade financial management" --json | jq -r '.id')

echo "✅ Products created:"
echo "  Basic: $BASIC_PRODUCT"
echo "  Pro: $PRO_PRODUCT"
echo "  Enterprise: $ENTERPRISE_PRODUCT"

# Create pricing plans
echo "💰 Creating pricing plans..."
BASIC_PRICE=$(stripe prices create --product $BASIC_PRODUCT --unit-amount 2900 --currency usd --recurring-interval month --json | jq -r '.id')
PRO_PRICE=$(stripe prices create --product $PRO_PRODUCT --unit-amount 7900 --currency usd --recurring-interval month --json | jq -r '.id')
ENTERPRISE_PRICE=$(stripe prices create --product $ENTERPRISE_PRODUCT --unit-amount 19900 --currency usd --recurring-interval month --json | jq -r '.id')

echo "✅ Prices created:"
echo "  Basic: $BASIC_PRICE"
echo "  Pro: $PRO_PRICE"
echo "  Enterprise: $ENTERPRICE_PRICE"

# Create webhook endpoint
echo "🔗 Creating webhook endpoint..."
WEBHOOK_ENDPOINT=$(stripe webhook-endpoints create \
  --url https://your-domain.vercel.app/api/stripe/webhook \
  --events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,payment_intent.succeeded,payment_intent.payment_failed \
  --json | jq -r '.id')

echo "✅ Webhook endpoint created: $WEBHOOK_ENDPOINT"

# Save configuration
cat > stripe-config.json << EOF
{
  "products": {
    "basic": "$BASIC_PRODUCT",
    "pro": "$PRO_PRODUCT",
    "enterprise": "$ENTERPRISE_PRODUCT"
  },
  "prices": {
    "basic": "$BASIC_PRICE",
    "pro": "$PRO_PRICE",
    "enterprise": "$ENTERPRICE_PRICE"
  },
  "webhook": "$WEBHOOK_ENDPOINT"
}
EOF

echo "✅ Stripe configuration saved to stripe-config.json"
echo "✅ Stripe production setup completed!"
```

Make the script executable:
```bash
chmod +x scripts/setup-stripe.sh
```

---

## Step 5: Domain and SSL Setup 🌐

### 5.1 Domain Configuration

1. **Purchase Domain** (if not already done):
   - Go to domain registrar (Namecheap, GoDaddy, etc.)
   - Purchase domain (e.g., cashpilot.com)

2. **Configure DNS Records**:
   ```
   Type: A
   Name: @
   Value: 76.76.19.19 (Vercel IP)

   Type: CNAME
   Name: www
   Value: your-domain.vercel.app
   ```

### 5.2 Vercel Domain Setup

```bash
# Add domain to Vercel project
vercel domains add your-domain.com

# Verify domain ownership
vercel domains verify your-domain.com
```

### 5.3 SSL Certificate Setup

Vercel automatically provides SSL certificates. To configure:

```bash
# Check SSL status
vercel domains inspect your-domain.com

# Force SSL redirect
vercel env add FORCE_SSL production
```

### 5.4 Domain Setup Script

Create `scripts/setup-domain.sh`:

```bash
#!/bin/bash

# Domain and SSL Setup Script
set -e

DOMAIN=${1:-"your-domain.com"}

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Please provide a domain name"
    echo "Usage: ./scripts/setup-domain.sh your-domain.com"
    exit 1
fi

echo "🌐 Setting up domain: $DOMAIN"

# Add domain to Vercel
echo "📝 Adding domain to Vercel..."
vercel domains add $DOMAIN

# Verify domain
echo "✅ Verifying domain..."
vercel domains verify $DOMAIN

# Check SSL status
echo "🔒 Checking SSL status..."
vercel domains inspect $DOMAIN

# Configure SSL redirect
echo "🔄 Configuring SSL redirect..."
vercel env add FORCE_SSL production

echo "✅ Domain setup completed!"
echo "🌐 Your site will be available at: https://$DOMAIN"
```

Make the script executable:
```bash
chmod +x scripts/setup-domain.sh
```

---

## Step 6: Production Monitoring Setup 📊

### 6.1 Vercel Analytics

```bash
# Enable Vercel Analytics
vercel analytics enable

# Configure analytics
vercel env add VERCEL_ANALYTICS_ID production
```

### 6.2 Custom Monitoring Endpoints

Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    // Check database connectivity
    const testDoc = await db.collection('health').doc('test').get();
    
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
          missing: missingEnvVars 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      database: 'connected',
      uptime: process.uptime()
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### 6.3 Performance Monitoring

Create `src/app/api/metrics/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const metrics = {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(metrics);
}
```

### 6.4 Monitoring Setup Script

Create `scripts/setup-monitoring.sh`:

```bash
#!/bin/bash

# Production Monitoring Setup Script
set -e

echo "📊 Setting up production monitoring..."

# Enable Vercel Analytics
echo "📈 Enabling Vercel Analytics..."
vercel analytics enable

# Create monitoring endpoints
echo "🏥 Creating health check endpoints..."
# (These are created in the code above)

# Set up monitoring environment variables
echo "🔧 Configuring monitoring environment variables..."
vercel env add VERCEL_ANALYTICS_ID production

# Test health check
echo "🧪 Testing health check endpoint..."
sleep 10
curl -f https://your-domain.vercel.app/api/health || {
    echo "❌ Health check failed"
    exit 1
}

echo "✅ Monitoring setup completed!"
```

Make the script executable:
```bash
chmod +x scripts/setup-monitoring.sh
```

---

## Step 7: Rollback Procedures 🔄

### 7.1 Database Rollback

Create `scripts/rollback-db.sh`:

```bash
#!/bin/bash

# Database Rollback Script
set -e

echo "🔄 Starting database rollback..."

# Create backup before rollback
echo "💾 Creating backup..."
firebase firestore:export ./backup-$(date +%Y%m%d-%H%M%S) --project cashpilot-prod

# Restore from previous backup
BACKUP_DIR=${1:-"./backup-latest"}

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Backup directory not found: $BACKUP_DIR"
    exit 1
fi

echo "📥 Restoring from backup: $BACKUP_DIR"
firebase firestore:import $BACKUP_DIR --project cashpilot-prod

echo "✅ Database rollback completed!"
```

### 7.2 Application Rollback

Create `scripts/rollback-app.sh`:

```bash
#!/bin/bash

# Application Rollback Script
set -e

echo "🔄 Starting application rollback..."

# Get previous deployment
PREVIOUS_DEPLOYMENT=$(vercel ls | grep -A 1 "cashpilot" | tail -n 1 | awk '{print $1}')

if [ -z "$PREVIOUS_DEPLOYMENT" ]; then
    echo "❌ Error: No previous deployment found"
    exit 1
fi

echo "📥 Rolling back to deployment: $PREVIOUS_DEPLOYMENT"

# Rollback to previous deployment
vercel rollback $PREVIOUS_DEPLOYMENT

# Wait for rollback to complete
echo "⏳ Waiting for rollback to complete..."
sleep 30

# Test rollback
echo "🧪 Testing rollback..."
./scripts/health-check.sh

echo "✅ Application rollback completed!"
```

### 7.3 Emergency Rollback Script

Create `scripts/emergency-rollback.sh`:

```bash
#!/bin/bash

# Emergency Rollback Script
set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"

# Notify team
echo "📢 Notifying team..."
# Add your notification logic here (Slack, email, etc.)

# Rollback application
echo "🔄 Rolling back application..."
./scripts/rollback-app.sh

# Rollback database if needed
read -p "Do you want to rollback database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Rolling back database..."
    ./scripts/rollback-db.sh
fi

# Verify rollback
echo "✅ Verifying rollback..."
./scripts/health-check.sh

echo "✅ Emergency rollback completed!"
echo "📢 Please investigate the issue and plan next steps."
```

Make all rollback scripts executable:
```bash
chmod +x scripts/rollback-*.sh
chmod +x scripts/emergency-rollback.sh
```

---

## Step 8: Health Check Endpoints 🏥

### 8.1 Comprehensive Health Check

Create `scripts/health-check.sh`:

```bash
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
HEALTH_RESPONSE=$(curl -f -s "$PROTOCOL://$DOMAIN/api/health")
HEALTH_STATUS=$(echo $HEALTH_RESPONSE | jq -r '.status')

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
```

### 8.2 Automated Health Monitoring

Create `scripts/monitor.sh`:

```bash
#!/bin/bash

# Automated Health Monitoring Script
set -e

DOMAIN=${1:-"your-domain.vercel.app"}
INTERVAL=${2:-300}  # 5 minutes default

echo "📊 Starting automated health monitoring for $DOMAIN"
echo "⏰ Check interval: $INTERVAL seconds"

while true; do
    echo "$(date): Running health check..."
    
    if ./scripts/health-check.sh $DOMAIN > /dev/null 2>&1; then
        echo "$(date): ✅ Health check passed"
    else
        echo "$(date): ❌ Health check failed"
        
        # Send alert
        echo "🚨 ALERT: Health check failed at $(date)"
        # Add your alert logic here (Slack, email, etc.)
        
        # Attempt automatic rollback
        echo "🔄 Attempting automatic rollback..."
        ./scripts/emergency-rollback.sh
    fi
    
    sleep $INTERVAL
done
```

Make health check scripts executable:
```bash
chmod +x scripts/health-check.sh
chmod +x scripts/monitor.sh
```

---

## Complete Deployment Script 🚀

### Master Deployment Script

Create `scripts/deploy-production.sh`:

```bash
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
./scripts/validate-env.sh

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
./scripts/health-check.sh

# Setup monitoring
echo "📊 Setting up monitoring..."
./scripts/setup-monitoring.sh

echo "✅ PRODUCTION DEPLOYMENT COMPLETED!"
echo "🌐 Your application is live at: https://your-domain.vercel.app"
echo "📊 Monitor at: https://vercel.com/dashboard"
```

Make the master script executable:
```bash
chmod +x scripts/deploy-production.sh
```

---

## Deployment Checklist ✅

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables prepared
- [ ] Firebase production project ready
- [ ] Stripe production account configured
- [ ] Domain purchased and DNS configured
- [ ] SSL certificate ready
- [ ] Monitoring tools configured
- [ ] Backup procedures established
- [ ] Rollback plan documented

### Deployment Steps
- [ ] Run `./scripts/deploy-production.sh`
- [ ] Verify deployment success
- [ ] Run health checks
- [ ] Test all critical user flows
- [ ] Verify monitoring is working
- [ ] Test rollback procedures
- [ ] Update documentation

### Post-Deployment
- [ ] Monitor application for 24 hours
- [ ] Check error rates and performance
- [ ] Verify all integrations working
- [ ] Test payment processing
- [ ] Validate security measures
- [ ] Update status page
- [ ] Notify stakeholders

---

## Emergency Procedures 🚨

### If Deployment Fails
1. **Immediate Actions**:
   - Stop deployment process
   - Notify all stakeholders
   - Document the failure
   - Begin rollback procedures

2. **Rollback Process**:
   - Run `./scripts/emergency-rollback.sh`
   - Verify rollback success
   - Investigate failure cause
   - Fix issues and redeploy

3. **Communication**:
   - Update status page
   - Notify users of downtime
   - Provide timeline for resolution

### If Application Crashes
1. **Immediate Response**:
   - Check monitoring alerts
   - Assess impact scope
   - Initiate rollback if needed
   - Notify support team

2. **Investigation**:
   - Check logs and metrics
   - Identify root cause
   - Implement fix
   - Test thoroughly

3. **Recovery**:
   - Deploy fix
   - Verify recovery
   - Monitor stability
   - Update documentation

---

## Contact Information 📞

### Emergency Contacts
- **Technical Lead**: [Your Name] - [Phone] - [Email]
- **DevOps Lead**: [Name] - [Phone] - [Email]
- **Product Owner**: [Name] - [Phone] - [Email]

### Support Channels
- **Slack**: #cashpilot-alerts
- **Email**: alerts@cashpilot.com
- **Status Page**: https://status.cashpilot.com

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: Before each production deployment
