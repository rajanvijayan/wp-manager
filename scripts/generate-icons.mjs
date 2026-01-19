import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const svgPath = path.join(__dirname, '../build/icon.svg')
const buildDir = path.join(__dirname, '../build')

async function generateIcons() {
  try {
    // Ensure build directory exists
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true })
    }

    // Read the SVG
    const svgBuffer = fs.readFileSync(svgPath)

    // Generate PNG icons at various sizes
    const sizes = [16, 32, 64, 128, 256, 512, 1024]

    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(buildDir, `icon-${size}.png`))
      console.log(`Generated icon-${size}.png`)
    }

    // Generate the main icon.png (512x512 for dock)
    await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(buildDir, 'icon.png'))
    console.log('Generated icon.png (512x512)')

    console.log('\nAll icons generated successfully!')
    console.log('Icon location:', path.join(buildDir, 'icon.png'))
  } catch (error) {
    console.error('Error generating icons:', error)
    process.exit(1)
  }
}

generateIcons()
