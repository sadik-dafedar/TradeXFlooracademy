#!/usr/bin/env node
/**
 * Push .env variables to Vercel
 * 
 * Usage:
 *   1. Install Vercel CLI: npm i -g vercel
 *   2. Login: vercel login
 *   3. Link project: vercel link
 *   4. Run: node scripts/push-env-to-vercel.js
 * 
 * This script reads your .env file and pushes all variables to Vercel
 * for Production, Preview, and Development environments.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Variables to skip (already set or not needed on Vercel)
const SKIP_VARS = [
  'NODE_ENV',
  'MONGO_URL', // Duplicate of DATABASE_URL
  'DB_NAME',   // Not needed
];

// Read .env file
const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

const envVars = [];

for (const line of lines) {
  // Skip comments and empty lines
  if (line.startsWith('#') || line.trim() === '') continue;
  
  // Parse KEY=VALUE
  const match = line.match(/^([^=]+)=(.*)$/);
  if (!match) continue;
  
  const key = match[1].trim();
  let value = match[2].trim();
  
  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  
  // Skip empty values and excluded vars
  if (!value || SKIP_VARS.includes(key)) continue;
  
  envVars.push({ key, value });
}

console.log(`\n📦 Found ${envVars.length} environment variables to push\n`);

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch {
  console.error('❌ Vercel CLI not installed!');
  console.log('   Run: npm i -g vercel');
  process.exit(1);
}

// Check if project is linked
try {
  execSync('vercel project ls', { stdio: 'ignore' });
} catch {
  console.error('❌ Project not linked to Vercel!');
  console.log('   Run: vercel link');
  process.exit(1);
}

// Push each variable
let success = 0;
let failed = 0;

for (const { key, value } of envVars) {
  try {
    // Remove existing (ignore errors)
    try {
      execSync(`vercel env rm ${key} production -y`, { stdio: 'ignore' });
      execSync(`vercel env rm ${key} preview -y`, { stdio: 'ignore' });
      execSync(`vercel env rm ${key} development -y`, { stdio: 'ignore' });
    } catch {}
    
    // Add to all environments using echo to pipe the value
    const cmd = process.platform === 'win32'
      ? `echo ${value}| vercel env add ${key} production`
      : `echo "${value}" | vercel env add ${key} production`;
    
    execSync(cmd, { stdio: 'ignore' });
    
    // Also add to preview and development
    const cmdPreview = process.platform === 'win32'
      ? `echo ${value}| vercel env add ${key} preview`
      : `echo "${value}" | vercel env add ${key} preview`;
    execSync(cmdPreview, { stdio: 'ignore' });
    
    const cmdDev = process.platform === 'win32'
      ? `echo ${value}| vercel env add ${key} development`
      : `echo "${value}" | vercel env add ${key} development`;
    execSync(cmdDev, { stdio: 'ignore' });
    
    console.log(`✅ ${key}`);
    success++;
  } catch (error) {
    console.log(`❌ ${key} - ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 Results: ${success} success, ${failed} failed`);
console.log('\n🚀 Now redeploy your project:');
console.log('   vercel --prod\n');
