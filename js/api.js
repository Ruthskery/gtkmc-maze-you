const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://gtkmc-maze-server.onrender.com";

export function sendMazeResult(data) {
  fetch(`${API_BASE}/api/maze-result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}
