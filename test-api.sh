#!/bin/bash

# Zcash Donation App - API Testing Script
# This script demonstrates how to use the API endpoints

API_URL="http://localhost:3000/api"

echo "🔍 Testing Zcash Donation API..."
echo ""

# Test 1: Health check
echo "1️⃣  Health Check:"
curl -s "$API_URL/health" | jq '.'
echo ""

# Test 2: Get blockchain info
echo "2️⃣  Blockchain Info:"
curl -s "$API_URL/blockchain/info" | jq '.'
echo ""

# Test 3: Get wallet balance
echo "3️⃣  Wallet Balance:"
curl -s "$API_URL/wallet/balance" | jq '.'
echo ""

# Test 4: Create a donation
echo "4️⃣  Create Donation:"
DONATION=$(curl -s -X POST "$API_URL/donations" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "tmPWLjYyHtYjZgYzqZJLV3HhVo1YziFu3X7",
    "amount": 0.001,
    "message": "Test donation"
  }')
echo "$DONATION" | jq '.'
DONATION_ID=$(echo "$DONATION" | jq -r '.id')
echo ""

# Test 5: Get all donations
echo "5️⃣  List All Donations:"
curl -s "$API_URL/donations" | jq '.'
echo ""

# Test 6: Get specific donation
echo "6️⃣  Get Donation by ID ($DONATION_ID):"
curl -s "$API_URL/donations/$DONATION_ID" | jq '.'
echo ""

# Test 7: Get statistics
echo "7️⃣  Donation Statistics:"
curl -s "$API_URL/statistics" | jq '.'
echo ""

# Test 8: Update donation status
echo "8️⃣  Update Donation Status:"
curl -s -X PATCH "$API_URL/donations/$DONATION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "tx_id": "test_tx_123"
  }' | jq '.'
echo ""

echo "✅ API testing complete!"
