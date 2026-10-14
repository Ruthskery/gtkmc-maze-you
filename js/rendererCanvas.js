import { levels } from "./levels.js";

export let CELL = 34;
const MAZE_PADDING = 12;

// Keep in sync with the .controls-panel media query in css/style.css
const controlsHiddenQuery = window.matchMedia(
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)"
);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const avatarImg = new Image();
avatarImg.src = "assets/images/avatar/bg-danica-cartoon.png";

const logoCache = {};

// Pixel density the canvas was last sized for. Everything draws with this
// (not a fresh devicePixelRatio read) so all layers stay in step.
let canvasDpr = 1;

const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

/* ======================
   Hi-DPI Fix
====================== */

export function resizeCanvas(currentLevel = 0) {
  const dpr = window.devicePixelRatio || 1;
  canvasDpr = dpr;
  const isMobile = window.innerWidth < 768;

  const maze = levels[currentLevel].maze;
  const rows = maze.length;
  const cols = maze[0].length;

  let maxWidth, maxHeight;

  if (isMobile) {
    // Mobile: use viewport width with padding
    const padding = 32;
    maxWidth = Math.min(window.innerWidth - padding, 360);
    maxHeight = window.innerHeight * 0.6;
  } else {
    // Desktop: calculate maximum available space
    // Container max-width is 1280px (max-w-5xl), with padding 32px (px-4 = 16px * 2)
    // Right panel is 260px, gap is 24px (gap-6)
    // Card padding is 40px (20px * 2), canvas border is 8px (4px * 2)
    const containerMaxWidth = 1280;
    const containerPadding = 32;
    const controlsHidden = controlsHiddenQuery.matches;
    const rightPanelWidth = controlsHidden ? 0 : 260;
    const gap = controlsHidden ? 0 : 24;
    const cardPadding = 40;
    const canvasBorder = 8;

    // Calculate available width
    const effectiveContainerWidth = Math.min(window.innerWidth - containerPadding * 2, containerMaxWidth);
    const availableWidth = effectiveContainerWidth - rightPanelWidth - gap - cardPadding - canvasBorder;

    // Use viewport height with margin for title and spacing (75% of viewport or max 700px)
    maxHeight = Math.min(window.innerHeight * 0.75, 700);

    // Ensure minimum width of 500px, but use maximum available space
    maxWidth = Math.max(availableWidth, 500);
  }

  // Calculate cell size based on available space
  const usableWidth = maxWidth - MAZE_PADDING * 2;
  const usableHeight = maxHeight - MAZE_PADDING * 2;

  CELL = Math.floor(
    Math.min(usableWidth / cols, usableHeight / rows)
  );

  // Recalculate actual dimensions based on cell size
  const width = CELL * cols + MAZE_PADDING * 2;
  const height = CELL * rows + MAZE_PADDING * 2;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  staticLayer = null; // floor + walls get redrawn at the new size
}



/* ======================
   Visual Settings
====================== */

// Candy-tube walls ✨
const WALL_THICKNESS = 0.62;              // share of a cell
const WALL_GRADIENT = ["#f9a8d4", "#f472b6", "#c4b5fd"];
const WALL_SHADOW = "rgba(190,24,93,0.28)";
const WALL_GLOSS = "rgba(255,255,255,0.5)";

// Picnic-blanket floor
const FLOOR_COLOR = "#fff5f8";
const GINGHAM_COLOR = "rgba(244,114,182,0.07)";

const PARTICLE_COLORS = ["#ec4899", "#f472b6", "#a78bfa", "#facc15", "#fb7185"];

/* ======================
   Player Animation State
====================== */

let playerSpawnStart = null;
const SPAWN_DURATION = 420;

// Smooth movement state
let renderPos = { x: 0, y: 0 };
let lastTargetPos = null;
const MOVE_SPEED = 0.12;

/* ======================
   Logo Helper
====================== */

function getLogo(levelIndex, exitKey) {
  const src = levels[levelIndex]?.logos?.[exitKey];
  if (!src) return null;

  if (!logoCache[src]) {
    const img = new Image();
    img.src = src;
    logoCache[src] = img;
  }

  return logoCache[src];
}

levels.forEach((level, index) => {
  Object.keys(level.logos ?? {}).forEach(exitKey => getLogo(index, exitKey));
});

/* ======================
   Main Draw
====================== */

export function drawMaze(maze, playerPos, levelIndex, visited) {
  const now = performance.now();
  const dpr = canvasDpr;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(getStaticLayer(maze), 0, 0, canvas.width / dpr, canvas.height / dpr);

  drawTrail(visited);
  drawExits(maze, levelIndex, now);
  drawPlayer(playerPos, now);
  drawParticles();
}

/* ======================
   Static Layer (floor + walls, drawn once per level/size)
====================== */

let staticLayer = null;
let staticMaze = null;

function getStaticLayer(maze) {
  if (staticLayer && staticMaze === maze) return staticLayer;

  const dpr = canvasDpr;
  const layer = document.createElement("canvas");
  layer.width = canvas.width;
  layer.height = canvas.height;

  const g = layer.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  drawFloor(g);
  drawWalls(g, maze);

  staticLayer = layer;
  staticMaze = maze;
  return layer;
}

function drawFloor(g) {
  const dpr = canvasDpr;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const band = CELL / 2;

  g.fillStyle = FLOOR_COLOR;
  g.fillRect(0, 0, w, h);

  // Overlapping stripes make a gingham check
  g.fillStyle = GINGHAM_COLOR;
  for (let x = MAZE_PADDING; x < w; x += band * 2) g.fillRect(x, 0, band, h);
  for (let y = MAZE_PADDING; y < h; y += band * 2) g.fillRect(0, y, w, band);
}

/* ======================
   Walls (puffy candy tubes)
====================== */

function drawWalls(g, maze) {
  const dpr = canvasDpr;
  const tube = CELL * WALL_THICKNESS;

  g.lineCap = "round";
  g.lineJoin = "round";

  // Drop shadow
  g.strokeStyle = WALL_SHADOW;
  g.fillStyle = WALL_SHADOW;
  g.lineWidth = tube;
  traceTubes(g, maze, 0, CELL * 0.09);
  g.stroke();
  traceSolidBlocks(g, maze, 0, CELL * 0.09);
  g.fill();

  // Body: rose → violet across the maze
  const gradient = g.createLinearGradient(0, 0, canvas.width / dpr, canvas.height / dpr);
  WALL_GRADIENT.forEach((color, i) => gradient.addColorStop(i / (WALL_GRADIENT.length - 1), color));
  g.strokeStyle = gradient;
  g.fillStyle = gradient;
  g.lineWidth = tube;
  traceTubes(g, maze, 0, 0);
  g.stroke();
  traceSolidBlocks(g, maze, 0, 0);
  g.fill();

  // Glossy highlight along the top
  g.strokeStyle = WALL_GLOSS;
  g.lineWidth = tube * 0.28;
  traceTubes(g, maze, -tube * 0.1, -tube * 0.18, true);
  g.stroke();
}

// Joins the centres of neighbouring wall cells into tube segments.
// With `glossOnly`, skips segments buried inside a solid slab so the
// highlight only runs along the outer top/left edges.
function traceTubes(g, maze, ox, oy, glossOnly = false) {
  const isWall = (x, y) => maze[y]?.[x] === 1;

  g.beginPath();

  maze.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== 1) return;

      const cx = x * CELL + CELL / 2 + MAZE_PADDING + ox;
      const cy = y * CELL + CELL / 2 + MAZE_PADDING + oy;

      const slabAbove = isWall(x, y - 1) && isWall(x + 1, y - 1);
      const slabLeft = isWall(x - 1, y) && isWall(x - 1, y + 1);

      if (row[x + 1] === 1 && !(glossOnly && slabAbove)) {
        g.moveTo(cx, cy);
        g.lineTo(cx + CELL, cy);
      }
      if (maze[y + 1]?.[x] === 1 && !(glossOnly && slabLeft)) {
        g.moveTo(cx, cy);
        g.lineTo(cx, cy + CELL);
      }
    });
  });
}

// Fills the gap inside every 2×2 group of wall cells so thick walls read as one slab
function traceSolidBlocks(g, maze, ox, oy) {
  g.beginPath();

  maze.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (
        cell === 1 &&
        row[x + 1] === 1 &&
        maze[y + 1]?.[x] === 1 &&
        maze[y + 1]?.[x + 1] === 1
      ) {
        g.rect(
          x * CELL + CELL / 2 + MAZE_PADDING + ox,
          y * CELL + CELL / 2 + MAZE_PADDING + oy,
          CELL,
          CELL
        );
      }
    });
  });
}

/* ======================
   Trail (little hearts where you've walked)
====================== */

function heartPath(g, x, y, size) {
  const s = size;
  g.beginPath();
  g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s * 0.6, y - s * 0.05, x - s * 0.3, y - s * 0.55, x, y - s * 0.2);
  g.bezierCurveTo(x + s * 0.3, y - s * 0.55, x + s * 0.6, y - s * 0.05, x, y + s * 0.35);
  g.closePath();
}

function drawTrail(visited) {
  if (!visited || visited.size === 0) return;

  const size = Math.max(6, CELL * 0.24);
  const total = visited.size;
  let i = 0;

  ctx.fillStyle = "#ec4899";

  visited.forEach(key => {
    i++;
    const [x, y] = key.split(",").map(Number);

    // Older steps fade out, recent ones are stronger
    ctx.globalAlpha = 0.12 + 0.28 * (i / total);
    heartPath(
      ctx,
      x * CELL + CELL / 2 + MAZE_PADDING,
      y * CELL + CELL / 2 + MAZE_PADDING,
      size
    );
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

/* ======================
   Exits (option icons + labels)
====================== */

function drawExits(maze, levelIndex, now) {
  const level = levels[levelIndex];
  const pulse = 1 + Math.sin(now / 450) * 0.05;

  maze.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (typeof cell !== "string" || !cell.startsWith("E")) return;

      const cx = x * CELL + CELL / 2 + MAZE_PADDING;
      const cy = y * CELL + CELL / 2 + MAZE_PADDING;

      // Soft glow so exits read as goals
      ctx.fillStyle = "rgba(244,114,182,0.2)";
      ctx.beginPath();
      ctx.arc(cx, cy, CELL * 0.6 * pulse, 0, Math.PI * 2);
      ctx.fill();

      const logo = getLogo(levelIndex, cell);
      if (logo && logo.complete && logo.naturalWidth > 0) {
        const size = CELL * 0.9 * pulse;
        ctx.drawImage(logo, cx - size / 2, cy - size / 2, size, size);
      }

      drawLabel(level?.exits?.[cell], cx, cy + CELL * 0.42);
    });
  });
}

function drawLabel(text, cx, top) {
  if (!text) return;

  const fontSize = Math.round(Math.max(8, Math.min(12, CELL * 0.26)));
  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;

  const padX = fontSize * 0.55;
  const w = ctx.measureText(text).width + padX * 2;
  const h = fontSize + 5;

  // Keep the pill inside the canvas
  const canvasW = canvas.width / canvasDpr;
  const left = Math.min(Math.max(cx - w / 2, 2), canvasW - w - 2);

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.strokeStyle = "#f9a8d4";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(left, top, w, h, h / 2);
  else ctx.rect(left, top, w, h);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#9d174d";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, left + w / 2, top + h / 2 + 0.5);
}



/* ======================
   Player (Smooth Move + Spawn + Hop)
====================== */

function drawPlayer(playerPos, now) {
  if (!playerSpawnStart) {
    playerSpawnStart = now;
    renderPos.x = playerPos.x;
    renderPos.y = playerPos.y;
    lastTargetPos = { ...playerPos };
  }

  if (
    playerPos.x !== lastTargetPos.x ||
    playerPos.y !== lastTargetPos.y
  ) {
    lastTargetPos = { ...playerPos };
  }

  renderPos.x += (lastTargetPos.x - renderPos.x) * MOVE_SPEED;
  renderPos.y += (lastTargetPos.y - renderPos.y) * MOVE_SPEED;

  if (
    Math.abs(renderPos.x - lastTargetPos.x) < 0.001 &&
    Math.abs(renderPos.y - lastTargetPos.y) < 0.001
  ) {
    renderPos.x = lastTargetPos.x;
    renderPos.y = lastTargetPos.y;
  }

  const elapsed = now - playerSpawnStart;
  const t = Math.min(elapsed / SPAWN_DURATION, 1);
  const easeOut = 1 - Math.pow(1 - t, 3);

  const cx = renderPos.x * CELL + CELL / 2 + MAZE_PADDING;
  const cy = renderPos.y * CELL + CELL / 2 + MAZE_PADDING;

  const baseRadius = Math.min(12, CELL * 0.35);
  const size = Math.min(36, CELL * 1.05) * easeOut;

  // Hop while moving, gentle bob while standing still
  const remaining = Math.min(
    1,
    Math.max(Math.abs(lastTargetPos.x - renderPos.x), Math.abs(lastTargetPos.y - renderPos.y))
  );
  const animate = !reduceMotion.matches;
  const hop = animate ? Math.sin(remaining * Math.PI) * CELL * 0.22 : 0;
  const bob = animate && remaining === 0 ? Math.sin(now / 380) * CELL * 0.03 : 0;
  const lift = hop + bob;
  const tilt = animate ? (lastTargetPos.x - renderPos.x) * 0.3 : 0;

  // Soft shadow on the blanket, smaller while in the air
  const shadowScale = 1 - Math.min(0.45, lift / CELL);
  ctx.fillStyle = "rgba(131,24,67,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.42, size * 0.3 * shadowScale, size * 0.1 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  if (avatarImg.complete && avatarImg.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = easeOut;
    ctx.translate(cx, cy - lift);
    ctx.rotate(tilt);

    ctx.drawImage(avatarImg, -size / 2, -size / 2, size, size);

    ctx.restore();
  } else {
    // fallback circle if image not loaded yet
    ctx.fillStyle = "#ec4899";
    ctx.beginPath();
    ctx.arc(cx, cy - lift, baseRadius * easeOut, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ======================
   Celebration (hearts + sparkles when an exit is reached)
====================== */

const particles = [];

export function celebrate(cellX, cellY) {
  if (reduceMotion.matches) return;

  const cx = cellX * CELL + CELL / 2 + MAZE_PADDING;
  const cy = cellY * CELL + CELL / 2 + MAZE_PADDING;
  const count = 22;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const speed = CELL * (0.05 + Math.random() * 0.07);

    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - CELL * 0.04,
      life: 0,
      maxLife: 45 + Math.random() * 30,
      size: CELL * (0.22 + Math.random() * 0.18),
      spin: (Math.random() - 0.5) * 0.2,
      rot: Math.random() * Math.PI,
      sparkle: i % 3 === 0,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length]
    });
  }
}

function sparklePath(g, size) {
  const s = size / 2;
  g.beginPath();
  g.moveTo(0, -s);
  g.quadraticCurveTo(0, 0, s, 0);
  g.quadraticCurveTo(0, 0, 0, s);
  g.quadraticCurveTo(0, 0, -s, 0);
  g.quadraticCurveTo(0, 0, 0, -s);
  g.closePath();
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life++;

    const t = p.life / p.maxLife;
    if (t >= 1) {
      particles.splice(i, 1);
      continue;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.97;
    p.vy = p.vy * 0.97 + CELL * 0.003; // gentle fall
    p.rot += p.spin;

    ctx.save();
    ctx.globalAlpha = 1 - t * t;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    if (p.sparkle) sparklePath(ctx, p.size);
    else heartPath(ctx, 0, 0, p.size);
    ctx.fill();

    ctx.restore();
  }
}


/* ======================
   Reset Helper
====================== */

export function resetPlayerAnimation() {
  playerSpawnStart = null;
  lastTargetPos = null;
}
