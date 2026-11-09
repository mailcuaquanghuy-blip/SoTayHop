import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Simple CRC32 implementation
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = makeCrcTable();
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(toCrc), 8 + len);
  return chunk;
}

function encodeRGBAtoPNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // standard filter
  ihdrData[12] = 0; // no interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0; // filter 0 (None)
    const srcOffset = y * width * 4;
    rgbaBuffer.copy(scanlines, rowOffset + 1, srcOffset, srcOffset + width * 4);
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw stylized notebook app icon into RGBA buffer
function drawAppIcon(size, isMaskable = false) {
  const buf = Buffer.alloc(size * size * 4);

  const scale = size / 512;
  const cx = size / 2;
  const cy = size / 2;

  // Maskable keeps padding so key elements stay in the central 80% circle
  const marginScale = isMaskable ? 0.75 : 1.0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient (Sky 400 to Blue 600)
      const gradT = (x + y) / (size * 2);
      // rgb(56, 189, 248) -> rgb(2, 132, 199)
      let r = Math.round(56 + (2 - 56) * gradT);
      let g = Math.round(189 + (132 - 189) * gradT);
      let b = Math.round(248 + (199 - 248) * gradT);
      let a = 255;

      // Base card coordinates
      const cardW = 320 * scale * marginScale;
      const cardH = 340 * scale * marginScale;
      const cardX1 = cx - cardW / 2;
      const cardX2 = cx + cardW / 2;
      const cardY1 = cy - cardH / 2 + (15 * scale);
      const cardY2 = cy + cardH / 2 + (15 * scale);
      const cardR = 36 * scale * marginScale;

      // Check if inside card with rounded corners
      const insideCardX = x >= cardX1 && x <= cardX2;
      const insideCardY = y >= cardY1 && y <= cardY2;

      let inCard = false;
      if (insideCardX && insideCardY) {
        // Test 4 rounded corners
        const cornerLeft = x < cardX1 + cardR;
        const cornerRight = x > cardX2 - cardR;
        const cornerTop = y < cardY1 + cardR;
        const cornerBottom = y > cardY2 - cardR;

        if (cornerLeft && cornerTop) {
          const cdx = x - (cardX1 + cardR);
          const cdy = y - (cardY1 + cardR);
          if (cdx * cdx + cdy * cdy <= cardR * cardR) inCard = true;
        } else if (cornerRight && cornerTop) {
          const cdx = x - (cardX2 - cardR);
          const cdy = y - (cardY1 + cardR);
          if (cdx * cdx + cdy * cdy <= cardR * cardR) inCard = true;
        } else if (cornerLeft && cornerBottom) {
          const cdx = x - (cardX1 + cardR);
          const cdy = y - (cardY2 - cardR);
          if (cdx * cdx + cdy * cdy <= cardR * cardR) inCard = true;
        } else if (cornerRight && cornerBottom) {
          const cdx = x - (cardX2 - cardR);
          const cdy = y - (cardY2 - cardR);
          if (cdx * cdx + cdy * cdy <= cardR * cardR) inCard = true;
        } else {
          inCard = true;
        }
      }

      if (inCard) {
        // Card white-blue tint
        const paperT = (y - cardY1) / cardH;
        r = Math.round(255 - 15 * paperT);
        g = Math.round(255 - 8 * paperT);
        b = 255;

        // Content on paper:
        // Top Clip
        const clipW = 180 * scale * marginScale;
        const clipH = 48 * scale * marginScale;
        const clipX1 = cx - clipW / 2;
        const clipX2 = cx + clipW / 2;
        const clipY1 = cardY1 - (18 * scale * marginScale);
        const clipY2 = clipY1 + clipH;
        if (x >= clipX1 && x <= clipX2 && y >= clipY1 && y <= clipY2) {
          r = 3; g = 105; b = 161; // #0369a1
        }

        // Lines on paper
        const lineStartX = cardX1 + (70 * scale * marginScale);
        const lineEndX = cardX2 - (35 * scale * marginScale);
        const iconCenterX = cardX1 + (40 * scale * marginScale);

        // Rows
        for (let row = 0; row < 4; row++) {
          const rowY = cardY1 + ((75 + row * 60) * scale * marginScale);
          const lineH = 16 * scale * marginScale;

          // Dot / avatar icon
          const dotDx = x - iconCenterX;
          const dotDy = y - (rowY + lineH / 2);
          if (dotDx * dotDx + dotDy * dotDy <= (16 * scale * marginScale) ** 2) {
            if (row === 0) {
              r = 234; g = 179; b = 8; // Yellow gold crown dot
            } else if (row === 3) {
              r = 248; g = 113; b = 113; // Red loser dot
            } else {
              r = 14; g = 165; b = 233; // Sky blue player dot
            }
          }

          // Text bar
          if (x >= lineStartX && x <= lineEndX && y >= rowY && y <= rowY + lineH) {
            if (row === 0) {
              r = 14; g = 165; b = 233; // First row active
            } else if (row === 3) {
              r = 252; g = 165; b = 165;
            } else {
              r = 148; g = 163; b = 184; // Grey bars
            }
          }
        }
      }

      // Sparkle in corner
      const spDx = Math.abs(x - (size * 0.8));
      const spDy = Math.abs(y - (size * 0.16));
      if (spDx + spDy < 18 * scale * marginScale) {
        r = 255; g = 255; b = 255;
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }

  return buf;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PNGs
const sizes = [
  { name: 'pwa-192x192.png', size: 192, maskable: false },
  { name: 'pwa-512x512.png', size: 512, maskable: false },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'favicon.png', size: 64, maskable: false },
];

for (const item of sizes) {
  const rgba = drawAppIcon(item.size, item.maskable);
  const png = encodeRGBAtoPNG(item.size, item.size, rgba);
  fs.writeFileSync(path.join(publicDir, item.name), png);
  console.log(`Generated ${item.name} (${item.size}x${item.size})`);
}

// Copy favicon.png to favicon.ico as PNG-encoded ICO fallback
fs.copyFileSync(path.join(publicDir, 'favicon.png'), path.join(publicDir, 'favicon.ico'));
console.log('Done generating all PWA icon assets!');
