# pi-proto-prompt

A modal notes editor for Pi. Move text between a scratch draft and the prompt without sending it to the model.

## Global installation

```sh
pi install git:github.com/orfaust/pi-proto-prompt
```

Run `/reload` in existing sessions after installation or updates.

## Usage

- `Ctrl+Enter`: open the centered modal with a continuous box-drawing frame.
- Opening moves the current prompt to the end of the modal draft and clears the prompt.
- `Enter`: close the modal, transfer its contents to the prompt immediately, and clear the draft. This does **not** send a message to the model.
- `Shift+Enter` (or `Ctrl+J`): insert a new line.
- Paste protection: in legacy terminals without bracketed paste, Enter within 200 ms of typing is treated as a newline. Pause briefly after typing/pasting before pressing Enter to transfer. This is a timing safeguard, not perfect paste detection; bracketed paste is recommended.
- `Ctrl+C` inside the modal: clear all text, including the saved draft, without closing.
- `Alt+V` inside the modal: paste plain text from the system clipboard at the cursor, including multiple lines, without confirming. Requires local clipboard access; errors appear in the modal. Clipboard reads are discarded if you clear or close the modal before they finish.
- `Esc`: close and keep the draft for later. Imported prompt text remains in the draft, not in the main prompt.
- `/proto-prompt`: open the modal without a keyboard shortcut.

Drafts remain in memory until confirmed, reloaded, or Pi exits. No notes are saved to disk.
Whitespace-only additions are ignored. Interactive TUI only; RPC and print modes are not supported.

## Global shortcut

Create `pi-proto-prompt.json` in Pi's user directory (normally `~/.pi/agent`, or the directory selected by `PI_CODING_AGENT_DIR`):

```json
{
  "shortcut": "ctrl+enter"
}
```

For example, use `"ctrl+alt+n"` to change the shortcut for all projects.
Run `/reload` to apply changes. The default is `ctrl+enter`; invalid configuration
produces a warning and falls back to the default. Project overrides are not read.

The terminal must distinguish `Ctrl+Enter` from `Enter`, for example through the
Kitty keyboard protocol. Otherwise choose another shortcut or use `/proto-prompt`.

Pi rejects reserved shortcuts: `Ctrl+K`, for example, belongs to
`tui.editor.deleteToLineEnd` and must be remapped in Pi's global keybindings before
an extension can use it. The OS, terminal, or other extensions may also intercept
a shortcut. Check `/hotkeys` for active bindings.

## Development

```sh
npm install
npm run check
npm test
pi -e .
```

Manual checks: import an existing prompt, edit multiline notes, press Enter, and
verify the prompt appears immediately without submitting. Reopen to verify the
previous draft was cleared. Test Escape retention, Unicode, narrow terminals,
resizing, focus, and both regular and fullscreen modes.
