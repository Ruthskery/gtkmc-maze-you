export function sendMazeResult(data) {
  fetch("https://gtkmc-maze-server.onrender.com/api/maze-result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}
