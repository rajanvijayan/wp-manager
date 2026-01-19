// Script to generate app icons from SVG
// Run: node scripts/generate-icon.js

const fs = require('fs');
const path = require('path');

// Create a simple 512x512 PNG icon (base64 encoded)
// This is a placeholder - for production, use proper icon generation tools

const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0073aa"/>
      <stop offset="100%" stop-color="#004d73"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="240" fill="url(#bgGradient)"/>
  <path d="M128 160L176 352L256 224L336 352L384 160" stroke="white" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="144" cy="400" r="20" fill="white" opacity="0.9"/>
  <circle cx="216" cy="400" r="20" fill="white" opacity="0.9"/>
  <circle cx="288" cy="400" r="20" fill="white" opacity="0.9"/>
  <circle cx="360" cy="400" r="20" fill="white" opacity="0.9"/>
</svg>`;

const buildDir = path.join(__dirname, '../build');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Write SVG file
fs.writeFileSync(path.join(buildDir, 'icon.svg'), svgContent);

console.log('✅ Icon SVG created at build/icon.svg');
console.log('');
console.log('To create PNG/ICNS/ICO icons for production:');
console.log('1. Use an online converter like https://cloudconvert.com/svg-to-png');
console.log('2. Or use electron-icon-builder: npx electron-icon-builder --input=build/icon.svg --output=build');
console.log('');
console.log('Required icon files:');
console.log('  - build/icon.png (512x512 for Linux)');
console.log('  - build/icon.icns (for macOS)');
console.log('  - build/icon.ico (for Windows)');

