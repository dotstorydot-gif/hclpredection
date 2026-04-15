const { execSync } = require('child_process');
const path = require('path');

// When called from src, the repo root is one level up
const repoPath = path.resolve(__dirname);

try {
  process.chdir(repoPath);
  console.log('Successfully entered:', process.cwd());
  
  console.log('--- Git Add ---');
  execSync('git add .');
  
  console.log('--- Git Commit ---');
  try {
    execSync('git commit -m "fix: match UUIDs, logo, 75-min lock, and sorting"');
  } catch (e) {
    console.log('Nothing to commit or already committed.');
  }
  
  console.log('--- Git Push ---');
  execSync('git push origin main');
  
  console.log('--- DEPLOYMENT SUCCESSFUL ---');
} catch (error) {
  console.error('--- DEPLOYMENT FAILED ---');
  console.error(error.message);
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  process.exit(1);
}
