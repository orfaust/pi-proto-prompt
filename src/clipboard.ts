import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getNativeClipboard } from "@earendil-works/pi-tui";

const exec = promisify(execFile);

export async function readClipboardText(): Promise<string> {
  try {
    const text = await getNativeClipboard()?.getText();
    if (text !== undefined && text !== null) return text;
  } catch { /* Try platform commands below. */ }
  const commands: [string, string[]][] = [];
  if (process.platform === "win32" || process.env.WSL_DISTRO_NAME) {
    commands.push(["powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); $text = Get-Clipboard -Raw; if ($null -ne $text) { [Console]::Write($text) }"]]);
  } else if (process.platform === "darwin") commands.push(["pbpaste", []]);
  else {
    if (process.env.WAYLAND_DISPLAY) commands.push(["wl-paste", ["--no-newline", "--type", "text"]]);
    if (process.env.DISPLAY) commands.push(["xclip", ["-selection", "clipboard", "-out"]], ["xsel", ["--clipboard", "--output"]]);
  }
  for (const [command, args] of commands) {
    try {
      return (await exec(command, args, { encoding: "utf8", timeout: 5000, maxBuffer: 10 * 1024 * 1024, windowsHide: true })).stdout;
    } catch { /* Try the next available backend. */ }
  }
  throw new Error("Clipboard unavailable; use terminal paste or install a clipboard backend.");
}
