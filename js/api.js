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

export async function sendMazeResult(data) {
  try {
    const res = await fetch(`${API_BASE}/api/maze-result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      console.error("Failed to send maze result", res.status);
    }
  } catch (err) {
    console.error("Network error:", err);
  }
}

