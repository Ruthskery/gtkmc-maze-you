import { levels } from "./levels.js";

export let CELL = 34;
const MAZE_PADDING = 12;

const avatarImg = new Image();
avatarImg.src = "assets/images/avatar/bg-danica-cartoon.png";

const logoCache = {};
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

/* ======================
   Hi-DPI Fix
====================== */

export function resizeCanvas(currentLevel = 0) {
  const dpr = window.devicePixelRatio || 1;
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
    const rightPanelWidth = 260;
    const gap = 24;
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
}



/* ======================
   Visual Settings
====================== */

// const MAZE_PADDING = 12;

// Soft pink walls ✨
const WALL_COLOR = "#f472b6";
const WALL_WIDTH = 4;

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

/* ======================
   Main Draw
====================== */

export function drawMaze(maze, playerPos, levelIndex) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawWalls(maze);
  drawExits(maze, levelIndex);
  drawPlayer(playerPos, performance.now());
}

/* ======================
   Walls
====================== */

function drawWalls(maze) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Soft glow behind walls
  ctx.save();
  ctx.strokeStyle = "rgba(236,72,153,0.25)";
  ctx.lineWidth = WALL_WIDTH + 2;
  traceWalls(maze);
  ctx.stroke();
  ctx.restore();

  // Main pink walls
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = WALL_WIDTH;
  traceWalls(maze);
  ctx.stroke();
}

function traceWalls(maze) {
  ctx.beginPath();

  maze.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== 1) return;

      const px = x * CELL + MAZE_PADDING;
      const py = y * CELL + MAZE_PADDING;

      if (maze[y - 1]?.[x] !== 1) {
        ctx.moveTo(px, py);
        ctx.lineTo(px + CELL, py);
      }
      if (row[x + 1] !== 1) {
        ctx.moveTo(px + CELL, py);
        ctx.lineTo(px + CELL, py + CELL);
      }
      if (maze[y + 1]?.[x] !== 1) {
        ctx.moveTo(px + CELL, py + CELL);
        ctx.lineTo(px, py + CELL);
      }
      if (row[x - 1] !== 1) {
        ctx.moveTo(px, py + CELL);
        ctx.lineTo(px, py);
      }
    });
  });
}

/* ======================
   Exits (LOGOS)
====================== */

function drawExits(maze, levelIndex) {
  maze.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (typeof cell === "string" && cell.startsWith("E")) {
        const cx = x * CELL + CELL / 2 + MAZE_PADDING;
        const cy = y * CELL + CELL / 2 + MAZE_PADDING;

        const logo = getLogo(levelIndex, cell);

        if (logo && logo.complete && logo.naturalWidth > 0) {
          const size = 26;

          ctx.save();

          // draw logo ONLY (no background circle)
          ctx.drawImage(
            logo,
            cx - size / 2,
            cy - size / 2,
            size,
            size
          );

          ctx.restore();
        }
      }
    });
  });
}



/* ======================
   Player (Smooth Move + Spawn)
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

  if (Math.abs(renderPos.x - lastTargetPos.x) < 0.001) {
    renderPos.x = lastTargetPos.x;
    renderPos.y = lastTargetPos.y;
  }

  const elapsed = now - playerSpawnStart;
  const t = Math.min(elapsed / SPAWN_DURATION, 1);
  const easeOut = 1 - Math.pow(1 - t, 3);

  const cx = renderPos.x * CELL + CELL / 2 + MAZE_PADDING;
  const cy = renderPos.y * CELL + CELL / 2 + MAZE_PADDING;

  const baseRadius = 12;
  const size = baseRadius * 3 * easeOut;

  if (avatarImg.complete && avatarImg.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = easeOut;

    // avatar ONLY (no background circle)
    ctx.drawImage(
      avatarImg,
      cx - size / 2,
      cy - size / 2,
      size,
      size
    );

    ctx.restore();
  } else {
    // fallback circle if image not loaded yet
    ctx.fillStyle = "#ec4899";
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * easeOut, 0, Math.PI * 2);
    ctx.fill();
  }
}


/* ======================
   Reset Helper
====================== */

export function resetPlayerAnimation() {
  playerSpawnStart = null;
  lastTargetPos = null;
}
