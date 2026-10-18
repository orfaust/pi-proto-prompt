import { mkdir, writeFile } from "node:fs/promises";
import { stripVTControlCharacters } from "node:util";
import type { Theme } from "@earendil-works/pi-coding-agent";
import type { TUI } from "@earendil-works/pi-tui";
import { NotesEditor } from "../src/index.js";
import { appendNotes } from "../src/core.js";

// Capture real NotesEditor renders, not a hand-drawn approximation of the modal.
const frames: { caption: string; seconds: number; lines: string[] }[] = [];
const theme = { fg: (_color: string, text: string) => text } as Theme;
const tui = { requestRender() {}, terminal: { rows: 36, columns: 96 } } as unknown as TUI;
let prompt = "Help me plan a small TypeScript project.";
let draft = "";
let editor: NotesEditor | undefined;
const clipboardText = "Include unit tests.\nKeep the implementation simple.";

function capture(caption: string, seconds = 2) {
  const lines = ["PI  /  EXTENSION DEMO", "", "Prompt", prompt || "(empty)", ""];
  if (editor) lines.push(...editor.render(90));
  else lines.push("Press Ctrl+Alt+P to open Proto Prompt.");
  frames.push({ caption, seconds, lines: lines.map((line) => stripVTControlCharacters(line.replace(/\x1b_pi:[^\x07]*\x07/g, ""))) });
}
function open() {
  draft = appendNotes(draft, prompt);
  prompt = "";
  editor = new NotesEditor(tui, theme, (text) => {
    if (text !== undefined) { prompt = text; draft = ""; }
    editor = undefined;
  }, draft, (text) => { draft = text; }, async () => clipboardText);
  editor.focused = true;
}
function type(text: string) {
  for (const char of text) editor!.handleInput(char);
}

capture("Start with an existing prompt.", 2);
open();
capture("Ctrl+Alt+P  |  Move the current prompt into Proto Prompt.", 3);
editor!.handleInput("\n");
type("Use TypeScript and add a short README.");
capture("Write notes. Use Shift+Enter or Ctrl+J for a new line.", 3);
editor!.handleInput("\x1b");
capture("Esc  |  Close the modal and keep the draft.", 2);
open();
capture("Ctrl+Alt+P  |  Reopen the saved draft.", 2);
editor!.handleInput("\x03");
capture("Ctrl+C  |  Clear all text without closing the modal.", 2);
editor!.handleInput("\x1bv");
await new Promise((resolve) => setImmediate(resolve));
capture("Alt+V  |  Paste multiline clipboard text safely.", 3);
await new Promise((resolve) => setTimeout(resolve, 250));
editor!.handleInput("\r");
capture("Enter  |  Transfer the text to the prompt. Nothing is sent to the model.", 3);
// Clear the main prompt before reopening, since opening imports its contents.
prompt = "";
capture("Clear the main prompt before checking the saved draft.", 1);
open();
capture("The previous transfer cleared the modal draft.", 2);
editor!.handleInput("\x1b");
await mkdir(".demo", { recursive: true });
await writeFile(".demo/frames.json", JSON.stringify(frames, null, 2));
console.log(`Captured ${frames.length} real component states.`);
