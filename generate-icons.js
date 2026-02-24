const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Create JGI icon (simple blue background with white text)
async function createIcon(size, filename) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#001c54" rx="${size * 0.15}"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">JGI</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, filename));

  console.log(`Created ${filename}`);
}

// Create adaptive icon foreground
async function createAdaptiveIcon() {
  const size = 1024;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#001c54"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">JGI</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));

  console.log('Created adaptive-icon.png');
}

// Create splash icon
async function createSplashIcon() {
  const size = 1284;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#001c54"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">JGI</text>
      <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="${size * 0.1}" fill="#4da6ff" text-anchor="middle">Boardroom Booking</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));

  console.log('Created splash-icon.png');
}

async function main() {
  // Create main icon (1024x1024)
  await createIcon(1024, 'icon.png');

  // Create adaptive icon
  await createAdaptiveIcon();

  // Create splash icon
  await createSplashIcon();

  // Create favicon (small)
  await createIcon(48, 'favicon.png');

  console.log('All icons created successfully!');
}

main().catch(console.error);
