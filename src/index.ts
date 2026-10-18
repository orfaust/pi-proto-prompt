import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir, type ExtensionAPI, type ExtensionContext, type Theme } from "@earendil-works/pi-coding-agent";
import { Editor, matchesKey, truncateToWidth, visibleWidth, type KeyId, type TUI } from "@earendil-works/pi-tui";
import { appendNotes, readShortcut } from "./core.js";

export class NotesEditor extends Editor {
  constructor(tui: TUI, private colors: Theme, done: (value: string | undefined) => void, initialText = "", saveDraft: (text: string) => void = () => {}) {
    const muted = (text: string) => colors.fg("muted", text);
    super(tui, {
      borderColor: (text) => colors.fg("accent", text),
      selectList: {
        selectedPrefix: (text) => colors.fg("accent", text),
        selectedText: (text) => colors.fg("accent", text),
        description: muted,
        scrollInfo: muted,
        noMatch: muted,
      },
    });
    this.setText(initialText);
    this.onChange = () => saveDraft(this.getExpandedText());
    this.onSubmit = (text) => done(text);
    this.handleInput = (data: string) => {
      if (matchesKey(data, "escape")) done(undefined);
      else if (matchesKey(data, "shift+enter") || matchesKey(data, "ctrl+j") || data === "\n") this.insertTextAtCursor("\n");
      else if (matchesKey(data, "enter")) done(this.getExpandedText());
      else super.handleInput(data);
      tui.requestRender();
    };
  }

  override render(width: number): string[] {
    if (width < 4) return super.render(width);
    const innerWidth = width - 2;
    const border = (text: string) => this.colors.fg("accent", text);
    const row = (text: string) => {
      const content = truncateToWidth(text, innerWidth);
      return border("│") + content + " ".repeat(Math.max(0, innerWidth - visibleWidth(content))) + border("│");
    };
    return [
      border("┌" + "─".repeat(innerWidth) + "┐"),
      row(this.colors.fg("accent", " Notes · Proto Prompt")),
      ...super.render(innerWidth).slice(1, -1).map(row),
      row(this.colors.fg("muted", " Enter: transfer · Shift+Enter: new line · Esc: keep draft")),
      border("└" + "─".repeat(innerWidth) + "┘"),
    ];
  }
}

export default function (pi: ExtensionAPI) {
  const configPath = join(getAgentDir(), "pi-proto-prompt.json");
  let shortcut = "ctrl+enter";
  let configError: string | undefined;
  try {
    shortcut = readShortcut(JSON.parse(readFileSync(configPath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      configError = `Proto Prompt: ${configPath}: ${String(error)}. Using ctrl+enter.`;
    }
  }
  pi.on("session_start", async (_event, ctx) => {
    if (configError && ctx.hasUI) ctx.ui.notify(configError, "warning");
  });

  let open = false;
  let draft = "";
  async function showNotes(ctx: ExtensionContext) {
    if (ctx.mode !== "tui" || open) return;
    open = true;
    let modalTui: TUI | undefined;
    const prompt = ctx.ui.getEditorText();
    draft = appendNotes(draft, prompt);
    ctx.ui.setEditorText("");
    try {
      const notes = await ctx.ui.custom<string | undefined>(
        (tui, theme, _keys, done) => {
          modalTui = tui;
          return new NotesEditor(tui, theme, done, draft, (text) => { draft = text; });
        },
        { overlay: true, overlayOptions: { anchor: "center", width: "80%", maxHeight: "70%" } },
      );
      if (notes !== undefined) {
        ctx.ui.setEditorText(appendNotes(ctx.ui.getEditorText(), notes));
        draft = "";
      }
    } finally {
      open = false;
      // setEditorText does not schedule a render after the overlay promise resolves.
      modalTui?.requestRender();
    }
  }
  pi.registerShortcut(shortcut as KeyId, {
    description: "Proto Prompt: open notes editor",
    handler: showNotes,
  });
  pi.registerCommand("proto-prompt", {
    description: "Open notes editor and import the current prompt",
    handler: async (_args, ctx) => showNotes(ctx),
  });
}
