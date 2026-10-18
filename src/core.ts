export function appendNotes(prompt: string, notes: string): string {
  if (!notes.trim()) return prompt;
  return prompt + (prompt && !prompt.endsWith("\n") ? "\n" : "") + notes;
}

export function readShortcut(config: unknown): string {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    throw new Error("Expected a JSON object");
  }
  const value = (config as Record<string, unknown>).shortcut ?? "ctrl+enter";
  if (typeof value !== "string" || !/^(?:(?:ctrl|shift|alt|super)\+)*(?:[a-z0-9]|f(?:[1-9]|1[0-2])|escape|enter|tab|space|backspace|delete|insert|home|end|pageUp|pageDown|up|down|left|right)$/.test(value)) {
    throw new Error("Invalid shortcut; example: ctrl+alt+n");
  }
  return value;
}
