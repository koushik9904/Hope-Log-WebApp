#!/usr/bin/env node

/**
 * A simple CommonJS wrapper to run our TypeScript script
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 HopeLog AI Suggestion Generator');
console.log('================================');

// Check if OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY environment variable is not set.');
  console.error('Please set this variable and try again.');
  process.exit(1);
}

console.log('This tool will mark all journal entries as unanalyzed and then');
console.log('process them to generate AI suggestions for goals, tasks, and habits.');
console.log('');
console.log('⚠️  WARNING: This should only be run once. Running it multiple times');
console.log('will duplicate suggestions in the database.');
console.log('');

// Ask for confirmation
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled.');
    readline.close();
    process.exit(0);
  }
  
  console.log('Starting process...');
  readline.close();
  
  // Calculate the path to our script
  const scriptPath = path.join(__dirname, '../process-all-journal-entries.ts');
  
  // Execute the processing script using tsx (TypeScript execution) via npx
  const child = spawn('npx', ['tsx', scriptPath], { 
    stdio: 'inherit',
    shell: true
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Processing complete!');
    } else {
      console.error(`❌ Processing failed with exit code ${code}`);
    }
    process.exit(code);
  });
});