const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 256, 384, 512];
const svgContent = fs.readFileSync(path.join(__dirname, '../public/icon.svg'));

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgContent)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../public/icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
  
  // Generate favicon
  await sharp(svgContent)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon.ico'));
  console.log('Generated favicon.ico');
}

generateIcons().catch(console.error);