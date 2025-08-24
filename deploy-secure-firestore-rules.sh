#!/bin/bash

# Deploy Secure Firestore Security Rules for CashPilot
echo "🔒 Deploying Secure Firestore Security Rules for CashPilot..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed.${NC}"
    echo -e "${YELLOW}Please install it first:${NC}"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
echo -e "${BLUE}🔍 Checking Firebase authentication...${NC}"
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Firebase.${NC}"
    echo -e "${YELLOW}Please login first:${NC}"
    echo "firebase login"
    exit 1
fi

# Check if firebase.json exists, if not create it
if [ ! -f "firebase.json" ]; then
    echo -e "${YELLOW}⚠️  firebase.json not found. Creating basic configuration...${NC}"
    cat > firebase.json << EOF
{
  "firestore": {
    "rules": "firebase/firestore.rules",
    "indexes": "firebase/firestore.indexes.json"
  }
}
EOF
    echo -e "${GREEN}✅ Created firebase.json${NC}"
fi

# Check if firestore.indexes.json exists, if not create it
if [ ! -f "firebase/firestore.indexes.json" ]; then
    echo -e "${YELLOW}⚠️  firestore.indexes.json not found. Creating basic indexes...${NC}"
    mkdir -p firebase
    cat > firebase/firestore.indexes.json << EOF
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "insights",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "integrations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "provider",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF
    echo -e "${GREEN}✅ Created firestore.indexes.json${NC}"
fi

# Validate the rules file exists
if [ ! -f "firebase/firestore.rules" ]; then
    echo -e "${RED}❌ firebase/firestore.rules not found!${NC}"
    exit 1
fi

# Show current project
echo -e "${BLUE}📋 Current Firebase project:${NC}"
firebase projects:list --filter="projectId:$(firebase use --json | jq -r '.current')"

# Confirm deployment
echo -e "${YELLOW}⚠️  WARNING: These rules implement strict security for financial data.${NC}"
echo -e "${YELLOW}   - All operations require authentication${NC}"
echo -e "${YELLOW}   - Users can only access their own data${NC}"
echo -e "${YELLOW}   - Financial data requires active subscription${NC}"
echo -e "${YELLOW}   - OAuth tokens are protected${NC}"
echo ""
read -p "Do you want to deploy these secure rules? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Deploy Firestore rules
echo -e "${BLUE}🚀 Deploying Firestore security rules...${NC}"
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Firestore security rules deployed successfully!${NC}"
    echo ""
    echo -e "${BLUE}🔒 Security Features Implemented:${NC}"
    echo -e "   • Authentication required for all operations"
    echo -e "   • User data isolation (users can only access their own data)"
    echo -e "   • Subscription-based access control"
    echo -e "   • Data validation for all collections"
    echo -e "   • OAuth token protection"
    echo -e "   • Admin-only system access"
    echo -e "   • Rate limiting framework"
    echo -e "   • Audit trail protection"
    echo ""
    echo -e "${YELLOW}🔄 Please restart your development server and test authentication.${NC}"
    echo -e "${YELLOW}📝 Note: Users will need active subscriptions to access financial data.${NC}"
else
    echo -e "${RED}❌ Failed to deploy Firestore rules.${NC}"
    echo -e "${YELLOW}Please check your Firebase configuration and try again.${NC}"
    exit 1
fi
