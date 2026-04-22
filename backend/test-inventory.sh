#!/bin/bash
# =====================================================
# INVENTORY API - QUICK TEST SCRIPT
# Chạy các lệnh curl để test tất cả endpoints
# =====================================================

BASE_URL="http://localhost:5000/api/inventory"
RESET='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'

echo -e "${BLUE}=====================================${RESET}"
echo -e "${BLUE}💾 INVENTORY API - TEST SCRIPT${RESET}"
echo -e "${BLUE}=====================================${RESET}\n"

# ===== TEST 1: GET /api/inventory/stock =====
echo -e "${YELLOW}[1/5] TEST: GET /api/inventory/stock${RESET}"
echo -e "${BLUE}Query: Lấy tồn kho hiện tại${RESET}\n"

curl -X GET "$BASE_URL/stock" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ===== TEST 2: GET /api/inventory/logs (All) =====
echo -e "${YELLOW}[2/5] TEST: GET /api/inventory/logs (All)${RESET}"
echo -e "${BLUE}Query: Lấy tất cả lịch sử kho (default 100)${RESET}\n"

curl -X GET "$BASE_URL/logs" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ===== TEST 3: GET /api/inventory/logs (Filter IMPORT) =====
echo -e "${YELLOW}[3/5] TEST: GET /api/inventory/logs?action_type=IMPORT${RESET}"
echo -e "${BLUE}Query: Lấy lịch sử nhập kho${RESET}\n"

curl -X GET "$BASE_URL/logs?action_type=IMPORT" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ===== TEST 4: POST /api/inventory/import (Success) =====
echo -e "${YELLOW}[4/5] TEST: POST /api/inventory/import (Success)${RESET}"
echo -e "${BLUE}Payload: Nhập 2 items (variant 101, 102)${RESET}\n"

TIMESTAMP=$(date +%s)
REF_CODE="PN-TEST-$TIMESTAMP"

curl -X POST "$BASE_URL/import" \
  -H "Content-Type: application/json" \
  -d "{
    \"reference_code\": \"$REF_CODE\",
    \"note\": \"Test import từ bash script\",
    \"items\": [
      {
        \"variant_id\": 101,
        \"qty\": 25,
        \"price\": 500000
      },
      {
        \"variant_id\": 102,
        \"qty\": 15,
        \"price\": 520000
      }
    ]
  }" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ===== TEST 5: POST /api/inventory/import (Error - Duplicate) =====
echo -e "${YELLOW}[5/5] TEST: POST /api/inventory/import (Error)${RESET}"
echo -e "${RED}Payload: Duplicate reference_code (expects 400)${RESET}\n"

curl -X POST "$BASE_URL/import" \
  -H "Content-Type: application/json" \
  -d "{
    \"reference_code\": \"$REF_CODE\",
    \"note\": \"Duplicate test\",
    \"items\": [
      {
        \"variant_id\": 101,
        \"qty\": 5,
        \"price\": 500000
      }
    ]
  }" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ===== Summary =====
echo -e "${GREEN}=====================================${RESET}"
echo -e "${GREEN}✅ TEST COMPLETED!${RESET}"
echo -e "${GREEN}=====================================${RESET}\n"

echo "📝 Test Summary:"
echo "  1. Stock endpoint: Returns {variant_id: stock} map"
echo "  2. Logs endpoint: Returns array with pagination"
echo "  3. Logs filter: Can filter by action_type"
echo "  4. Import success: Returns 201 with details"
echo "  5. Import error: Rejects duplicate reference_code"
echo ""
echo "🔍 Next: Check database with:"
echo "  SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 5;"
echo ""
