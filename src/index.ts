import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir, type ExtensionAPI, type ExtensionContext, type Theme } from "@earendil-works/pi-coding-agent";
import { Editor, matchesKey, truncateToWidth, type KeyId, type TUI } from "@earendil-works/pi-tui";
import { appendNotes, readShortcut } from "./core.js";

export class NotesEditor extends Editor {
  constructor(tui: TUI, private colors: Theme, done: (value: string | undefined) => void) {
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
    return [
      truncateToWidth(this.colors.fg("accent", " Note · Proto Prompt"), width),
      ...super.render(width),
      truncateToWidth(this.colors.fg("muted", " Invio: accoda · Shift+Invio: nuova riga · Esc: annulla"), width),
    ];
  }
}

export default function (pi: ExtensionAPI) {
  const configPath = join(getAgentDir(), "pi-proto-prompt.json");
  let shortcut = "ctrl+k";
  let configError: string | undefined;
  try {
    shortcut = readShortcut(JSON.parse(readFileSync(configPath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      configError = `Proto Prompt: ${configPath}: ${String(error)}. Using ctrl+k.`;
    }
  }
  pi.on("session_start", async (_event, ctx) => {
    if (configError && ctx.hasUI) ctx.ui.notify(configError, "warning");
  });

  let open = false;
  async function showNotes(ctx: ExtensionContext) {
    if (ctx.mode !== "tui" || open) return;
    open = true;
    try {
      const notes = await ctx.ui.custom<string | undefined>(
        (tui, theme, _keys, done) => new NotesEditor(tui, theme, done),
        { overlay: true, overlayOptions: { anchor: "center", width: "80%", maxHeight: "70%" } },
      );
      if (notes !== undefined && notes.trim()) {
        ctx.ui.setEditorText(appendNotes(ctx.ui.getEditorText(), notes));
      }
    } finally {
      open = false;
    }
  }
  pi.registerShortcut(shortcut as KeyId, {
    description: "Proto Prompt: apri note da accodare al prompt",
    handler: showNotes,
  });
  pi.registerCommand("proto-prompt", {
    description: "Apri le note da accodare al prompt",
    handler: async (_args, ctx) => showNotes(ctx),
  });
}
