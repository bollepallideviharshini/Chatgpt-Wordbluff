import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';

const rootDir = process.cwd();
const outputZip = path.join(rootDir, 'netlify-ready-game.zip');

console.log('📦 Packaging Word Bluff for Netlify Drop...');

// If old zip exists, delete it
if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

const output = fs.createWriteStream(outputZip);
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

output.on('close', () => {
  const sizeMb = (archive.pointer() / (1024 * 1024)).toFixed(2);
  console.log(`✅ Success! Created netlify-ready-game.zip (${sizeMb} MB)`);
  console.log(`📍 File path: ${outputZip}`);
  console.log('🚀 Ready to drag and drop to https://app.netlify.com/drop');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Files to include
const filesToInclude = [
  'netlify.toml',
  'package.json',
  'package-lock.json',
  'index.html',
  'tsconfig.json',
  'vite.config.ts'
];

filesToInclude.forEach((file) => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: file });
  }
});

// Directories to include
const dirsToInclude = ['dist', 'src', 'helpers', 'netlify', 'public'];

dirsToInclude.forEach((dir) => {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    archive.directory(dirPath, dir);
  }
});

archive.finalize();
