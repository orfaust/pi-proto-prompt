import assert from "node:assert/strict";
import { test } from "node:test";
import type { Theme } from "@earendil-works/pi-coding-agent";
import type { TUI } from "@earendil-works/pi-tui";
import { NotesEditor } from "../src/index.js";

const theme = { fg: (_color: string, text: string) => text } as Theme;
const tui = { requestRender() {}, terminal: { rows: 30, columns: 100 } } as unknown as TUI;
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("Ctrl+C clears text and saved draft without closing", () => {
  let closed = false;
  let draft = "old text";
  const editor = new NotesEditor(tui, theme, () => { closed = true; }, draft, (text) => { draft = text; });
  editor.handleInput("\x03");
  assert.equal(editor.getExpandedText(), "");
  assert.equal(draft, "");
  assert.equal(closed, false);
});

test("Alt+V inserts multiline clipboard text without confirming", async () => {
  let closed = false;
  let draft = "prefix ";
  const editor = new NotesEditor(tui, theme, () => { closed = true; }, draft, (text) => { draft = text; }, async () => "first\r\nsecond\n");
  editor.handleInput("\x1bv");
  await tick();
  assert.equal(editor.getExpandedText(), "prefix first\nsecond\n");
  assert.equal(draft, editor.getExpandedText());
  assert.equal(closed, false);
});

for (const key of ["\x03", "\x1b"]) {
  test(`pending clipboard read is discarded after ${JSON.stringify(key)}`, async () => {
    let resolve!: (text: string) => void;
    const editor = new NotesEditor(tui, theme, () => {}, "old", () => {}, () => new Promise((done) => { resolve = done; }));
    editor.handleInput("\x1bv");
    editor.handleInput(key);
    resolve("stale clipboard");
    await tick();
    assert.equal(editor.getExpandedText(), key === "\x03" ? "" : "old");
  });
}

test("clipboard errors stay in modal without changing the draft", async () => {
  const editor = new NotesEditor(tui, theme, () => {}, "draft", () => {}, async () => { throw new Error("Clipboard unavailable"); });
  editor.handleInput("\x1bv");
  await tick();
  assert.equal(editor.getExpandedText(), "draft");
  assert.ok(editor.render(80).some((line) => line.includes("Clipboard unavailable")));
});
