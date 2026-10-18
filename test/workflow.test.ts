import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import type { TUI } from "@earendil-works/pi-tui";
import extension, { NotesEditor } from "../src/index.js";

test("imports prompt, retains cancelled draft, transfers once and renders immediately", async () => {
  let handler!: (ctx: ExtensionContext) => Promise<void>;
  extension({
    on() {},
    registerShortcut(_key: unknown, options: { handler: typeof handler }) { handler = options.handler; },
    registerCommand() {},
  } as unknown as ExtensionAPI);
  let prompt = "Original prompt";
  let renders = 0;
  let action = "cancel";
  const theme = { fg: (_color: string, text: string) => text } as Theme;
  const tui = { requestRender() { renders++; }, terminal: { rows: 30, columns: 100 } } as unknown as TUI;
  const ctx = {
    mode: "tui",
    ui: {
      getEditorText: () => prompt,
      setEditorText: (text: string) => { prompt = text; },
      custom: (factory: (tui: TUI, theme: Theme, keys: unknown, done: (value: string | undefined) => void) => NotesEditor) =>
        new Promise<string | undefined>((resolve) => {
          const editor = factory(tui, theme, undefined, resolve);
          if (action === "cancel") {
            assert.equal(editor.getExpandedText(), "Original prompt");
            editor.handleInput("\n");
            editor.handleInput("N");
            editor.handleInput("\x1b");
          } else if (action === "confirm") {
            assert.equal(editor.getExpandedText(), "Original prompt\nN\nNew prompt");
            editor.handleInput("\r");
          } else {
            assert.equal(editor.getExpandedText(), "");
            editor.handleInput("\x1b");
          }
        }),
    },
  } as unknown as ExtensionContext;
  await handler(ctx);
  assert.equal(prompt, "");
  prompt = "New prompt";
  action = "confirm";
  const before = renders;
  await handler(ctx);
  assert.equal(prompt, "Original prompt\nN\nNew prompt");
  assert.ok(renders >= before + 2, "render requested after overlay closure as well as input");
  prompt = "";
  action = "empty";
  await handler(ctx);
});
