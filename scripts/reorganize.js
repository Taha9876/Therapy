import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const sourceDir = path.join(rootDir, 'therapy-hub-admin-main');

console.log('[v0] Starting reorganization...');
console.log('[v0] Root:', rootDir);
console.log('[v0] Source:', sourceDir);

if (!fs.existsSync(sourceDir)) {
  console.log('[v0] Source directory not found');
  process.exit(1);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copy all files and folders (except .git and node_modules)
const filesToCopy = fs.readdirSync(sourceDir);

filesToCopy.forEach(file => {
  if (file === '.git' || file === 'node_modules' || file === '.gitignore') return;
  
  const srcPath = path.join(sourceDir, file);
  const destPath = path.join(rootDir, file);
  
  const stat = fs.statSync(srcPath);
  
  if (stat.isDirectory()) {
    copyDir(srcPath, destPath);
    console.log(`[v0] Copied folder: ${file}`);
  } else {
    fs.copyFileSync(srcPath, destPath);
    console.log(`[v0] Copied file: ${file}`);
  }
});

// Remove the old folder
try {
  fs.rmSync(sourceDir, { recursive: true, force: true });
  console.log('[v0] Removed old therapy-hub-admin-main folder');
} catch (error) {
  console.log('[v0] Could not remove folder:', error.message);
}

console.log('[v0] Reorganization complete!');
