import { levels } from "./levels.js";
import { drawMaze, resizeCanvas, resetPlayerAnimation, celebrate } from "./rendererCanvas.js";
import { sendMazeResult } from "./api.js";
import { showMessage, isDialogueActive, waitForConversationAdvance } from "./conversation.js";
import { playDing } from "./audio.js";


/* ======================
   State
====================== */

let currentLevel = 0;
let maze = [];
let playerPos = { x: 1, y: 1 };
let visited = new Set();
let choiceHistory = [];
let playerName = null;

let fade = 0;
let fading = false;

let exitLocked = false;

/* ======================
   DOM
====================== */

const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

const titleEl = document.querySelector("h1");
const subtitleEl = document.querySelector(".subtitle");
const resultScreen = document.getElementById("resultScreen");
const resultText = document.getElementById("resultText");
const resultList = document.getElementById("resultList");
const resultName = document.getElementById("resultName");
const restartBtn = document.getElementById("restartBtn");
const resultCard = document.getElementById("resultCard");
const endCredits = document.getElementById("endCredits");
const playAgainBtn = document.getElementById("playAgainBtn");

restartBtn.addEventListener("click", () => {
  resultCard.classList.add("opacity-0");

  setTimeout(() => {
    resultCard.classList.add("hidden");
    endCredits.classList.remove("hidden");

    requestAnimationFrame(() => {
      endCredits.classList.remove("opacity-0");
    });
  }, 500);
});

playAgainBtn.addEventListener("click", e => {
  e.stopPropagation();

  // Put the result screen back the way it starts
  resultScreen.classList.add("hidden");
  resultCard.classList.remove("hidden", "opacity-0");
  endCredits.classList.add("hidden", "opacity-0");

  currentLevel = 0;
  choiceHistory = [];
  loadLevel(currentLevel);
});

/* ======================
   Level Handling
====================== */

function loadLevel(index) {
  const level = levels[index];
  maze = level.maze;
  playerPos = { x: 1, y: 1 };
  visited = new Set(["1,1"]);
  exitLocked = false;

  // Respawn at the start instead of gliding back through the walls
  resetPlayerAnimation();
  if (index > 0) {
    fade = 1;
    fading = true;
  }

  resizeCanvas(index);

  titleEl.textContent = `${level.title} 💕`;
  subtitleEl.textContent = level.subtitle;

  showMessage(level.subtitle, "me");
}

/* ======================
   Delay/Thinking
====================== */
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/* ======================
   Dialogoue
====================== */

async function playDialogue(lines) {
  for (const line of lines) {
    showMessage(line.text, line.who);
    await waitForConversationAdvance();
  }
}

/* ======================
   Exit Handling
====================== */

async function handleExit(exitKey) {
  playDing(); 

  const level = levels[currentLevel];
  exitLocked = true;

  const dialogue = level.dialogue?.[exitKey];

  if (dialogue) {
    await playDialogue(dialogue);
  } else {
  showMessage(level.exits[exitKey], "me");
  await waitForConversationAdvance();

  showMessage("Interesting choice 💕", "her");
  await waitForConversationAdvance();
}

  choiceHistory.push({
    category: level.title,
    choice: level.exits[exitKey],
    icon: level.logos?.[exitKey]
  });

  currentLevel++;
  exitLocked = false;

  if (currentLevel >= levels.length) {
    showResultScreen();
  } else {
    loadLevel(currentLevel);
  }
}


/* ======================
   Result Screen
====================== */

function showResultScreen() {
  resultList.innerHTML = "";

  choiceHistory.forEach((entry, i) => {
    const li = document.createElement("li");
    li.className = "plan-item";
    li.style.setProperty("--i", i);

    if (entry.icon) {
      const img = document.createElement("img");
      img.className = "plan-icon";
      img.src = entry.icon;
      img.alt = "";
      li.appendChild(img);
    }

    const category = document.createElement("span");
    category.className = "plan-category";
    category.textContent = entry.category;

    const choice = document.createElement("span");
    choice.className = "plan-choice font-display";
    choice.textContent = entry.choice;

    li.append(category, choice);
    resultList.appendChild(li);
  });

  resultName.textContent = playerName || "you";
  resultText.textContent = generatePersonality(choiceHistory);
  resultScreen.classList.remove("hidden");

  // 🔔 Send to Discord via backend
  sendResultToServer();
}

/* ======================
   Send the Result to SERVER
====================== */

function sendResultToServer() {
  console.log("🔥 sendResultToServer CALLED");

  if (!playerName) {
    console.log("❌ No playerName, aborting");
    return;
  }

  const payload = {
    playerName,
    choices: choiceHistory.map(c => `${c.category}: ${c.choice}`),
    personality: generatePersonality(choiceHistory),
    won: true
  };

  console.log("📦 Payload:", payload);

  sendMazeResult(payload);
}


const choiceTraits = {
  McDo: "you like the classics",
  Jollibee: "you love comfort food",
  Chowking: "you're up for something different",
  Starbucks: "a comfy coffee run is your thing",
  Chagee: "you've got fancy taste in drinks",
  Coco: "you've got a sweet tooth",
  Mall: "you enjoy lively places",
  Beach: "you love to relax and unwind",
  Park: "you appreciate calm, simple moments",
  Morning: "you're a morning person",
  Afternoon: "you like easy afternoons",
  Night: "you come alive at night"
};

function generatePersonality(history) {
  const traits = history
    .map(h => choiceTraits[h.choice])
    .filter(Boolean);

  if (traits.length === 0) {
    return "You love exploring feelings and connections 💕✨";
  }

  const last = traits.pop();
  const list = traits.length ? `${traits.join(", ")}, and ${last}` : last;
  return `From what you picked, ${list} 💕✨`;
}

/* ======================
   Movement
====================== */

function movePlayer(dx, dy) {
  if (exitLocked) return;
  if (isDialogueActive()) return; // ✅ WORKS NOW

  const nx = playerPos.x + dx;
  const ny = playerPos.y + dy;

  if (!maze[ny] || maze[ny][nx] === 1) return;

  playerPos = { x: nx, y: ny };
  visited.add(`${nx},${ny}`);

  const cell = maze[ny][nx];
  if (typeof cell === "string" && cell.startsWith("E")) {
    exitLocked = true;
    celebrate(nx, ny);
    handleExit(cell);
  }
}

/* ======================
   Game Loop
====================== */

function gameLoop() {
  drawMaze(maze, playerPos, currentLevel, visited);

  if (fading) {
    fade -= 0.05;
    if (fade <= 0) fading = false;

    // Soft pink fade overlay
    ctx.fillStyle = `rgba(253,164,175,${fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(gameLoop);
}

/* ======================
   Controls
====================== */

// Keyboard (arrows + WASD)
const keyDirs = {
  ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
};

document.addEventListener("keydown", e => {
  if (!playerName || e.target instanceof HTMLInputElement) return;

  const dir = keyDirs[e.key];
  if (!dir) return;

  e.preventDefault(); // stop arrow keys from scrolling the page
  movePlayer(...dir);
});

// Click arrows
document.querySelectorAll(".arrow").forEach(btn => {
  btn.addEventListener("click", () => {
    const dir = btn.dataset.dir;
    if (dir === "up") movePlayer(0, -1);
    if (dir === "down") movePlayer(0, 1);
    if (dir === "left") movePlayer(-1, 0);
    if (dir === "right") movePlayer(1, 0);
  });
});

// Swipe
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", e => {
  if (isDialogueActive()) return; // 👈 ADD THIS

  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
});

canvas.addEventListener("touchend", e => {
  if (isDialogueActive()) return; // 👈 ADD THIS

  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) movePlayer(1, 0);
    if (dx < -30) movePlayer(-1, 0);
  } else {
    if (dy > 30) movePlayer(0, 1);
    if (dy < -30) movePlayer(0, -1);
  }
});

/* ======================
   Window Resize Handler
====================== */

let resizeTimeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    resizeCanvas(Math.min(currentLevel, levels.length - 1));
  }, 150);
}

window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    resizeCanvas(Math.min(currentLevel, levels.length - 1));
  }, 300);
});

/* ======================
   Start
====================== */

export function startGame(name) {
  playerName = name;
  loadLevel(currentLevel);
  gameLoop();
}
