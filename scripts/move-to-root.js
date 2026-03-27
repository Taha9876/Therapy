import fs from 'fs';
import path from 'path';

const sourceDir = '/vercel/share/v0-project/therapy-hub-admin-main';
const targetDir = '/vercel/share/v0-project';

console.log('[v0] Source directory:', sourceDir);
console.log('[v0] Target directory:', targetDir);

// Check if source exists
if (!fs.existsSync(sourceDir)) {
  console.log('[v0] ERROR: Source directory does not exist');
  process.exit(1);
}

console.log('[v0] Source directory exists');

function moveDir(src, dest) {
  // Read all files and folders in source
  const items = fs.readdirSync(src);
  console.log(`[v0] Found ${items.length} items to move`);

  items.forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    // Skip if destination already exists
    if (fs.existsSync(destPath)) {
      console.log(`[v0] Skipping ${item} (already exists at destination)`);
      return;
    }

    console.log(`[v0] Moving: ${item}`);

    // Check if it's a directory
    const stats = fs.statSync(srcPath);
    if (stats.isDirectory()) {
      // Create directory and copy recursively
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function copyDirRecursive(src, dest) {
  const items = fs.readdirSync(src);

  items.forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    const stats = fs.statSync(srcPath);
    if (stats.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

try {
  moveDir(sourceDir, targetDir);
  console.log('[v0] Completed moving files to root directory');

  // Remove the old directory
  console.log('[v0] Removing old directory');
  fs.rmSync(sourceDir, { recursive: true, force: true });
  console.log('[v0] Successfully cleaned up old directory');
  console.log('[v0] Project reorganization complete!');
} catch (error) {
  console.error('[v0] Error:', error.message);
  process.exit(1);
}
