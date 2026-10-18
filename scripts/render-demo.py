"""Render captured real-component states to a short English MP4 demo.

Requires Pillow and ffmpeg. Run after: npx tsx scripts/demo-frames.ts
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT, FPS = 1280, 720, 10
font_candidates = [
    Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts/consola.ttf",
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"),
]
font_path = next(path for path in font_candidates if path.exists())
font = ImageFont.truetype(str(font_path), 18)
small = ImageFont.truetype(str(font_path), 16)
heading = ImageFont.truetype(str(font_path), 26)
frames = json.loads(Path(".demo/frames.json").read_text(encoding="utf-8"))
output = Path("docs/proto-prompt-demo.mp4")
output.parent.mkdir(exist_ok=True)
ffmpeg = shutil.which("ffmpeg")
if not ffmpeg:
    raise RuntimeError("ffmpeg is required")
process = subprocess.Popen([
    ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}",
    "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
    "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", str(output),
], stdin=subprocess.PIPE)
try:
    for index, frame in enumerate(frames):
        image = Image.new("RGB", (WIDTH, HEIGHT), "#10141c")
        draw = ImageDraw.Draw(image)
        draw.text((40, 24), "Proto Prompt", font=heading, fill="#8cc8ff")
        draw.text((40, 64), "Automated demo of the actual Pi extension component", font=small, fill="#95a4b8")
        draw.rounded_rectangle((28, 102, 1252, 594), radius=12, fill="#191f2a", outline="#3a4658", width=2)
        y = 120
        for line in frame["lines"]:
            for wrapped in line.split("\n"):
                color = "#88c8ff" if any(char in wrapped for char in "┌┐└┘│─") else "#e1e7ef"
                draw.text((48, y), wrapped, font=font, fill=color)
                y += 23
        draw.text((40, 620), frame["caption"], font=small, fill="#f1d292")
        draw.text((40, 672), "No model requests. Demo clipboard content only. No desktop capture.", font=small, fill="#95a4b8")
        draw.text((1140, 672), f"{index + 1:02}/{len(frames):02}", font=small, fill="#95a4b8")
        data = image.tobytes()
        for _ in range(round(frame["seconds"] * FPS)):
            process.stdin.write(data)
    process.stdin.close()
    code = process.wait()
    if code:
        raise RuntimeError(f"ffmpeg exited with status {code}")
except BaseException:
    process.kill()
    process.wait()
    raise
print(f"Saved {output} ({sum(frame['seconds'] for frame in frames)} seconds)")
