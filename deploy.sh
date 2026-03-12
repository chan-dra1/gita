#!/bin/bash

# Bhagavad Gita App - Deploy Script
# This script deploys the app to GitHub and Vercel

set -e

echo "🚀 Deploying Bhagavad Gita App..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check git
echo -e "${YELLOW}Step 1: Checking Git...${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓ Git repository found${NC}"
else
    echo -e "${RED}✗ Not a git repository${NC}"
    exit 1
fi

# Step 2: Add remote if not exists
echo ""
echo -e "${YELLOW}Step 2: Setting up GitHub remote...${NC}"
if git remote | grep -q "origin"; then
    echo -e "${GREEN}✓ Remote already configured${NC}"
    git remote -v
else
    git remote add origin https://github.com/chan-dra1/gita.git
    echo -e "${GREEN}✓ Added GitHub remote${NC}"
fi

# Step 3: Commit any pending changes
echo ""
echo -e "${YELLOW}Step 3: Committing changes...${NC}"
git add -A
git commit -m "Update: $(date)" || echo -e "${GREEN}✓ No changes to commit${NC}"

# Step 4: Push to GitHub
echo ""
echo -e "${YELLOW}Step 4: Pushing to GitHub...${NC}"
git branch -M main
git push -u origin main --force
echo -e "${GREEN}✓ Code pushed to GitHub${NC}"

# Step 5: Check Vercel CLI
echo ""
echo -e "${YELLOW}Step 5: Checking Vercel CLI...${NC}"
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✓ Vercel CLI installed${NC}"
else
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✓ Vercel CLI installed${NC}"
fi

# Step 6: Deploy to Vercel
echo ""
echo -e "${YELLOW}Step 6: Deploying to Vercel...${NC}"
echo "This will open a browser for Vercel login if not already logged in."
echo ""

# Check if already logged in
if vercel whoami &> /dev/null; then
    echo -e "${GREEN}✓ Already logged in to Vercel${NC}"
else
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi

# Deploy
echo ""
echo -e "${YELLOW}Deploying...${NC}"
vercel --prod --yes

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "GitHub: ${YELLOW}https://github.com/chan-dra1/gita${NC}"
echo -e "Vercel: ${YELLOW}Check your Vercel dashboard for URL${NC}"
echo ""
echo -e "${GREEN}Vande Mataram! 🙏${NC}"
