#!/bin/bash

# Azure Playwright Testing Service Setup Script
echo "🚀 Setting up Azure Playwright Testing Service..."

# Check if user is logged into Azure
if ! az account show > /dev/null 2>&1; then
    echo "❌ Please login to Azure first: az login"
    exit 1
fi

# Set environment variables for Azure Playwright Testing
export PLAYWRIGHT_SERVICE_URL="wss://eastus.api.playwright.microsoft.com/playwrightworkspaces/18d5185e-7f8a-46e0-afa3-002163bd7cef/browsers"

# Get Azure access token for Playwright service
echo "🔐 Getting Azure access token..."
TOKEN=$(az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv)

if [ -n "$TOKEN" ]; then
    export PLAYWRIGHT_SERVICE_ACCESS_TOKEN="$TOKEN"
    echo "✅ Azure access token obtained"
else
    echo "❌ Failed to get Azure access token"
    exit 1
fi

# Display current configuration
echo ""
echo "📋 Azure Playwright Testing Configuration:"
echo "Service URL: $PLAYWRIGHT_SERVICE_URL"
echo "Access Token: ${PLAYWRIGHT_SERVICE_ACCESS_TOKEN:0:20}..."
echo ""

# Run tests based on parameter
case "$1" in
    "cucumber")
        echo "🥒 Running Cucumber tests on Azure..."
        npm run test:azure:parallel
        ;;
    "playwright")
        echo "🎭 Running native Playwright tests on Azure..."
        npx playwright test --config=playwright.service.config.ts --workers=20
        ;;
    *)
        echo "Usage: $0 [cucumber|playwright]"
        echo "  cucumber  - Run Cucumber BDD tests on Azure"
        echo "  playwright - Run native Playwright tests on Azure"
        ;;
esac
