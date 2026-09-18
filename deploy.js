import { execSync } from 'child_process';
import { existsSync } from 'fs';

// Guarantee Git is in PATH regardless of how the terminal was launched
const gitCmdPath = 'C:\\Program Files\\Git\\cmd';
const gitBinPath = 'C:\\Program Files\\Git\\bin';

const currentPath = process.env.PATH || process.env.Path || '';
const newPath = `${gitCmdPath};${gitBinPath};${currentPath}`;

const env = {
  ...process.env,
  PATH: newPath,
  Path: newPath
};

try {
  console.log('🚀 Deploying to GitHub Pages (gh-pages)...');
  execSync('npx gh-pages -d dist', { stdio: 'inherit', env });
  console.log('✅ Successfully deployed to GitHub Pages!');
} catch (error) {
  console.error('❌ Deploy error:', error.message);
  process.exit(1);
}
