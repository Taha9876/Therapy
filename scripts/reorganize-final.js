import fs from 'fs';
import path from 'path';

const sourceDir = path.join(process.cwd(), 'therapy-hub-admin-main');
const targetDir = process.cwd();

console.log('[v0] Starting reorganization...');
console.log('[v0] Source:', sourceDir);
console.log('[v0] Target:', targetDir);

if (!fs.existsSync(sourceDir)) {
  console.log('[v0] Error: Source directory not found at', sourceDir);
  process.exit(1);
}

// Get all files and folders in the source directory
const items = fs.readdirSync(sourceDir);
console.log('[v0] Items to move:', items);

// Move each item to the root
items.forEach(item => {
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

console.log('[v0] Reorganization complete!');

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
