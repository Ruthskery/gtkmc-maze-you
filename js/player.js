export function validatePlayerName(name) {
  if (name === null) return "Guest";

  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 16) return null;

  return trimmed;
}
