import assert from "node:assert/strict";
import { test } from "node:test";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { visibleWidth, type TUI } from "@earendil-works/pi-tui";
import { appendNotes, readShortcut } from "../src/core.js";
import { NotesEditor } from "../src/index.js";

const theme = { fg: (_color: string, text: string) => text } as Theme;
const tui = { requestRender() {}, terminal: { rows: 30, columns: 100 } } as unknown as TUI;

test("append preserves prompt and separates notes without trimming content", () => {
  assert.equal(appendNotes("prompt", " note\nseconda"), "prompt\n note\nseconda");
  assert.equal(appendNotes("prompt\n", "note"), "prompt\nnote");
  assert.equal(appendNotes("", "note"), "note");
  assert.equal(appendNotes("originale", " \n"), "originale");
});

test("global shortcut defaults and validates configuration", () => {
  assert.equal(readShortcut({}), "ctrl+k");
  assert.equal(readShortcut({ shortcut: "ctrl+alt+n" }), "ctrl+alt+n");
  for (const config of [null, [], { shortcut: 42 }, { shortcut: "not-a-key" }]) {
    assert.throws(() => readShortcut(config));
  }
});

test("Enter returns Unicode multiline notes; Esc cancels", () => {
  let result: string | undefined = "pending";
  const editor = new NotesEditor(tui, theme, (value) => { result = value; });
  editor.setText("Caffè 日本語\nseconda riga");
  editor.handleInput("\r");
  assert.equal(result, "Caffè 日本語\nseconda riga");
  const cancelled = new NotesEditor(tui, theme, (value) => { result = value; });
  cancelled.setText("discard");
  cancelled.handleInput("\x1b");
  assert.equal(result, undefined);
});

test("Ctrl+J inserts newline rather than confirming", () => {
  let submitted = false;
  const editor = new NotesEditor(tui, theme, () => { submitted = true; });
  editor.setText("prima");
  editor.handleInput("\n");
  assert.equal(submitted, false);
  assert.equal(editor.getText(), "prima\n");
});

test("render remains within narrow terminal widths", () => {
  const editor = new NotesEditor(tui, theme, () => {});
  editor.focused = true;
  editor.setText("日本語 emoji 🎉 e una nota abbastanza lunga");
  for (const width of [10, 20, 40, 80]) {
    for (const line of editor.render(width)) assert.ok(visibleWidth(line) <= width);
  }
});
