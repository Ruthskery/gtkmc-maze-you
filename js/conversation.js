// ======================
// Element refs
// ======================
const card = document.getElementById("conversationCard");
const row = document.getElementById("conversationRow");
const avatar = document.getElementById("conversationAvatar");
const speaker = document.getElementById("speakerLabel");
const text = document.getElementById("messageText");
const live = document.getElementById("messageLive");
const tapHint = document.getElementById("tapHint");
const options = document.getElementById("conversationOptions");

// ======================
// Avatars + names
// ======================
const avatars = {
  her: "assets/images/avatar/bg-danica-cartoon.png", // You / the one answering
  me:  "assets/images/avatar/bg-cyril-cartoon.png"   // Me
};

const names = {
  her: "You",
  me: "Cy"
};

// ======================
// Timing
// ======================
const TYPING_DOTS_MS = 450; // "…" before the line starts
const CHAR_MS = 26;         // typewriter speed

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let waitingForTap = false;
let waitingForChoice = false;
let revealing = false;
let lastSpeaker = null;
let onChoiceSelect = null;

let dotsTimer = null;
let revealTimer = null;
let fullMessage = "";

function hideConversation() {
  card.classList.add("is-hidden");
}

function showConversation() {
  card.classList.remove("is-hidden");
}

// Restart a CSS animation class on an element
function replayAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

// ======================
// Typing dots
// ======================
function showTyping(who) {
  row.className = `conversation-row ${who}`;
  card.dataset.who = who;

  speaker.textContent = names[who];

  // Pop the avatar in when the speaker changes
  if (who !== lastSpeaker || !avatar.classList.contains("avatar-show")) {
    avatar.src = avatars[who];
    replayAnimation(avatar, "avatar-show");
  }
  lastSpeaker = who;

  text.classList.remove("is-typing");
  text.innerHTML = `
    <span class="typing">
      <span></span><span></span><span></span>
    </span>
  `;
}

// ======================
// Typewriter reveal
// ======================
function typeOut(message) {
  fullMessage = message;
  live.textContent = message; // screen readers get the full line at once

  if (reduceMotion.matches) {
    finishReveal();
    return;
  }

  const chars = Array.from(message); // keeps emoji whole
  let shown = 0;

  revealing = true;
  text.textContent = "";
  text.classList.add("is-typing");

  revealTimer = setInterval(() => {
    shown++;
    text.textContent = chars.slice(0, shown).join("");
    if (shown >= chars.length) finishReveal();
  }, CHAR_MS);
}

function finishReveal() {
  clearInterval(revealTimer);
  revealing = false;

  text.textContent = fullMessage;
  text.classList.remove("is-typing");

  waitingForTap = true;
  tapHint.classList.remove("hidden");
}

// ======================
// Show message
// ======================
export function showMessage(message, who = "her") {
  clearTimeout(dotsTimer);
  clearInterval(revealTimer);

  waitingForTap = false;
  waitingForChoice = false;
  revealing = false;

  const wasHidden = card.classList.contains("is-hidden");
  showConversation();
  if (!wasHidden) replayAnimation(card, "is-new-line");

  tapHint.classList.add("hidden");
  options.innerHTML = "";

  showTyping(who);

  dotsTimer = setTimeout(() => typeOut(message), TYPING_DOTS_MS);
}

// ======================
// Show choices (from main.js)
// ======================
export function showChoices(choices, callback) {
  waitingForChoice = true;
  onChoiceSelect = callback;
  options.innerHTML = "";

  choices.forEach(label => {
    const btn = document.createElement("button");
    btn.textContent = label;

    btn.onclick = e => {
      e.stopPropagation();
      waitingForChoice = false;
      options.innerHTML = "";
      showMessage(label, "me");
      onChoiceSelect?.(label);
    };

    options.appendChild(btn);
  });
}

// ======================
// click + space handlers
// ======================
function advanceDialogue() {
  tapHint.classList.add("hidden");
  waitingForTap = false;
  hideConversation();

  if (advanceResolver) {
    advanceResolver();
    advanceResolver = null;
  }
}

// First tap finishes the line, second tap moves on
function handleAdvanceInput() {
  if (waitingForChoice) return false;

  if (revealing) {
    finishReveal();
    return true;
  }

  if (!waitingForTap) return false;

  advanceDialogue();
  return true;
}

function globalAdvanceHandler(e) {
  if (!revealing && !waitingForTap) return;
  if (e.target.closest?.("[data-no-advance]")) return;

  if (e.type === "touchend") {
    e.preventDefault(); // stop the follow-up click from advancing twice
  }

  handleAdvanceInput();
}


export function isDialogueActive() {
  return !card.classList.contains("is-hidden");
}

document.addEventListener("click", globalAdvanceHandler);
document.addEventListener("touchend", globalAdvanceHandler, { passive: false });

document.addEventListener("keydown", e => {
  if (e.code !== "Space") return;
  if (handleAdvanceInput()) e.preventDefault();
});

let advanceResolver = null;

export function waitForConversationAdvance() {
  return new Promise(resolve => {
    advanceResolver = resolve;
  });
}
