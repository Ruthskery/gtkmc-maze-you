// audio.js
export const bgMusic = new Audio("assets/sounds/background.mp3");
const ding = new Audio("assets/sounds/ding.mp3");

let muted = false;
try {
  muted = localStorage.getItem("maze-muted") === "1";
} catch {}

bgMusic.loop = true;
bgMusic.muted = muted;
ding.muted = muted;
bgMusic.volume = 0.4;
ding.volume = 0.7;

export function startMusic() {
  bgMusic.currentTime = 0;
  bgMusic.volume = 0;
  bgMusic.play().catch(err => {
    console.error("Music failed to start:", err);
    return;
  });

  // Fade in
  let v = 0;
  const fade = setInterval(() => {
    v += 0.05;
    bgMusic.volume = Math.min(v, 0.4);
    if (v >= 0.4) clearInterval(fade);
  }, 100);
}

export function stopMusic() {
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

// 🔔 Ding sound (endpoint chosen)
export function playDing() {
  ding.currentTime = 0; // allows rapid reuse
  ding.play().catch(err => {
    console.error("Ding failed:", err);
  });
}

// 🔇 Mute toggle (remembered between visits)
export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  bgMusic.muted = muted;
  ding.muted = muted;

  try {
    localStorage.setItem("maze-muted", muted ? "1" : "0");
  } catch {}

  return muted;
}
