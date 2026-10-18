import assert from "node:assert/strict";
import { test } from "node:test";
import type { Theme } from "@earendil-works/pi-coding-agent";
import type { TUI } from "@earendil-works/pi-tui";
import { NotesEditor } from "../src/index.js";

const theme = { fg: (_color: string, text: string) => text } as Theme;
const tui = { requestRender() {}, terminal: { rows: 30, columns: 100 } } as unknown as TUI;

for (const chunks of [
  ["\x1b[200~first\nsecond\n\x1b[201~"],
  ["\x1b[200~", "first", "\r", "second", "\r", "\x1b[201~"],
  ["first\nsecond\n"],
]) {
  test(`multiline paste stays in modal: ${JSON.stringify(chunks)}`, () => {
    let closed = false;
    const editor = new NotesEditor(tui, theme, () => { closed = true; });
    for (const chunk of chunks) editor.handleInput(chunk);
    assert.equal(closed, false);
    assert.equal(editor.getExpandedText(), "first\nsecond\n");
    editor.handleInput("\r");
    assert.equal(closed, true);
  });
}
