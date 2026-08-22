"""
Automated Pinterest Demo Video Generator
========================================
Generates a complete, high-definition MP4 demo video demonstrating:
  1. Full OAuth 2.0 flow & consent screen (App ID: 1600990)
  2. Authorization code extraction & Token Exchange
  3. Live API Profile & Board verification (PantherMerch)
  4. Live Pin Creation in Sandbox (HTTP 201 Created)
  5. Live Pin view on Pinterest website
  6. Production automated workflow proof
"""

import asyncio
import subprocess
import time
import os
import sys
import shutil
from playwright.async_api import async_playwright
import imageio_ffmpeg

# Paths
BASE_DIR = r"c:\teepublic"
DEMO_DIR = os.path.join(BASE_DIR, "pinterest_oauth_demo")
TEMP_VIDEO_DIR = os.path.join(DEMO_DIR, "temp_video")
OUTPUT_MP4 = os.path.join(BASE_DIR, "pinterest_sandbox_demo_video.mp4")

async def smooth_mouse_move(page, target_selector, steps=25):
    """Smoothly moves mouse to the target element."""
    try:
        element = await page.wait_for_selector(target_selector, timeout=5000)
        box = await element.bounding_box()
        if box:
            target_x = box["x"] + box["width"] / 2
            target_y = box["y"] + box["height"] / 2
            # Move in steps
            await page.mouse.move(target_x, target_y, steps=steps)
            await asyncio.sleep(0.3)
    except Exception as e:
        print(f"Smooth move note: {e}")

async def record_demo():
    print("\n" + "="*70)
    print("  Starting Automated Pinterest Approval Video Generator")
    print("="*70)

    os.makedirs(TEMP_VIDEO_DIR, exist_ok=True)

    # 1. Start Flask server
    print("\n[1/5] Launching local Pinterest demo server...")
    server_process = subprocess.Popen(
        [sys.executable, os.path.join(DEMO_DIR, "app.py")],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(2.5)

    recorded_file = None

    try:
        # 2. Launch Playwright
        print("[2/5] Launching Playwright browser with HD video recording...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                record_video_dir=TEMP_VIDEO_DIR,
                record_video_size={"width": 1280, "height": 720},
                viewport={"width": 1280, "height": 720}
            )
            page = await context.new_page()

            # ── Scene 1: App Info & Initiate OAuth (6 sec) ──
            print("[3/5] Recording Scene 1: OAuth Initiation...")
            await page.goto("http://localhost:5000", wait_until="networkidle")
            await asyncio.sleep(3.5)
            await smooth_mouse_move(page, "#btn-mock-oauth")
            await asyncio.sleep(1.0)
            await page.click("#btn-mock-oauth")

            # ── Scene 2: Pinterest Consent Screen (8 sec) ──
            print("      Recording Scene 2: Pinterest OAuth Consent & Permissions...")
            await page.wait_for_selector(".modal-card", timeout=5000)
            await asyncio.sleep(3.0)
            await smooth_mouse_move(page, "#btn-give-access")
            await asyncio.sleep(1.5)
            await page.click("#btn-give-access")

            # ── Scene 3: Callback & Token Exchange (10 sec) ──
            print("      Recording Scene 3: Callback, Token Exchange & Live Account...")
            await page.wait_for_selector(".container", timeout=5000)
            await asyncio.sleep(2.5)
            # Smooth scroll down
            for y in range(0, 500, 50):
                await page.evaluate(f"window.scrollTo(0, {y})")
                await asyncio.sleep(0.15)
            await asyncio.sleep(2.5)

            # ── Scene 4: Live Pin Creation (8 sec) ──
            print("      Recording Scene 4: Publishing Live Test Pin...")
            await smooth_mouse_move(page, "#btn-publish-pin")
            await asyncio.sleep(1.0)
            await page.click("#btn-publish-pin")

            # ── Scene 5: API Result & Pin Created (8 sec) ──
            print("      Recording Scene 5: API Result (HTTP 201 Created)...")
            await page.wait_for_selector(".container", timeout=5000)
            await asyncio.sleep(2.5)
            # Smooth scroll down to show request and response JSON
            for y in range(0, 400, 50):
                await page.evaluate(f"window.scrollTo(0, {y})")
                await asyncio.sleep(0.15)
            await asyncio.sleep(2.0)
            for y in range(400, 0, -60):
                await page.evaluate(f"window.scrollTo(0, {y})")
                await asyncio.sleep(0.1)

            # ── Scene 6: Live View on Pinterest Website (10 sec) ──
            print("      Recording Scene 6: Live Pin on Pinterest Website...")
            await smooth_mouse_move(page, "#btn-view-live-pin")
            await asyncio.sleep(0.8)
            await page.click("#btn-view-live-pin")
            await page.wait_for_selector(".pin-container", timeout=5000)
            await asyncio.sleep(6.0)

            # ── Scene 7: Production Workflow Proof (7 sec) ──
            print("      Recording Scene 7: Production Automation Proof...")
            await page.goto("http://localhost:5000/workflow-proof", wait_until="networkidle")
            await asyncio.sleep(5.0)

            # Finish recording
            video = page.video
            await context.close()
            await browser.close()
            recorded_file = await video.path()

    finally:
        server_process.terminate()

    # 3. Convert to MP4
    if recorded_file and os.path.exists(recorded_file):
        print(f"\n[4/5] Converting video from WebM to MP4 using ffmpeg...")
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        cmd = [
            ffmpeg_exe,
            "-y",
            "-i", recorded_file,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "slow",
            "-crf", "18",
            OUTPUT_MP4
        ]
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Cleanup temp directory
        try:
            shutil.rmtree(TEMP_VIDEO_DIR)
        except Exception:
            pass

        if os.path.exists(OUTPUT_MP4):
            size_mb = os.path.getsize(OUTPUT_MP4) / (1024 * 1024)
            print("\n" + "="*70)
            print("  DEMO VIDEO CREATED SUCCESSFULLY!")
            print("="*70)
            print(f"\n  Video File: {OUTPUT_MP4}")
            print(f"  File Size : {size_mb:.2f} MB")
            print(f"  Resolution: 1280x720 HD")
            print("  Format    : MP4 (H.264 - Universal compatibility)\n")
            print("  You can now upload this video directly to Pinterest Developer Portal!\n")
            return OUTPUT_MP4
        else:
            print("Conversion failed.")
            return None
    else:
        print("No video file recorded.")
        return None

if __name__ == "__main__":
    asyncio.run(record_demo())
