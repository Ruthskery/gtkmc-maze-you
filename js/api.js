const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:4000" // 3000/3001 are used by the portfolio dev server
    : "https://gtkmc-maze-server.onrender.com";

// Render's free tier sleeps when idle and takes ~1 min to wake,
// so ping it on load — it's awake by the time the maze is finished
export function wakeServer() {
  fetch(`${API_BASE}/health`).catch(() => {});
}

// Long enough for a cold start plus the server's own Discord retries
const SEND_TIMEOUT_MS = 60000;

export async function sendMazeResult(data) {
  try {
    const res = await fetch(`${API_BASE}/api/maze-result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("Failed to send maze result", res.status, body.error || "");
    }
  } catch (err) {
    if (err.name === "TimeoutError") {
      console.error(`Maze result: no response from the server after ${SEND_TIMEOUT_MS / 1000}s`);
    } else {
      console.error("Network error:", err);
    }
  }
}

