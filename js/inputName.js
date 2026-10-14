import { validatePlayerName } from "./player.js";
import { startGame } from "./main.js";
import { startMusic, isMuted, toggleMute } from "./audio.js";


const screen = document.getElementById("inputNameScreen");
const input = document.getElementById("inputNameInput");
const error = document.getElementById("inputNameError");
const button = document.getElementById("inputNameButton");
const muteBtn = document.getElementById("muteBtn");

/* ======================
   Mute Button
====================== */

function renderMuteBtn() {
  const muted = isMuted();
  muteBtn.textContent = muted ? "🔇" : "🔊";
  muteBtn.setAttribute("aria-label", muted ? "Unmute music" : "Mute music");
  muteBtn.setAttribute("aria-pressed", String(muted));
}

muteBtn.addEventListener("click", e => {
  e.stopPropagation();
  toggleMute();
  renderMuteBtn();
});

renderMuteBtn();

/* ======================
   Always show input screen
====================== */

screen.classList.remove("input-name-hidden");

/* ======================
   Submit Handler
====================== */

function submitName() {
  const result = validatePlayerName(input.value);

  if (!result) {
    error.textContent = "Please use 1–16 characters 💕";
    return;
  }

  error.textContent = "";
  screen.classList.add("input-name-hidden");

  startMusic();      // 🎵 STARTS HERE (guaranteed allowed)
  startGame(result); // game logic only
}

button.addEventListener("click", submitName);

input.addEventListener("keydown", e => {
  if (e.key === "Enter") submitName();
});
