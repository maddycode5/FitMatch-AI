import * as THREE from 'three';

/**
 * Procedural High-Definition PBR Textile & Garment Generator
 * Generates photorealistic fabric weaves, lapels, ties, buttons, and tailoring details
 * for the exact garments in The Virtual Archive.
 */

// 1. The Monochrome Cashmere Blazer & 3-Piece Suit (Check Wool, Vest, Tie, Pocket Square)
export function createSuitBlazerTexture(colorHex = '#222428') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Base suit fabric color
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 1024, 1024);

  // Fine check wool houndstooth/plaid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < 1024; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y < 1024; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Cross tweed grain
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1.0;
  for (let x = 8; x < 1024; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }

  // White Dress Shirt Collar V-Neck at Center Top
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(420, 0);
  ctx.lineTo(512, 190);
  ctx.lineTo(604, 0);
  ctx.closePath();
  ctx.fill();

  // White Shirt Collar Points
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(430, 0);
  ctx.lineTo(460, 150);
  ctx.lineTo(500, 130);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(594, 0);
  ctx.lineTo(564, 150);
  ctx.lineTo(524, 130);
  ctx.closePath();
  ctx.fill();

  // Diagonal Striped Silk Tie
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(488, 120);
  ctx.lineTo(536, 120);
  ctx.lineTo(545, 520);
  ctx.lineTo(512, 570);
  ctx.lineTo(479, 520);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = '#1e2129';
  ctx.fillRect(470, 100, 80, 500);

  // Diagonal silver & charcoal tie stripes
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 6;
  for (let i = 80; i < 620; i += 28) {
    ctx.beginPath();
    ctx.moveTo(460, i);
    ctx.lineTo(560, i + 50);
    ctx.stroke();
  }
  ctx.restore();

  // Interior Tailored Waistcoat / Vest
  ctx.fillStyle = 'rgba(18, 19, 23, 0.95)';
  ctx.beginPath();
  ctx.moveTo(420, 180);
  ctx.lineTo(475, 480);
  ctx.lineTo(512, 600);
  ctx.lineTo(470, 720);
  ctx.lineTo(390, 720);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(604, 180);
  ctx.lineTo(549, 480);
  ctx.lineTo(512, 600);
  ctx.lineTo(554, 720);
  ctx.lineTo(634, 720);
  ctx.closePath();
  ctx.fill();

  // Waistcoat buttons
  ctx.fillStyle = '#0f1013';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  [280, 350, 420, 490].forEach(y => {
    ctx.beginPath();
    ctx.arc(512, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Notched / Peak Lapels of Blazer
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.moveTo(370, 0);
  ctx.lineTo(440, 320);
  ctx.lineTo(380, 390);
  ctx.lineTo(470, 580);
  ctx.lineTo(440, 590);
  ctx.lineTo(320, 320);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(654, 0);
  ctx.lineTo(584, 320);
  ctx.lineTo(644, 390);
  ctx.lineTo(554, 580);
  ctx.lineTo(584, 590);
  ctx.lineTo(704, 320);
  ctx.closePath();
  ctx.fill();

  // Left Chest Welt Pocket with Folded White Silk Pocket Square
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(330, 310);
  ctx.lineTo(365, 290);
  ctx.lineTo(380, 315);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#0f1013';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(315, 316);
  ctx.lineTo(395, 316);
  ctx.stroke();

  // Two Lower Flap Pockets
  ctx.fillStyle = 'rgba(15, 17, 21, 0.6)';
  ctx.fillRect(250, 640, 140, 18);
  ctx.fillRect(634, 640, 140, 18);

  // Center Jacket Horn Buttons
  ctx.fillStyle = '#0a0b0d';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  [610, 690].forEach(y => {
    ctx.beginPath();
    ctx.arc(512, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 2. The Sculptural Asymmetric Drape Shirt (Crisp White Cotton, Polka-Dot Silk Tie)
export function createDrapeShirtTexture(colorHex = '#F5F6F8') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Crisp Cotton Background
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle fabric weave texture
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 1024; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Soft natural tailored folds & shadow creases
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(340, 200);
  ctx.bezierCurveTo(400, 380, 410, 600, 360, 850);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(684, 200);
  ctx.bezierCurveTo(624, 380, 614, 600, 664, 850);
  ctx.stroke();

  // Center Button Placket
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
  ctx.fillRect(490, 0, 44, 1024);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(490, 0, 44, 1024);

  // Crisp Turn-Down Spread Collar
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 2;

  // Left collar wing
  ctx.beginPath();
  ctx.moveTo(420, 0);
  ctx.lineTo(460, 160);
  ctx.lineTo(504, 140);
  ctx.lineTo(495, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right collar wing
  ctx.beginPath();
  ctx.moveTo(604, 0);
  ctx.lineTo(564, 160);
  ctx.lineTo(520, 140);
  ctx.lineTo(529, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Navy Silk Polka-Dot Necktie
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(488, 125);
  ctx.lineTo(536, 125);
  ctx.lineTo(548, 640);
  ctx.lineTo(512, 700);
  ctx.lineTo(476, 640);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(470, 110, 90, 620);

  // White Polka Dots on Tie
  ctx.fillStyle = '#ffffff';
  for (let y = 140; y < 680; y += 24) {
    const shift = (Math.floor(y / 24) % 2) * 12;
    for (let x = 482 + shift; x < 542; x += 22) {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Mother-of-pearl buttons below tie
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  [740, 830, 920].forEach(y => {
    ctx.beginPath();
    ctx.arc(512, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 3. The Pleated Minimalist Pantalon (Pinstripe Wool, High Waist, Sharp Creases)
export function createPantalonTexture(colorHex = '#18191D') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Deep tailored trouser base color
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 1024, 1024);

  // Crisp White Vertical Pinstripes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.lineWidth = 1.8;
  for (let x = 18; x < 1024; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }

  // High-Waisted Tailored Waistband at Top
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, 1024, 90);

  // Waistband belt loops
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  [120, 260, 420, 604, 764, 904].forEach(x => {
    ctx.fillRect(x, 8, 14, 74);
  });

  // Silver Waistband Clasp Button
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(512, 45, 9, 0, Math.PI * 2);
  ctx.fill();

  // Deep Front Pleat Creases (Down Left and Right Leg)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(340, 90);
  ctx.lineTo(330, 1024);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(684, 90);
  ctx.lineTo(694, 1024);
  ctx.stroke();

  // Subtle Pleat Highlight Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(342, 90);
  ctx.lineTo(332, 1024);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(686, 90);
  ctx.lineTo(696, 1024);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 4. The Sculptural Minimalist Trench (Double-Weave Twill, Double-Breasted Horn Buttons, Sash)
export function createTrenchTexture(colorHex = '#111113') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Heavyweight Silk-Wool Base Color
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 1024, 1024);

  // Diagonal twill weave texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1.5;
  for (let i = -1024; i < 2048; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 1024, 1024);
    ctx.stroke();
  }

  // Broad Trench Lapels
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.moveTo(340, 0);
  ctx.lineTo(440, 300);
  ctx.lineTo(360, 370);
  ctx.lineTo(460, 520);
  ctx.lineTo(320, 260);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(684, 0);
  ctx.lineTo(584, 300);
  ctx.lineTo(664, 370);
  ctx.lineTo(564, 520);
  ctx.lineTo(704, 260);
  ctx.closePath();
  ctx.fill();

  // Double-Breasted Dark Horn Buttons
  ctx.fillStyle = '#0a0a0c';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  [260, 360, 460].forEach(y => {
    // Left column
    ctx.beginPath();
    ctx.arc(430, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Right column
    ctx.beginPath();
    ctx.arc(594, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Tailored Waist Belt Sash with Brass Buckle
  ctx.fillStyle = 'rgba(10, 10, 12, 0.85)';
  ctx.fillRect(0, 520, 1024, 46);

  // Brass Buckle
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(482, 513, 60, 60);
  ctx.fillStyle = '#0f1013';
  ctx.fillRect(494, 525, 36, 36);

  // Storm Flap & Rain Shield Crease
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(280, 200);
  ctx.lineTo(512, 280);
  ctx.lineTo(744, 200);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

