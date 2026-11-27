#!/usr/bin/env python3
"""
Playwright multi-viewport E2E verification + 8-beat side-by-side comparison_grid.png builder
for 7 Days Cat-Sitting 3D (reproducing YouTube VSQXM4IS8VE).
"""
import os
import threading
import http.server
import socketserver
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF_DIR = os.path.join(ROOT, ".qa", "reference")
TMP_DIR = os.path.join(ROOT, ".qa", "tmp")
os.makedirs(TMP_DIR, exist_ok=True)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, format, *args):
        pass


class ReusableThreadingServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def start_server():
    httpd = ReusableThreadingServer(("127.0.0.1", 0), QuietHandler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd, port


def crop_sb_tile(sheet_name, row, col):
    im = Image.open(os.path.join(REF_DIR, sheet_name)).convert("RGB")
    tw = im.width // 5
    th = im.height // 5
    return im.crop((col * tw, row * th, (col + 1) * tw, (row + 1) * th))


def build_comparison_grid(shots):
    cell_w, cell_h = 480, 270
    header_h = 44
    label_h = 28
    pad = 12
    cols_w = cell_w * 2 + pad * 3
    total_h = header_h + len(shots) * (cell_h + label_h + pad) + pad

    grid = Image.new("RGB", (cols_w, total_h), (18, 22, 26))
    draw = ImageDraw.Draw(grid)
    try:
        font_hdr = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        font_lbl = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
    except Exception:
        font_hdr = ImageFont.load_default()
        font_lbl = ImageFont.load_default()

    draw.text((pad + 10, 10), "ORIGINAL VIDEO (youtu.be/VSQXM4IS8VE)", fill=(252, 165, 165), font=font_hdr)
    draw.text((pad * 2 + cell_w + 10, 10), "OUR 3D THREE.JS BUILD (Live House)", fill=(134, 239, 172), font=font_hdr)

    for idx, (label, ref_img, build_path) in enumerate(shots):
        y = header_h + idx * (cell_h + label_h + pad)
        draw.rectangle([pad, y, cols_w - pad, y + label_h - 2], fill=(34, 42, 48))
        draw.text((pad + 10, y + 6), f"{idx + 1}. {label}", fill=(248, 250, 252), font=font_lbl)

        img_y = y + label_h
        left = ref_img.resize((cell_w, cell_h), Image.Resampling.LANCZOS)
        right = Image.open(build_path).convert("RGB").resize((cell_w, cell_h), Image.Resampling.LANCZOS)
        grid.paste(left, (pad, img_y))
        grid.paste(right, (pad * 2 + cell_w, img_y))

    out_path = os.path.join(ROOT, ".qa", "comparison_grid.png")
    grid.save(out_path, optimize=True)
    print(f"Saved comparison grid -> {out_path} ({grid.size})")


def main():
    httpd, port = start_server()
    url = f"http://127.0.0.1:{port}/index.html"
    errors = []

    viewports = [
        ("desktop", 1280, 800),
        ("ipad_land", 1024, 768),
        ("ipad_port", 768, 1024),
        ("mobile", 390, 844),
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
        )

        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
        page.on("console", lambda msg: errors.append(f"console.error: {msg.text}") if msg.type == "error" else None)

        page.goto(url, wait_until="networkidle")
        page.wait_for_function("() => window.__GAME__ && window.__GAME__.isReady()", timeout=15000)

        # 1. Verify zero overflow & zero errors across all 4 responsive viewports
        for name, vw, vh in viewports:
            page.set_viewport_size({"width": vw, "height": vh})
            page.wait_for_timeout(250)

            metrics = page.evaluate("""() => ({
                scrollW: document.documentElement.scrollWidth,
                topRect: document.getElementById('top-pill').getBoundingClientRect(),
                toolRect: document.getElementById('tool-pill').getBoundingClientRect(),
            })""")
            assert metrics["scrollW"] <= vw + 1, f"{name}: horizontal overflow {metrics['scrollW']} > {vw}"
            assert metrics["topRect"]["right"] <= vw + 1, f"{name}: top-pill clipped"
            assert metrics["toolRect"]["right"] <= vw + 1, f"{name}: tool-pill clipped"
            print(f"[PASS] Viewport {name} ({vw}x{vh}): 0 overflow, pills inside bounds")
            if name == "mobile":
                page.screenshot(path=os.path.join(TMP_DIR, "mobile_check.png"))

        # 2. Full desktop 1280x720 walkthrough & 8-beat comparison captures
        page.set_viewport_size({"width": 1280, "height": 720})
        page.wait_for_timeout(350)

        # Shot 1: Retro Green/White Checkered Kitchen + Top-Hat Cat + Red Bowl + Rabbit/Turtle buddies
        shot1 = os.path.join(TMP_DIR, "s1_kitchen_cat.png")
        page.screenshot(path=shot1)
        Image.open(shot1).convert("RGB").save(os.path.join(ROOT, "screenshot.jpg"), quality=90, optimize=True)

        # Verify centered reset confirmation modal safety
        page.click("#btn-reset")
        assert page.locator("#reset-modal:not(.hidden)").count() == 1
        page.click("#btn-reset-no")
        assert page.locator("#reset-modal.hidden").count() == 1

        # Verify gallery opens & switches tabs
        page.click("#btn-gallery")
        assert page.locator("#gallery-overlay:not(.hidden)").count() == 1
        page.click("#tab-rooms")
        assert page.locator(".tile-card").count() == 6
        page.click("#btn-gallery-close")

        # Shot 2: Smartphone Cat Rules Overlay (sb0_00 f3)
        page.evaluate("window.__GAME__.openPhone(true)")
        page.wait_for_timeout(200)
        shot2 = os.path.join(TMP_DIR, "s2_phone_rules.png")
        page.screenshot(path=shot2)
        page.evaluate("window.__GAME__.openPhone(false)")

        # Shot 3: Laundry Room Twin Washers + Litter Box Scoop Mini-Game (sb0_00 f13 / sb0_01 f24)
        page.evaluate("window.__GAME__.openLitter()")
        page.wait_for_timeout(280)
        shot3 = os.path.join(TMP_DIR, "s3_litter_box.png")
        page.screenshot(path=shot3)
        page.click("#btn-litter-close")

        # Shot 4: Night 3 Living Room — Red Curtains + Glowing Cyan TV + Window Shadow Stalker!
        page.evaluate("""() => {
            window.__GAME__.selectNight(2);
            window.__GAME__.goRoom('living');
        }""")
        page.wait_for_timeout(350)
        shot4 = os.path.join(TMP_DIR, "s4_living_stalker.png")
        page.screenshot(path=shot4)

        # Shot 5: Nighttime Front Yard & Green Mailbox (sb0_00 f18 / sb0_04 f19)
        page.evaluate("window.__GAME__.goRoom('outside')")
        page.wait_for_timeout(300)
        shot5 = os.path.join(TMP_DIR, "s5_outside_mailbox.png")
        page.screenshot(path=shot5)

        # Shot 6: Night 2 Open Refrigerator (sb0_00 f20 / sb0_01 f9)
        page.evaluate("""() => {
            window.__GAME__.selectNight(1);
            window.__GAME__.goRoom('kitchen');
        }""")
        page.wait_for_timeout(380)
        shot6 = os.path.join(TMP_DIR, "s6_open_fridge.png")
        page.screenshot(path=shot6)

        # Shot 7: Master Bedroom Blue Bed + Bathroom Red Checkers (sb0_02 f7)
        page.evaluate("window.__GAME__.goRoom('bedroom')")
        page.wait_for_timeout(300)
        shot7 = os.path.join(TMP_DIR, "s7_bedroom.png")
        page.screenshot(path=shot7)

        # Shot 8: Iconic Roblox Fail Ending Card ("Cold as Ice" / sb0_01 f7)
        page.evaluate("window.__GAME__.triggerEnding('cold_as_ice')")
        page.wait_for_timeout(250)
        shot8 = os.path.join(TMP_DIR, "s8_ending_ice.png")
        page.screenshot(path=shot8)

        ctx.close()
        browser.close()

    httpd.shutdown()
    assert not errors, f"Runtime errors detected: {errors}"

    shots = [
        ("Green/White Checkered Kitchen, Red Bowl & Top-Hat Cat", crop_sb_tile("sb0_00.jpg", 1, 1), shot1),
        ("Retro Roblox Smartphone Cat-Sitting Rules", crop_sb_tile("sb0_00.jpg", 0, 2), shot2),
        ("Laundry Twin Washers & Litter Box Scoop Mini-Game", crop_sb_tile("sb0_01.jpg", 4, 3), shot3),
        ("Living Room Red Curtains, Cyan TV & Window Shadow Stalker", Image.open(os.path.join(REF_DIR, "thumb_maxres.jpg")).convert("RGB"), shot4),
        ("Nighttime Front Yard Walkway & Green Mailbox", crop_sb_tile("sb0_00.jpg", 3, 2), shot5),
        ("Open White Fridge Rule Hazard (Cold as Ice)", crop_sb_tile("sb0_01.jpg", 1, 3), shot6),
        ("Master Bedroom Blue Bed & Sleep to Advance Night", crop_sb_tile("sb0_02.jpg", 1, 1), shot7),
        ("Authentic Dark Roblox Fail Card (Cold as Ice)", crop_sb_tile("sb0_01.jpg", 1, 1), shot8),
    ]
    build_comparison_grid(shots)
    print("[PASS] All 7 Days Cat-Sitting 3D E2E checks & comparison_grid.png succeeded with 0 errors!")


if __name__ == "__main__":
    main()
