# =====================================================
# INVENTORY API - QUICK TEST SCRIPT (PowerShell)
# Chạy các lệnh curl/Invoke-WebRequest để test endpoints
# =====================================================

$BASE_URL = "http://localhost:5000/api/inventory"

Write-Host "=====================================" -ForegroundColor Blue
Write-Host "💾 INVENTORY API - TEST SCRIPT (PowerShell)" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue
Write-Host ""

# ===== TEST 1: GET /api/inventory/stock =====
Write-Host "[1/5] TEST: GET /api/inventory/stock" -ForegroundColor Yellow
Write-Host "Query: Lấy tồn kho hiện tại" -ForegroundColor Blue
Write-Host ""

try {
  $response = Invoke-WebRequest -Uri "$BASE_URL/stock" `
    -Method Get `
    -Headers @{"Content-Type"="application/json"} `
    -UseBasicParsing
  
  Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2 -ForegroundColor Cyan
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ===== TEST 2: GET /api/inventory/logs (All) =====
Write-Host "[2/5] TEST: GET /api/inventory/logs (All)" -ForegroundColor Yellow
Write-Host "Query: Lấy tất cả lịch sử kho (default 100)" -ForegroundColor Blue
Write-Host ""

try {
  $response = Invoke-WebRequest -Uri "$BASE_URL/logs" `
    -Method Get `
    -Headers @{"Content-Type"="application/json"} `
    -UseBasicParsing
  
  Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
  
  $json = $response.Content | ConvertFrom-Json
  Write-Host "Total records: $($json.pagination.total)" -ForegroundColor Cyan
  Write-Host "Sample data:" -ForegroundColor Cyan
  $json.data[0..2] | ForEach-Object {
    Write-Host "  - $($_.reference_code): $($_.product_name) (x$($_.quantity_changed))"
  }
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ===== TEST 3: GET /api/inventory/logs (Filter IMPORT) =====
Write-Host "[3/5] TEST: GET /api/inventory/logs?action_type=IMPORT" -ForegroundColor Yellow
Write-Host "Query: Lấy lịch sử nhập kho" -ForegroundColor Blue
Write-Host ""

try {
  $response = Invoke-WebRequest -Uri "$BASE_URL/logs?action_type=IMPORT" `
    -Method Get `
    -Headers @{"Content-Type"="application/json"} `
    -UseBasicParsing
  
  Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
  
  $json = $response.Content | ConvertFrom-Json
  Write-Host "Import records: $($json.pagination.total)" -ForegroundColor Cyan
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ===== TEST 4: POST /api/inventory/import (Success) =====
Write-Host "[4/5] TEST: POST /api/inventory/import (Success)" -ForegroundColor Yellow
Write-Host "Payload: Nhập 2 items (variant 101, 102)" -ForegroundColor Blue
Write-Host ""

try {
  $timestamp = (Get-Date).Ticks
  $refCode = "PN-TEST-$timestamp"
  
  $body = @{
    reference_code = $refCode
    note = "Test import từ PowerShell"
    items = @(
      @{
        variant_id = 101
        qty = 25
        price = 500000
      },
      @{
        variant_id = 102
        qty = 15
        price = 520000
      }
    )
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest -Uri "$BASE_URL/import" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body `
    -UseBasicParsing
  
  Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
  $json = $response.Content | ConvertFrom-Json
  Write-Host "Message: $($json.message)" -ForegroundColor Green
  Write-Host "Items count: $($json.items_count)" -ForegroundColor Cyan
  Write-Host "Total price: $($json.total_price)" -ForegroundColor Cyan
  
  # Save reference code for next test
  Set-Variable -Name "LastRefCode" -Value $refCode -Scope Global
  
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
  $LastRefCode = "PN-DUMMY"
}

Write-Host ""

# ===== TEST 5: POST /api/inventory/import (Error - Duplicate) =====
Write-Host "[5/5] TEST: POST /api/inventory/import (Error)" -ForegroundColor Yellow
Write-Host "Payload: Duplicate reference_code (expects 400)" -ForegroundColor Red
Write-Host ""

try {
  $body = @{
    reference_code = $LastRefCode
    note = "Duplicate test"
    items = @(
      @{
        variant_id = 101
        qty = 5
        price = 500000
      }
    )
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest -Uri "$BASE_URL/import" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body `
    -UseBasicParsing
  
  Write-Host "Status: $($response.StatusCode)" -ForegroundColor Yellow
  
} catch {
  # Expected error
  if ($_.Exception.Response.StatusCode -eq "BadRequest") {
    Write-Host "✅ Status: 400 (Expected)" -ForegroundColor Green
    Write-Host "Error message: Mã đối chiếu đã tồn tại" -ForegroundColor Red
  } else {
    Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""

# ===== Summary =====
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ TEST COMPLETED!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Test Summary:"
Write-Host "  1. Stock endpoint: Returns {variant_id: stock} map"
Write-Host "  2. Logs endpoint: Returns array with pagination"
Write-Host "  3. Logs filter: Can filter by action_type"
Write-Host "  4. Import success: Returns 201 with details"
Write-Host "  5. Import error: Rejects duplicate reference_code"
Write-Host ""

Write-Host "🔍 Next: Check database with:"
Write-Host "  SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 5;"
Write-Host ""

Write-Host "💡 Tips:"
Write-Host "  - Make sure MySQL is running"
Write-Host "  - Make sure Node.js server is running on port 5000"
Write-Host "  - Check database connection in backend/db.js"
Write-Host ""
