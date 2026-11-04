#!/usr/bin/env python3
"""
Generate Amazon Appstore Store Assets for LogiXstream
Generates exact specification assets for Fire TV and Tablets:
- Tablet Icons: 512x512, 114x114 (PNG with transparency)
- Tablet Promo: 1024x500 (PNG)
- FireTV App Icon: 1280x720 (PNG, no transparency)
- FireTV Background: 1920x1080 (PNG, no transparency)
- FireTV Featured Logo: 640x260 (PNG)
- FireTV Featured Background: 1920x720 (PNG, no transparency)
- Screenshots: 5 x 1920x1080 (PNG, no transparency)
"""

import os
import struct
import subprocess
import zlib

WORKSPACE = "/Users/anilkumarmandapati/Desktop/vega-os-ott-app"
ASSETS_DIR = os.path.join(WORKSPACE, "store_assets")
TABLET_DIR = os.path.join(ASSETS_DIR, "tablet")
FIRETV_DIR = os.path.join(ASSETS_DIR, "firetv")
SHOTS_DIR = os.path.join(ASSETS_DIR, "screenshots")

for d in [TABLET_DIR, FIRETV_DIR, SHOTS_DIR]:
    os.makedirs(d, exist_ok=True)

def write_png(filename, width, height, rgba_bytes):
    """Write an RGBA bytearray as an uncompressed/standard PNG."""
    raw_data = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw_data.append(0)  # filter type 0
        raw_data.extend(rgba_bytes[y * row_bytes : (y + 1) * row_bytes])

    compressed = zlib.compress(bytes(raw_data), 6)
    png = bytearray(b"\x89PNG\r\n\x1a\n")

    # IHDR
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack(">I", zlib.crc32(b"IHDR" + ihdr_data))
    png.extend(struct.pack(">I", len(ihdr_data)))
    png.extend(b"IHDR")
    png.extend(ihdr_data)
    png.extend(ihdr_crc)

    # IDAT
    idat_crc = struct.pack(">I", zlib.crc32(b"IDAT" + compressed))
    png.extend(struct.pack(">I", len(compressed)))
    png.extend(b"IDAT")
    png.extend(compressed)
    png.extend(idat_crc)

    # IEND
    iend_crc = struct.pack(">I", zlib.crc32(b"IEND"))
    png.extend(struct.pack(">I", 0))
    png.extend(b"IEND")
    png.extend(iend_crc)

    with open(filename, "wb") as f:
        f.write(png)
    print(f"Generated: {filename} ({width}x{height})")

def load_bmp(bmp_path):
    """Load a 32-bit BMP into (width, height, bytearray_rgba)."""
    with open(bmp_path, "rb") as f:
        data = f.read()
    offset = struct.unpack("<I", data[10:14])[0]
    w = struct.unpack("<i", data[18:22])[0]
    h = struct.unpack("<i", data[22:26])[0]
    
    top_down = False
    if h < 0:
        h = -h
        top_down = True
        
    pixels = bytearray(w * h * 4)
    row_size = w * 4
    
    for y in range(h):
        src_y = y if top_down else (h - 1 - y)
        src_row_start = offset + src_y * row_size
        dst_row_start = y * row_size
        row = data[src_row_start : src_row_start + row_size]
        for x in range(w):
            b = row[x*4]
            g = row[x*4 + 1]
            r = row[x*4 + 2]
            a = row[x*4 + 3] if len(row) > x*4 + 3 else 255
            dst_idx = dst_row_start + x * 4
            pixels[dst_idx] = r
            pixels[dst_idx + 1] = g
            pixels[dst_idx + 2] = b
            pixels[dst_idx + 3] = a
    return w, h, pixels

def blend_pixel(dst, dst_idx, r, g, b, a):
    if a == 0:
        return
    if a == 255:
        dst[dst_idx] = r
        dst[dst_idx + 1] = g
        dst[dst_idx + 2] = b
        dst[dst_idx + 3] = 255
        return
    alpha = a / 255.0
    inv = 1.0 - alpha
    dr = dst[dst_idx]
    dg = dst[dst_idx + 1]
    db = dst[dst_idx + 2]
    dst[dst_idx] = int(r * alpha + dr * inv)
    dst[dst_idx + 1] = int(g * alpha + dg * inv)
    dst[dst_idx + 2] = int(b * alpha + db * inv)
    dst[dst_idx + 3] = 255

def blit(dst, dw, dh, src, sw, sh, dx, dy):
    for sy in range(sh):
        ty = dy + sy
        if ty < 0 or ty >= dh:
            continue
        for sx in range(sw):
            tx = dx + sx
            if tx < 0 or tx >= dw:
                continue
            s_idx = (sy * sw + sx) * 4
            d_idx = (ty * dw + tx) * 4
            blend_pixel(dst, d_idx, src[s_idx], src[s_idx+1], src[s_idx+2], src[s_idx+3])

def fill_rect(dst, dw, dh, x, y, w, h, r, g, b, a=255):
    for cy in range(max(0, y), min(dh, y + h)):
        for cx in range(max(0, x), min(dw, x + w)):
            idx = (cy * dw + cx) * 4
            blend_pixel(dst, idx, r, g, b, a)

def draw_horizontal_gradient(dst, dw, dh, x, y, w, h, r1, g1, b1, r2, g2, b2, a=255):
    for cx in range(max(0, x), min(dw, x + w)):
        ratio = (cx - x) / max(1, w)
        cr = int(r1 * (1 - ratio) + r2 * ratio)
        cg = int(g1 * (1 - ratio) + g2 * ratio)
        cb = int(b1 * (1 - ratio) + b2 * ratio)
        for cy in range(max(0, y), min(dh, y + h)):
            idx = (cy * dw + cx) * 4
            blend_pixel(dst, idx, cr, cg, cb, a)

def main():
    print("=== Step 1: Converting Source Assets to BMP for Blitting ===")
    vega_logo_png = os.path.join(WORKSPACE, "image/vega.png")
    bg_png = os.path.join(WORKSPACE, "src/assets/background.png")
    
    # 1. Tablet Icons (512x512 and 114x114 with transparency)
    subprocess.run(["sips", "--resampleWidth", "460", vega_logo_png, "-o", "/tmp/logo_460.png"], check=True)
    subprocess.run(["sips", "-p", "512", "512", "/tmp/logo_460.png", "-o", os.path.join(TABLET_DIR, "icon_512x512.png")], check=True)
    
    subprocess.run(["sips", "--resampleWidth", "102", vega_logo_png, "-o", "/tmp/logo_102.png"], check=True)
    subprocess.run(["sips", "-p", "114", "114", "/tmp/logo_102.png", "-o", os.path.join(TABLET_DIR, "icon_114x114.png")], check=True)

    # 2. FireTV Featured Content Logo (640x260 with transparency)
    subprocess.run(["sips", "--resampleHeight", "230", vega_logo_png, "-o", "/tmp/logo_h230.png"], check=True)
    subprocess.run(["sips", "-p", "260", "640", "/tmp/logo_h230.png", "-o", os.path.join(FIRETV_DIR, "featured_content_logo_640x260.png")], check=True)

    # 3. FireTV Background (1920x1080 no transparency)
    subprocess.run(["sips", "-z", "1080", "1920", bg_png, "-o", os.path.join(FIRETV_DIR, "background_1920x1080.png")], check=True)

    # 4. FireTV Featured Content Background (1920x720 no transparency)
    subprocess.run(["sips", "-z", "720", "1920", bg_png, "-o", os.path.join(FIRETV_DIR, "featured_content_background_1920x720.png")], check=True)

    # Convert vega logo and background to BMP for python composition
    subprocess.run(["sips", "--resampleWidth", "680", vega_logo_png, "-o", "/tmp/logo_w680.png"], check=True)
    subprocess.run(["sips", "-s", "format", "bmp", "/tmp/logo_w680.png", "-o", "/tmp/logo_w680.bmp"], check=True)
    lw, lh, logo_pixels = load_bmp("/tmp/logo_w680.bmp")

    subprocess.run(["sips", "-s", "format", "bmp", os.path.join(FIRETV_DIR, "background_1920x1080.png"), "-o", "/tmp/bg_1080.bmp"], check=True)
    bg_w, bg_h, bg_pixels = load_bmp("/tmp/bg_1080.bmp")

    # 5. FireTV App Icon (1280x720, NO transparency)
    print("Generating FireTV App Icon (1280x720)...")
    icon_1280 = bytearray(1280 * 720 * 4)
    # Fill solid dark blue-slate gradient background
    for y in range(720):
        ratio = y / 720.0
        r = int(11 * (1 - ratio) + 18 * ratio)
        g = int(15 * (1 - ratio) + 26 * ratio)
        b = int(28 * (1 - ratio) + 48 * ratio)
        for x in range(1280):
            idx = (y * 1280 + x) * 4
            icon_1280[idx] = r
            icon_1280[idx+1] = g
            icon_1280[idx+2] = b
            icon_1280[idx+3] = 255
    # Center logo in 1280x720
    blit(icon_1280, 1280, 720, logo_pixels, lw, lh, (1280 - lw) // 2, (720 - lh) // 2)
    write_png(os.path.join(FIRETV_DIR, "app_icon_1280x720.png"), 1280, 720, icon_1280)

    # 6. Tablet Promotional Image (1024x500)
    print("Generating Tablet Promotional Image (1024x500)...")
    promo_1024 = bytearray(1024 * 500 * 4)
    # Fill background
    for y in range(500):
        ratio = y / 500.0
        r = int(12 * (1 - ratio) + 20 * ratio)
        g = int(18 * (1 - ratio) + 30 * ratio)
        b = int(32 * (1 - ratio) + 55 * ratio)
        for x in range(1024):
            idx = (y * 1024 + x) * 4
            promo_1024[idx] = r
            promo_1024[idx+1] = g
            promo_1024[idx+2] = b
            promo_1024[idx+3] = 255
    # Add subtle glowing decorative banners
    fill_rect(promo_1024, 1024, 500, 0, 480, 1024, 20, 229, 9, 20, 220)  # Red accent line
    # Scale logo for promo
    subprocess.run(["sips", "--resampleWidth", "520", vega_logo_png, "-o", "/tmp/logo_w520.png"], check=True)
    subprocess.run(["sips", "-s", "format", "bmp", "/tmp/logo_w520.png", "-o", "/tmp/logo_w520.bmp"], check=True)
    plw, plh, p_logo = load_bmp("/tmp/logo_w520.bmp")
    blit(promo_1024, 1024, 500, p_logo, plw, plh, (1024 - plw) // 2, 80)
    write_png(os.path.join(TABLET_DIR, "promotional_1024x500.png"), 1024, 500, promo_1024)

    # 7. Render 5 Cinematic Screenshots (1920x1080)
    print("Generating 5 High-Quality OTT Screenshots (1920x1080)...")
    
    # Helper to draw top nav bar
    def draw_navbar(canvas, active_tab_x, active_tab_w):
        # Top dark blur overlay
        fill_rect(canvas, 1920, 1080, 0, 0, 1920, 110, 8, 12, 22, 230)
        # Accent active indicator
        fill_rect(canvas, 1920, 1080, active_tab_x, 85, active_tab_w, 4, 229, 9, 20, 255)
        # Small logo in top left
        blit(canvas, 1920, 1080, p_logo, plw, plh, 60, -80)

    # Screenshot 1: Home Screen
    print("- Screenshot 1: Home Screen...")
    shot1 = bytearray(bg_pixels)
    draw_navbar(shot1, 260, 80)  # "Home" active
    # Hero Title Card / Backdrop
    fill_rect(shot1, 1920, 1080, 80, 240, 800, 320, 10, 15, 26, 180)
    # Buttons: Watch Now & Details
    fill_rect(shot1, 1920, 1080, 90, 480, 220, 60, 229, 9, 20, 255)  # Watch Now Red
    fill_rect(shot1, 1920, 1080, 330, 480, 200, 60, 40, 50, 70, 230) # Details Grey
    # Trending Row cards
    for i in range(5):
        cx = 90 + i * 360
        fill_rect(shot1, 1920, 1080, cx, 660, 320, 180, 24, 34, 54, 240)
        fill_rect(shot1, 1920, 1080, cx + 15, 675, 290, 110, 35, 48, 75, 255)
        # Highlight first focused card
        if i == 0:
            fill_rect(shot1, 1920, 1080, cx - 4, 656, 328, 188, 229, 9, 20, 200)
    write_png(os.path.join(SHOTS_DIR, "screenshot_1_home_1920x1080.png"), 1920, 1080, shot1)

    # Screenshot 2: Movie Details Screen (4K UHD, HDR10, Audio)
    print("- Screenshot 2: Movie Details Screen...")
    shot2 = bytearray(bg_pixels)
    # Dark side vignette
    for x in range(1100):
        alpha = int(240 * (1.0 - x / 1100.0 * 0.4))
        fill_rect(shot2, 1920, 1080, x, 0, 1, 1080, 10, 14, 24, alpha)
    draw_navbar(shot2, 380, 90)  # "Movies" active
    # Poster card
    fill_rect(shot2, 1920, 1080, 90, 220, 380, 560, 20, 28, 44, 255)
    # 4K / HDR / Spatial badges
    fill_rect(shot2, 1920, 1080, 520, 330, 80, 34, 229, 9, 20, 255)   # 4K
    fill_rect(shot2, 1920, 1080, 615, 330, 95, 34, 45, 60, 85, 240)  # HDR10
    fill_rect(shot2, 1920, 1080, 725, 330, 130, 34, 45, 60, 85, 240) # 5.1 AUDIO
    # Action buttons
    fill_rect(shot2, 1920, 1080, 520, 480, 240, 64, 229, 9, 20, 255)  # Play Movie
    fill_rect(shot2, 1920, 1080, 785, 480, 240, 64, 40, 52, 75, 230)  # Add to Watchlist
    # Cast row
    for i in range(4):
        fill_rect(shot2, 1920, 1080, 520 + i * 260, 680, 230, 120, 22, 30, 48, 230)
    write_png(os.path.join(SHOTS_DIR, "screenshot_2_details_1920x1080.png"), 1920, 1080, shot2)

    # Screenshot 3: Live TV & Interactive EPG Guide
    print("- Screenshot 3: Live TV & EPG...")
    shot3 = bytearray(bg_pixels)
    draw_navbar(shot3, 500, 90)  # "Live TV" active
    # EPG Timeline bar
    fill_rect(shot3, 1920, 1080, 80, 180, 1760, 60, 18, 26, 42, 250)
    for t in range(4):
        fill_rect(shot3, 1920, 1080, 380 + t * 340, 190, 80, 40, 40, 55, 80, 240)
    # Channel rows
    channels = [(229, 9, 20), (30, 144, 255), (46, 204, 113), (241, 196, 15)]
    for r, col in enumerate(channels):
        y_pos = 260 + r * 150
        # Channel logo box
        fill_rect(shot3, 1920, 1080, 80, y_pos, 240, 130, 15, 20, 32, 250)
        fill_rect(shot3, 1920, 1080, 100, y_pos + 40, 60, 50, col[0], col[1], col[2], 255)
        # Program slots
        fill_rect(shot3, 1920, 1080, 340, y_pos, 480, 130, 26, 36, 56, 240)
        fill_rect(shot3, 1920, 1080, 840, y_pos, 520, 130, 22, 30, 48, 240)
        fill_rect(shot3, 1920, 1080, 1380, y_pos, 460, 130, 22, 30, 48, 240)
        # Highlight currently tuned program
        if r == 1:
            fill_rect(shot3, 1920, 1080, 336, y_pos - 4, 488, 138, 229, 9, 20, 180)
    write_png(os.path.join(SHOTS_DIR, "screenshot_3_livetv_1920x1080.png"), 1920, 1080, shot3)

    # Screenshot 4: Subscription & In-App Purchase Selection
    print("- Screenshot 4: Subscription Plans Screen...")
    shot4 = bytearray(bg_pixels)
    draw_navbar(shot4, 1000, 120)  # Settings / Subscribe
    # Plans Grid (4 plans: Mobile, Basic, Standard, Premium)
    plans = [
        ("Mobile", "480p", "1 Device", "₹149/mo", False),
        ("Basic", "1080p", "1 Device", "₹299/mo", False),
        ("Standard", "1080p", "2 Devices", "₹499/mo", False),
        ("Premium", "4K UHD", "4 Devices", "₹649/mo", True), # Focused
    ]
    for p_idx, (pname, res, dev, price, focused) in enumerate(plans):
        px = 90 + p_idx * 435
        py = 220
        pw = 405
        ph = 680
        # Card body
        bg_col = (28, 38, 60) if not focused else (22, 32, 54)
        fill_rect(shot4, 1920, 1080, px, py, pw, ph, bg_col[0], bg_col[1], bg_col[2], 250)
        if focused:
            # Red outline
            fill_rect(shot4, 1920, 1080, px - 4, py - 4, pw + 8, ph + 8, 229, 9, 20, 220)
            fill_rect(shot4, 1920, 1080, px, py, pw, ph, 20, 30, 50, 255)
            # "POPULAR" banner
            fill_rect(shot4, 1920, 1080, px + 100, py - 20, 205, 40, 229, 9, 20, 255)
        # Price banner inside card
        fill_rect(shot4, 1920, 1080, px + 20, py + 120, pw - 40, 80, 14, 20, 32, 220)
        # Amazon IAP Subscribe Button
        btn_col = (229, 9, 20) if focused else (45, 58, 85)
        fill_rect(shot4, 1920, 1080, px + 30, py + 560, pw - 60, 65, btn_col[0], btn_col[1], btn_col[2], 255)
    write_png(os.path.join(SHOTS_DIR, "screenshot_4_subscription_1920x1080.png"), 1920, 1080, shot4)

    # Screenshot 5: Search & Discovery
    print("- Screenshot 5: Search Screen...")
    shot5 = bytearray(bg_pixels)
    draw_navbar(shot5, 620, 80)  # "Search" active
    # Search input bar
    fill_rect(shot5, 1920, 1080, 90, 160, 1740, 70, 20, 28, 44, 240)
    fill_rect(shot5, 1920, 1080, 120, 180, 24, 30, 229, 9, 20, 255)  # Cursor
    # Filter pills
    for fi in range(5):
        pill_col = (229, 9, 20) if fi == 0 else (35, 48, 72)
        fill_rect(shot5, 1920, 1080, 90 + fi * 180, 260, 160, 46, pill_col[0], pill_col[1], pill_col[2], 240)
    # Search results grid (2 rows of 5 cards)
    for row in range(2):
        for col in range(5):
            rx = 90 + col * 355
            ry = 340 + row * 340
            fill_rect(shot5, 1920, 1080, rx, ry, 330, 300, 22, 30, 48, 240)
            fill_rect(shot5, 1920, 1080, rx + 15, ry + 15, 300, 200, 32, 44, 70, 255)
    write_png(os.path.join(SHOTS_DIR, "screenshot_5_search_1920x1080.png"), 1920, 1080, shot5)

    print("\n All Store Assets Generated Successfully!")

if __name__ == "__main__":
    main()
