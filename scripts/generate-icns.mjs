import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, '../build');
const iconsetDir = path.join(buildDir, 'icon.iconset');

async function generateIcns() {
  try {
    // Create iconset directory
    if (!fs.existsSync(iconsetDir)) {
      fs.mkdirSync(iconsetDir, { recursive: true });
    }

    // Copy and rename icons for iconset (macOS requires specific naming)
    const sizes = [
      { size: 16, name: 'icon_16x16.png' },
      { size: 32, name: 'icon_16x16@2x.png' },
      { size: 32, name: 'icon_32x32.png' },
      { size: 64, name: 'icon_32x32@2x.png' },
      { size: 128, name: 'icon_128x128.png' },
      { size: 256, name: 'icon_128x128@2x.png' },
      { size: 256, name: 'icon_256x256.png' },
      { size: 512, name: 'icon_256x256@2x.png' },
      { size: 512, name: 'icon_512x512.png' },
      { size: 1024, name: 'icon_512x512@2x.png' },
    ];

    for (const { size, name } of sizes) {
      const source = path.join(buildDir, `icon-${size}.png`);
      const dest = path.join(iconsetDir, name);
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
        console.log(`Copied ${name}`);
      } else {
        console.log(`Warning: ${source} not found`);
      }
    }

    // Generate .icns using macOS iconutil
    const icnsPath = path.join(buildDir, 'icon.icns');
    execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);
    console.log('Generated icon.icns successfully!');
    
    // Clean up iconset directory
    fs.rmSync(iconsetDir, { recursive: true });
    console.log('Cleaned up temporary files');
    
  } catch (error) {
    console.error('Error generating icns:', error.message);
    process.exit(1);
  }
}

generateIcns();

