import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getNativeClipboard } from "@earendil-works/pi-tui";

const exec = promisify(execFile);

export function formatClipboardPaths(paths: string[]): string {
  return paths.map((path) => JSON.stringify(path)).join(" ");
}

export async function saveClipboardImage(bytes: Uint8Array): Promise<string> {
  const buffer = Buffer.from(bytes);
  let extension: string;
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) extension = "png";
  else if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) extension = "jpg";
  else if (["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString())) extension = "gif";
  else if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") extension = "webp";
  else if (buffer.subarray(0, 2).toString() === "BM") extension = "bmp";
  else throw new Error("Unsupported clipboard image format");
  const directory = await mkdtemp(join(tmpdir(), "pi-proto-prompt-"));
  const path = join(directory, `clipboard.${extension}`);
  await writeFile(path, bytes, { mode: 0o600 });
  return path;
}

/** Files first, then an image saved to a temporary file, then plain text. */
export async function readClipboardContent(): Promise<string> {
  const clipboard = getNativeClipboard();
  try {
    const paths = await clipboard?.getFilePaths?.();
    if (paths?.length) return formatClipboardPaths(paths);
  } catch { /* Try image and text. */ }
  let image: Uint8Array | null | undefined;
  try { image = await clipboard?.getImage(); } catch { /* Try platform fallback. */ }
  if (image?.length) return formatClipboardPaths([await saveClipboardImage(image)]);

  if (process.platform === "win32" || process.env.WSL_DISTRO_NAME) {
    try {
      const script = [
        "Add-Type -AssemblyName System.Windows.Forms",
        "Add-Type -AssemblyName System.Drawing",
        "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)",
        "$files = [System.Windows.Forms.Clipboard]::GetFileDropList()",
        "if ($files.Count -gt 0) { ConvertTo-Json -Compress -InputObject @($files) } else { $image = [System.Windows.Forms.Clipboard]::GetImage(); if ($null -ne $image) { try { $path = Join-Path ([System.IO.Path]::GetTempPath()) ('pi-proto-prompt-' + [guid]::NewGuid().ToString() + '.png'); $image.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); ConvertTo-Json -Compress -InputObject @($path) } finally { $image.Dispose() } } }",
      ].join("; ");
      const { stdout } = await exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-STA", "-Command", script], { encoding: "utf8", timeout: 5000, windowsHide: true });
      if (stdout.trim()) {
        let paths = JSON.parse(stdout) as string[];
        if (!Array.isArray(paths) || paths.some((path) => typeof path !== "string")) throw new Error("Invalid clipboard paths");
        if (process.platform !== "win32") {
          paths = await Promise.all(paths.map(async (path) => (await exec("wslpath", ["-u", path], { timeout: 5000 })).stdout.trim()));
        }
        return formatClipboardPaths(paths);
      }
    } catch { /* Keep text paste available when image access fails. */ }
  }
  return readClipboardText();
}

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
