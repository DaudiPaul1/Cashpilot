# Firestore Setup Guide

## Current Issue
The application is showing Firestore permission errors because the Firestore database and security rules are not properly configured.

## Quick Fix (For Development)
The application now handles Firestore permission errors gracefully and will show empty data instead of crashing.

## Complete Setup (For Production)

### 1. Create Firestore Database
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Firestore Database" in the left sidebar
4. Click "Create Database"
5. Choose "Start in test mode" (we'll secure it later)
6. Select a location close to your users
7. Click "Done"

### 2. Set Up Security Rules
1. In Firestore Database, go to "Rules" tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /transactions/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    match /insights/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    match /kpis/{document} {
      allow read, write: if request.auth != null && request.auth.uid == document;
    }
    
    match /users/{document} {
      allow read, write: if request.auth != null && request.auth.uid == document;
    }
  }
}
```

3. Click "Publish"

### 3. Create Initial Collections
The application will automatically create the necessary collections when users start using it:
- `transactions` - User transaction data
- `insights` - AI-generated insights
- `kpis` - Key performance indicators
- `users` - User profile data

### 4. Test the Setup
1. Restart your development server
2. Log in to the application
3. Try adding a transaction
4. Check the Firestore console to see if data is being created

## Troubleshooting

### Permission Denied Errors
- Make sure you're logged in to the application
- Check that the security rules are published
- Verify the user ID matches between auth and Firestore

### Database Not Found
- Ensure Firestore is created in the same project as your Firebase Auth
- Check that the project ID in your `.env.local` matches your Firebase project

### Real-time Updates Not Working
- Check the browser console for any Firestore errors
- Verify that the security rules allow read access
- Make sure the user is authenticated

## Development vs Production
- **Development**: The app will work with empty data if Firestore is not set up
- **Production**: You must set up Firestore properly for full functionality

