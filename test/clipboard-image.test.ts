import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { test } from "node:test";
import { formatClipboardPaths, saveClipboardImage } from "../src/clipboard.js";

test("clipboard paths preserve spaces and multiple files", () => {
  assert.equal(formatClipboardPaths(["/tmp/my image.png", "/tmp/other.jpg"]), '"/tmp/my image.png" "/tmp/other.jpg"');
});

test("clipboard image is saved byte-for-byte with a matching extension", async () => {
  const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  const path = await saveClipboardImage(bytes);
  try {
    assert.ok(path.endsWith(".png"));
    assert.deepEqual(await readFile(path), bytes);
  } finally {
    await rm(dirname(path), { recursive: true, force: true });
  }
});

test("unknown clipboard image formats are rejected", async () => {
  await assert.rejects(saveClipboardImage(Buffer.from("unknown")), /Unsupported clipboard image/);
});
