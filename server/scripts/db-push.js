// Script to push Drizzle schema to database
import { exec } from 'child_process';

console.log('Pushing schema to database...');

// Use the correct command format for newer Drizzle versions
exec('npx drizzle-kit push:pg --schema=./shared/schema.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(stdout);
  console.log('Schema pushed to database successfully!');
});