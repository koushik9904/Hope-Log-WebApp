// Script to push Drizzle schema to database
const { exec } = require('child_process');

console.log('Pushing schema to database...');

exec('npx drizzle-kit push:pg', (error, stdout, stderr) => {
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