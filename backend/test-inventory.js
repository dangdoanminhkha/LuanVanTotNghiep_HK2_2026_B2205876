/**
 * =====================================================
 * INVENTORY API - TEST SCRIPT
 * File: backend/test-inventory.js
 * 
 * Chạy: node test-inventory.js
 * =====================================================
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:5000/api/inventory';

// Colors setup
colors.setTheme({
  success: 'green',
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  debug: 'magenta'
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test 1: GET /api/inventory/stock
 */
async function test1_getStock() {
  console.log('\n' + '='.repeat(50));
  console.log('[1/5] TEST: GET /api/inventory/stock'.info);
  console.log('Query: Lấy tồn kho hiện tại'.debug);
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${BASE_URL}/stock`, {
      timeout: 5000
    });
    
    console.log('✅ Status: 200 OK'.success);
    console.log('Response:'.info);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:'.error, error.message);
    return false;
  }
}

/**
 * Test 2: GET /api/inventory/logs (all)
 */
async function test2_getLogs() {
  console.log('\n' + '='.repeat(50));
  console.log('[2/5] TEST: GET /api/inventory/logs (All)'.info);
  console.log('Query: Lấy tất cả lịch sử kho (default 100)'.debug);
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${BASE_URL}/logs`, {
      timeout: 5000
    });
    
    console.log('✅ Status: 200 OK'.success);
    console.log(`Total records: ${response.data.pagination.total}`.info);
    console.log(`Current page: ${response.data.pagination.page}`.info);
    
    if (response.data.data.length > 0) {
      console.log('Sample data (first 2):'.info);
      response.data.data.slice(0, 2).forEach((log, idx) => {
        console.log(`  ${idx + 1}. ${log.reference_code} - ${log.product_name} (x${log.quantity_changed}) [${log.action_type}]`);
      });
    } else {
      console.log('No data yet'.warn);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:'.error, error.message);
    return false;
  }
}

/**
 * Test 3: GET /api/inventory/logs (filter IMPORT)
 */
async function test3_getLogsImport() {
  console.log('\n' + '='.repeat(50));
  console.log('[3/5] TEST: GET /api/inventory/logs?action_type=IMPORT'.info);
  console.log('Query: Lấy lịch sử nhập kho'.debug);
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${BASE_URL}/logs?action_type=IMPORT`, {
      timeout: 5000
    });
    
    console.log('✅ Status: 200 OK'.success);
    console.log(`Import records: ${response.data.pagination.total}`.info);
    
    return true;
  } catch (error) {
    console.error('❌ Error:'.error, error.message);
    return false;
  }
}

/**
 * Test 4: POST /api/inventory/import (Success)
 */
async function test4_importSuccess() {
  console.log('\n' + '='.repeat(50));
  console.log('[4/5] TEST: POST /api/inventory/import (Success)'.info);
  console.log('Payload: Nhập 2 items (variant 101, 102)'.debug);
  console.log('='.repeat(50));
  
  try {
    const timestamp = Date.now();
    const refCode = `PN-TEST-${timestamp}`;
    
    const payload = {
      reference_code: refCode,
      note: 'Test import từ Node.js test script',
      items: [
        {
          variant_id: 101,
          qty: 25,
          price: 500000
        },
        {
          variant_id: 102,
          qty: 15,
          price: 520000
        }
      ]
    };
    
    console.log('Payload:'.info);
    console.log(JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${BASE_URL}/import`, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Status: 201 Created'.success);
    console.log('Response:'.info);
    console.log(JSON.stringify(response.data, null, 2));
    
    // Store for next test
    global.lastRefCode = refCode;
    
    return true;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('❌ Error:'.error, error.response.data.message || error.message);
    } else {
      console.error('❌ Error:'.error, error.message);
    }
    return false;
  }
}

/**
 * Test 5: POST /api/inventory/import (Error - Duplicate)
 */
async function test5_importDuplicate() {
  console.log('\n' + '='.repeat(50));
  console.log('[5/5] TEST: POST /api/inventory/import (Error - Duplicate)'.warn);
  console.log('Payload: Duplicate reference_code (expects 400)'.error);
  console.log('='.repeat(50));
  
  if (!global.lastRefCode) {
    console.log('⏭️  Skipping: No previous reference_code (test 4 failed)'.warn);
    return null;
  }
  
  try {
    const payload = {
      reference_code: global.lastRefCode,
      note: 'Duplicate test',
      items: [
        {
          variant_id: 101,
          qty: 5,
          price: 500000
        }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/import`, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('❌ Expected 400, got 200 - Something wrong!'.error);
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Status: 400 Bad Request (Expected)'.success);
      console.log('Error message:'.info, error.response.data.message);
      return true;
    } else {
      console.error('❌ Unexpected error:'.error, error.message);
      return false;
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('💾 INVENTORY API - TEST SCRIPT'.info);
  console.log('═'.repeat(50));
  
  // Check if server is running
  try {
    await axios.get(BASE_URL + '/stock', { timeout: 2000 });
  } catch (error) {
    console.error('\n❌ ERROR: Server not responding!'.error);
    console.error('Make sure:'.warn);
    console.error('  1. MySQL is running');
    console.error('  2. Node server is running: npm start');
    console.error('  3. Server is on port 5000'.warn);
    process.exit(1);
  }
  
  // Run all tests
  const results = [];
  
  results.push(await test1_getStock());
  await sleep(500);
  
  results.push(await test2_getLogs());
  await sleep(500);
  
  results.push(await test3_getLogsImport());
  await sleep(500);
  
  results.push(await test4_importSuccess());
  await sleep(500);
  
  results.push(await test5_importDuplicate());
  
  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 TEST SUMMARY'.info);
  console.log('═'.repeat(50));
  
  const passed = results.filter(r => r === true).length;
  const skipped = results.filter(r => r === null).length;
  const failed = results.filter(r => r === false).length;
  
  console.log(`✅ Passed: ${passed}`.success);
  if (skipped > 0) console.log(`⏭️  Skipped: ${skipped}`.warn);
  if (failed > 0) console.log(`❌ Failed: ${failed}`.error);
  
  console.log('\n' + '═'.repeat(50));
  console.log('🔍 NEXT STEPS:'.info);
  console.log('═'.repeat(50));
  
  console.log('1. Check database with:'.info);
  console.log('   mysql -u root -p'.debug);
  console.log('   > USE shoe_store;');
  console.log('   > SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 5;');
  
  console.log('\n2. Integrate into app:'.info);
  console.log('   Edit backend/index.js and add:');
  console.log('   const inventoryRoutes = require(\'./routes/inventory\');'.debug);
  console.log('   app.use(\'/api/inventory\', inventoryRoutes);');
  
  console.log('\n3. Use InventoryService in your code:'.info);
  console.log('   const InventoryService = require(\'./services/inventoryService\');'.debug);
  console.log('   const stock = await InventoryService.getVariantStock(101);');
  
  console.log('\n💡 Documentation:'.info);
  console.log('   - INVENTORY_IMPLEMENTATION_GUIDE.md'.debug);
  console.log('   - INVENTORY_QUICK_START.md'.debug);
  
  console.log('\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run
runTests().catch(error => {
  console.error('Fatal error:'.error, error);
  process.exit(1);
});
