# Firebase Setup for CashPilot MVP

## 🚀 **Overview**

This document provides complete setup instructions for Firebase services in CashPilot, an AI-powered financial dashboard for small businesses.

## 📋 **Prerequisites**

- Firebase project created at [Firebase Console](https://console.firebase.google.com)
- Node.js 18+ and npm installed
- Git repository initialized

## 🔧 **Step 1: Firebase Project Setup**

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: `cashpilot-379ad`
4. Enable Google Analytics (optional)
5. Choose analytics account or create new one
6. Click "Create project"

### 1.2 Enable Firebase Services
In your Firebase project, enable the following services:

#### Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (optional)
4. Configure authorized domains:
   - Add `localhost` for development
   - Add your production domain

#### Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (we'll add security rules later)
4. Select location closest to your users
5. Click "Done"

#### Storage
1. Go to **Storage**
2. Click "Get started"
3. Choose **Start in test mode**
4. Select location
5. Click "Done"

#### Functions (Optional for MVP)
1. Go to **Functions**
2. Click "Get started"
3. Install Firebase CLI if prompted
4. Initialize functions

## 🔧 **Step 2: Environment Configuration**

### 2.1 Create Environment File
Create `.env.local` in your project root:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDNTCjH6NltXhvjzJfbe9UcocOVKoyteRo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cashpilot-379ad.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cashpilot-379ad
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cashpilot-379ad.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=823417759260
NEXT_PUBLIC_FIREBASE_APP_ID=1:823417759260:web:98e01f6a733800cc6ee1d9
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-F3BQJ5VP3R

# Development Settings
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
NODE_ENV=development

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Get Firebase Config
1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Add app** → **Web**
4. Register app with nickname "CashPilot Web"
5. Copy the configuration object
6. Update your `.env.local` with the actual values

## 🔧 **Step 3: Security Rules Setup**

### 3.1 Firestore Security Rules
1. Go to **Firestore Database** → **Rules**
2. Replace the default rules with the content from `firebase/firestore.rules`
3. Click "Publish"

### 3.2 Storage Security Rules
1. Go to **Storage** → **Rules**
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 🔧 **Step 4: Database Structure**

### 4.1 Firestore Collections
The following collections will be created automatically when users register:

#### `users/{userId}`
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  companyName: string,
  role: 'admin' | 'user',
  subscription: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise',
    status: 'active' | 'inactive' | 'cancelled' | 'past_due',
    startDate: timestamp,
    endDate: timestamp
  },
  integrations: {
    shopify: null | ShopifyIntegration,
    quickbooks: null | QuickBooksIntegration,
    plaid: null | PlaidIntegration
  },
  settings: {
    currency: 'USD' | 'EUR' | 'GBP' | 'CAD',
    timezone: string,
    notifications: {
      email: boolean,
      push: boolean
    }
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `transactions/{transactionId}`
```javascript
{
  userId: string,
  date: timestamp,
  amount: number,
  currency: string,
  description: string,
  category: string,
  type: 'income' | 'expense' | 'transfer',
  source: 'manual' | 'shopify' | 'quickbooks' | 'plaid',
  status: 'pending' | 'completed' | 'failed',
  tags: string[],
  attachments: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `kpis/{userId}`
```javascript
{
  accountsReceivable: number,
  accountsPayable: number,
  netCashFlow: number,
  cashRunway: number,
  lastUpdated: timestamp
}
```

#### `insights/{insightId}`
```javascript
{
  userId: string,
  type: 'health_score' | 'payment_reminder' | 'expense_optimization' | 'growth_opportunity',
  title: string,
  content: string,
  score: number,
  priority: 'low' | 'medium' | 'high' | 'critical',
  actionable: boolean,
  actionItems: ActionItem[],
  metadata: object,
  createdAt: timestamp,
  expiresAt: timestamp
}
```

## 🔧 **Step 5: Authentication Setup**

### 5.1 Enable Authentication Methods
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Configure settings:
   - Allow users to sign up
   - Require email verification (optional for MVP)
   - Allow password reset

### 5.2 Google OAuth (Optional)
1. Enable **Google** provider
2. Add authorized domains
3. Configure OAuth consent screen if needed

### 5.3 Authorized Domains
Add the following domains to **Authentication** → **Settings** → **Authorized domains**:
- `localhost` (for development)
- Your production domain

## 🔧 **Step 6: Testing Setup**

### 6.1 Test Authentication
1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/register`
3. Create a test account
4. Verify user appears in **Authentication** → **Users**

### 6.2 Test Firestore
1. Go to **Firestore Database** → **Data**
2. Verify user profile was created in `users` collection
3. Check that security rules are working

### 6.3 Test Real-time Updates
1. Use the dashboard to add transactions
2. Verify data appears in Firestore in real-time
3. Test data synchronization across browser tabs

## 🔧 **Step 7: Production Deployment**

### 7.1 Update Environment Variables
For production, update your environment variables with production Firebase config.

### 7.2 Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 7.3 Update Authorized Domains
Add your production domain to Firebase Authentication authorized domains.

## 🔧 **Step 8: Monitoring & Analytics**

### 8.1 Firebase Analytics
1. Go to **Analytics** → **Dashboard**
2. Monitor user engagement
3. Set up custom events for key actions

### 8.2 Error Monitoring
1. Go to **Crashlytics** (if enabled)
2. Monitor app crashes and errors
3. Set up alerts for critical issues

## 🔧 **Step 9: Security Best Practices**

### 9.1 Regular Security Audits
- Review security rules monthly
- Monitor authentication logs
- Check for suspicious activity

### 9.2 Data Backup
- Export Firestore data regularly
- Backup user files from Storage
- Document recovery procedures

### 9.3 Access Control
- Use least privilege principle
- Regularly review admin access
- Implement audit logging

## 🚨 **Troubleshooting**

### Common Issues

#### Authentication Errors
- Check authorized domains
- Verify API key is correct
- Ensure authentication is enabled

#### Firestore Permission Denied
- Check security rules
- Verify user is authenticated
- Check document ownership

#### Real-time Updates Not Working
- Check network connectivity
- Verify Firestore rules allow read access
- Check for JavaScript errors in console

### Getting Help
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Community](https://firebase.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

## 📚 **Next Steps**

1. **Enable Firebase Functions** for server-side processing
2. **Set up Firebase Hosting** for deployment
3. **Configure Firebase Performance Monitoring**
4. **Implement Firebase Cloud Messaging** for notifications
5. **Add Firebase App Check** for additional security

## 🔗 **Useful Links**

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
