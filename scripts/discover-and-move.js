import fs from 'fs';
import path from 'path';

// Find where the script is running from
console.log('[v0] Current working directory:', process.cwd());
console.log('[v0] Script location:', import.meta.url);

// List contents of current directory to find the folder
const currentDir = process.cwd();
const items = fs.readdirSync(currentDir);
console.log('[v0] Items in current directory:');
items.slice(0, 20).forEach(item => console.log('  -', item));

// Try to find therapy-hub-admin-main
const possiblePaths = [
  path.join(currentDir, 'therapy-hub-admin-main'),
  path.join(currentDir, '..', 'therapy-hub-admin-main'),
  '/vercel/share/v0-project/therapy-hub-admin-main'
];

let sourceDir = null;
for (const possiblePath of possiblePaths) {
  console.log('[v0] Checking path:', possiblePath);
  if (fs.existsSync(possiblePath)) {
    sourceDir = possiblePath;
    console.log('[v0] Found source directory at:', sourceDir);
    break;
  }
}

if (!sourceDir) {
  console.log('[v0] ERROR: Could not find therapy-hub-admin-main in any expected location');
  process.exit(1);
}

const targetDir = path.dirname(sourceDir);
console.log('[v0] Target directory:', targetDir);

// Get all files and folders in the source directory
const sourceItems = fs.readdirSync(sourceDir);
console.log('[v0] Items to move:', sourceItems.length, 'items');

// Move each item to the root
let movedCount = 0;
sourceItems.forEach(item => {
  const sourcePath = path.join(sourceDir, item);
  const targetPath = path.join(targetDir, item);
  
  // Skip if target already exists at root
  if (fs.existsSync(targetPath)) {
    console.log('[v0] Skipping (already exists):', item);
    return;
  }
  
  try {
    // Copy recursively
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirRecursive(sourcePath, targetPath);
      console.log('[v0] Moved directory:', item);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      console.log('[v0] Moved file:', item);
    }
    movedCount++;
  } catch (error) {
    console.log('[v0] Error moving', item, ':', error.message);
  }
});

// Remove the source directory
try {
  removeDirRecursive(sourceDir);
  console.log('[v0] Removed source directory');
} catch (error) {
  console.log('[v0] Error removing source directory:', error.message);
}

console.log('[v0] Reorganization complete! Moved', movedCount, 'items');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    
    if (fs.statSync(srcFile).isDirectory()) {
      copyDirRecursive(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

function removeDirRecursive(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        removeDirRecursive(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(dir);
  }
}
