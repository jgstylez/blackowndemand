#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);
const environment = args[0] || 'dev';

console.log(`🚀 Deploying to ${environment}...`);

try {
  // Build the project
  console.log('📦 Building project...');
  execSync(`npm run build:${environment}`, { stdio: 'inherit' });

  // Deploy based on environment
  if (environment === 'dev') {
    console.log('🔧 Deploying to development...');
    execSync('netlify deploy --dir=dist', { stdio: 'inherit' });
  } else if (environment === 'prod') {
    console.log('🌟 Deploying to production...');
    
    // Confirm production deployment
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Are you sure you want to deploy to PRODUCTION? (yes/no): ', (answer) => {
      if (answer.toLowerCase() === 'yes') {
        execSync('netlify deploy --prod --dir=dist', { stdio: 'inherit' });
        console.log('✅ Production deployment complete!');
      } else {
        console.log('❌ Production deployment cancelled.');
      }
      readline.close();
    });
  }
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}