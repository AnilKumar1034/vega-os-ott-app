#!/usr/bin/env python3
"""
Convert Vega Virtual Device captures into 100% compliant 24-bit RGB PNGs (NO TRANSPARENCY)
Target resolution: 1920 x 1080
"""

import os
import struct
import subprocess
import zlib

WORKSPACE = "/Users/anilkumarmandapati/Desktop/vega-os-ott-app"
SHOTS_DIR = os.path.join(WORKSPACE, "store_assets", "screenshots")
FIRETV_DIR = os.path.join(WORKSPACE, "store_assets", "firetv")
TABLET_DIR = os.path.join(WORKSPACE, "store_assets", "tablet")

for d in [SHOTS_DIR, FIRETV_DIR, TABLET_DIR]:
    os.makedirs(d, exist_ok=True)

CAPTURES = [
    {
        "src": "/tmp/Screenshot_1793612744.png",
        "name": "screenshot_1_home_1920x1080.png",
        "desc": "Home Screen with Hero Banner & Continue Watching",
    },
    {
        "src": "/tmp/Screenshot_1793612257.png",
        "name": "screenshot_2_movies_1920x1080.png",
        "desc": "Blockbuster Movies & Trending Rows",
    },
    {
        "src": "/tmp/Screenshot_1793613313.png",
        "name": "screenshot_3_details_jawan_1920x1080.png",
        "desc": "Jawan Movie Details (4K UHD, Cast & Synopsis)",
    },
    {
        "src": "/tmp/Screenshot_1793613369.png",
        "name": "screenshot_4_search_1920x1080.png",
        "desc": "Search Screen with TV Keyboard & Discovery Results",
    },
    {
        "src": "/tmp/Screenshot_1793612907.png",
        "name": "screenshot_5_settings_1920x1080.png",
        "desc": "Account & Settings with Active Standard Membership",
    },
]

def convert_to_rgb24_png(src_path, dst_path):
    # Convert src to uncompressed 32-bit BMP via sips
    tmp_bmp = "/tmp/convert_temp.bmp"
    subprocess.run(["sips", "-s", "format", "bmp", src_path, "-o", tmp_bmp], check=True, stdout=subprocess.DEVNULL)
    
    with open(tmp_bmp, "rb") as f:
        data = f.read()
    
    offset = struct.unpack("<I", data[10:14])[0]
    w = struct.unpack("<i", data[18:22])[0]
    h = struct.unpack("<i", data[22:26])[0]
    top_down = False
    if h < 0:
        h = -h
        top_down = True
    
    # Pack into 24-bit RGB (Color Type 2 - NO ALPHA)
    raw_rgb = bytearray()
    row_bytes = w * 4
    for y in range(h):
        src_y = y if top_down else (h - 1 - y)
        src_row_start = offset + src_y * row_bytes
        row = data[src_row_start : src_row_start + row_bytes]
        raw_rgb.append(0)  # PNG filter 0
        for x in range(w):
            b = row[x*4]
            g = row[x*4 + 1]
            r = row[x*4 + 2]
            raw_rgb.extend([r, g, b])
            
    compressed = zlib.compress(bytes(raw_rgb), 6)
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    # IHDR color_type = 2 (RGB, no transparency)
    ihdr_data = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    png.extend(struct.pack(">I", len(ihdr_data)))
    png.extend(b"IHDR")
    png.extend(ihdr_data)
    png.extend(struct.pack(">I", zlib.crc32(b"IHDR" + ihdr_data)))
    
    # IDAT
    png.extend(struct.pack(">I", len(compressed)))
    png.extend(b"IDAT")
    png.extend(compressed)
    png.extend(struct.pack(">I", zlib.crc32(b"IDAT" + compressed)))
    
    # IEND
    png.extend(struct.pack(">I", 0))
    png.extend(b"IEND")
    png.extend(struct.pack(">I", zlib.crc32(b"IEND")))
    
    with open(dst_path, "wb") as f:
        f.write(png)

def main():
    print("=== Processing Vega Virtual Device Screenshots (1920x1080 RGB, No Transparency) ===")
    for item in CAPTURES:
        src = item["src"]
        filename = item["name"]
        dst_shot = os.path.join(SHOTS_DIR, filename)
        
        convert_to_rgb24_png(src, dst_shot)
        
        # Verify with sips
        res = subprocess.run(["sips", "-g", "hasAlpha", "-g", "pixelWidth", "-g", "pixelHeight", dst_shot], capture_output=True, text=True)
        print(f"Created: {filename}")
        for line in res.stdout.strip().split("\n"):
            print("  ", line.strip())

    print("\nAll 5 real Vega OS screenshots converted and saved to store_assets/screenshots/!")

if __name__ == "__main__":
    main()
