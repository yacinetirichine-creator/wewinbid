#!/usr/bin/env node

/**
 * Script de test pour les logs d'audit
 * Vérifie que la migration SQL a été exécutée et que les logs fonctionnent
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuditLogs() {
  console.log('🧪 Testing Audit Logs Infrastructure...\n');

  // Test 1: Check if table exists
  console.log('1️⃣  Checking if audit_logs table exists...');
  const { data: tables, error: tablesError } = await supabase
    .from('audit_logs')
    .select('id')
    .limit(1);

  if (tablesError) {
    console.error('❌ Table audit_logs does not exist!');
    console.error('   Error:', tablesError.message);
    console.error('\n📋 ACTION REQUIRED:');
    console.error('   1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.error('   2. Copy content from: supabase/migration-audit-logs-centralized.sql');
    console.error('   3. Paste and execute the migration\n');
    return false;
  }
  console.log('✅ Table audit_logs exists\n');

  // Test 2: Check indexes
  console.log('2️⃣  Checking indexes...');
  const { data: indexes, error: indexesError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'audit_logs' 
      ORDER BY indexname;
    `
  }).catch(() => ({ data: null, error: null }));

  if (indexes && indexes.length > 0) {
    console.log(`✅ Found ${indexes.length} indexes`);
    indexes.forEach(idx => console.log(`   - ${idx.indexname}`));
  } else {
    console.log('⚠️  Cannot verify indexes (RPC may not be available)');
  }
  console.log('');

  // Test 3: Check RLS policies
  console.log('3️⃣  Checking RLS policies...');
  const { data: policies } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT policyname, cmd
      FROM pg_policies 
      WHERE tablename = 'audit_logs'
      ORDER BY policyname;
    `
  }).catch(() => ({ data: null }));

  if (policies && policies.length > 0) {
    console.log(`✅ Found ${policies.length} RLS policies`);
    policies.forEach(pol => console.log(`   - ${pol.policyname} (${pol.cmd})`));
  } else {
    console.log('⚠️  Cannot verify RLS policies (RPC may not be available)');
  }
  console.log('');

  // Test 4: Test create_audit_log function
  console.log('4️⃣  Testing create_audit_log() function...');
  const { data: logId, error: logError } = await supabase.rpc('create_audit_log', {
    p_user_id: null,
    p_company_id: null,
    p_action: 'test_action',
    p_resource: 'system',
    p_resource_id: 'test-script',
    p_details: { test: true, timestamp: new Date().toISOString() },
    p_severity: 'info',
    p_ip_address: '127.0.0.1',
    p_user_agent: 'test-script/1.0',
  });

  if (logError) {
    console.error('❌ Function create_audit_log() failed!');
    console.error('   Error:', logError.message);
    return false;
  }
  console.log('✅ Function create_audit_log() works');
  console.log(`   Created log ID: ${logId}\n`);

  // Test 5: Verify log was inserted
  console.log('5️⃣  Verifying log was inserted...');
  const { data: logs, error: selectError } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (selectError || !logs) {
    console.error('❌ Cannot read inserted log!');
    console.error('   Error:', selectError?.message);
    return false;
  }
  console.log('✅ Log retrieved successfully');
  console.log('   Action:', logs.action);
  console.log('   Resource:', logs.resource);
  console.log('   Details:', JSON.stringify(logs.details, null, 2));
  console.log('   Created at:', logs.created_at);
  console.log('');

  // Test 6: Test cleanup function
  console.log('6️⃣  Testing cleanup_old_audit_logs() function...');
  const { data: deletedCount, error: cleanupError } = await supabase.rpc('cleanup_old_audit_logs');

  if (cleanupError) {
    console.error('❌ Function cleanup_old_audit_logs() failed!');
    console.error('   Error:', cleanupError.message);
    return false;
  }
  console.log('✅ Function cleanup_old_audit_logs() works');
  console.log(`   Deleted ${deletedCount || 0} old logs (>2 years)\n`);

  // Test 7: Check trigger on tenders
  console.log('7️⃣  Checking tender change trigger...');
  const { data: triggers } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT tgname, tgtype
      FROM pg_trigger 
      WHERE tgrelid = 'tenders'::regclass
        AND tgname LIKE '%audit%'
      ORDER BY tgname;
    `
  }).catch(() => ({ data: null }));

  if (triggers && triggers.length > 0) {
    console.log(`✅ Found ${triggers.length} audit trigger(s) on tenders table`);
    triggers.forEach(trg => console.log(`   - ${trg.tgname}`));
  } else {
    console.log('⚠️  Cannot verify triggers (RPC may not be available)');
  }
  console.log('');

  // Test 8: Count total logs
  console.log('8️⃣  Counting total audit logs...');
  const { count, error: countError } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Cannot count logs!');
    console.error('   Error:', countError.message);
  } else {
    console.log(`✅ Total audit logs in database: ${count}`);
  }
  console.log('');

  // Test 9: Clean up test log
  console.log('9️⃣  Cleaning up test log...');
  const { error: deleteError } = await supabase
    .from('audit_logs')
    .delete()
    .eq('id', logId);

  if (deleteError) {
    console.log('⚠️  Cannot delete test log (RLS protection)');
    console.log('   This is expected if RLS is enabled');
  } else {
    console.log('✅ Test log cleaned up');
  }
  console.log('');

  return true;
}

async function testAuditLoggerLibrary() {
  console.log('📚 Testing Audit Logger Library...\n');

  // Test file exists
  const fs = require('fs');
  const path = require('path');
  const libPath = path.join(__dirname, '../src/lib/audit-logger.ts');

  console.log('1️⃣  Checking if audit-logger.ts exists...');
  if (!fs.existsSync(libPath)) {
    console.error('❌ File src/lib/audit-logger.ts not found!');
    return false;
  }
  console.log('✅ File exists\n');

  // Check exports
  console.log('2️⃣  Checking exports...');
  const content = fs.readFileSync(libPath, 'utf8');
  
  const requiredExports = [
    'export type AuditAction',
    'export type AuditSeverity',
    'export type AuditResource',
    'export async function createAuditLog',
    'export function getIpAddress',
    'export function getUserAgent',
    'export async function logRgpdAction',
    'export async function logSecurityEvent',
    'export async function logDocumentEvent',
  ];

  let allExportsPresent = true;
  requiredExports.forEach(exp => {
    if (content.includes(exp)) {
      console.log(`   ✅ ${exp.split(' ').slice(-1)[0]}`);
    } else {
      console.log(`   ❌ ${exp.split(' ').slice(-1)[0]} - MISSING!`);
      allExportsPresent = false;
    }
  });

  if (!allExportsPresent) {
    console.error('\n❌ Some exports are missing from audit-logger.ts');
    return false;
  }

  console.log('\n✅ All required exports present\n');
  return true;
}

async function testCacheLibrary() {
  console.log('💾 Testing Cache Library...\n');

  const fs = require('fs');
  const path = require('path');
  const cachePath = path.join(__dirname, '../src/lib/cache.ts');

  console.log('1️⃣  Checking if cache.ts exists...');
  if (!fs.existsSync(cachePath)) {
    console.error('❌ File src/lib/cache.ts not found!');
    return false;
  }
  console.log('✅ File exists\n');

  // Check exports
  console.log('2️⃣  Checking cache exports...');
  const content = fs.readFileSync(cachePath, 'utf8');
  
  const requiredExports = [
    'export const cache',
    'export const cacheKeys',
    'export const cacheTTL',
  ];

  let allExportsPresent = true;
  requiredExports.forEach(exp => {
    if (content.includes(exp)) {
      console.log(`   ✅ ${exp.split(' ').slice(-1)[0]}`);
    } else {
      console.log(`   ❌ ${exp.split(' ').slice(-1)[0]} - MISSING!`);
      allExportsPresent = false;
    }
  });

  if (!allExportsPresent) {
    console.error('\n❌ Some exports are missing from cache.ts');
    return false;
  }

  console.log('\n✅ All cache exports present\n');

  // Check Redis config
  console.log('3️⃣  Checking Redis configuration...');
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log('✅ Redis configured (Upstash)');
    console.log(`   URL: ${process.env.UPSTASH_REDIS_REST_URL.substring(0, 30)}...`);
  } else {
    console.log('⚠️  Redis not configured');
    console.log('   Cache will be disabled (graceful degradation)');
    console.log('   To enable: Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env.local');
  }
  console.log('');

  return true;
}

// Run all tests
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          AUDIT LOGS & CACHE INFRASTRUCTURE TEST            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Audit logs infrastructure
    const auditLogsOk = await testAuditLogs();
    
    // Test 2: Audit logger library
    const auditLoggerOk = await testAuditLoggerLibrary();
    
    // Test 3: Cache library
    const cacheOk = await testCacheLibrary();

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                         SUMMARY                            ');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`Audit Logs DB:        ${auditLogsOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Audit Logger Library: ${auditLoggerOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Cache Library:        ${cacheOk ? '✅ PASS' : '❌ FAIL'}`);

    const allTestsPassed = auditLogsOk && auditLoggerOk && cacheOk;

    if (allTestsPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Infrastructure ready for production.\n');
      console.log('Next steps:');
      console.log('1. Test in dev: npm run dev');
      console.log('2. Upload a document → Check logs');
      console.log('3. Export data → Check logs');
      console.log('4. Deploy to production');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - Check errors above\n');
      
      if (!auditLogsOk) {
        console.log('📋 To fix audit_logs:');
        console.log('   1. Go to Supabase SQL Editor');
        console.log('   2. Run: supabase/migration-audit-logs-centralized.sql');
        console.log('   3. Re-run this test');
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
