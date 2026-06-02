#!/usr/bin/env python3
"""
SCRAPER GAMBAR CABAI & PAPRIKA MERAH v3
Sumber: iNaturalist + Unsplash + Flickr (tanpa API key)
Target: 500 gambar per kategori

Install:
    pip install requests beautifulsoup4 pillow

Jalankan:
    python scraper_v3.py
"""

import os, re, time, random, requests
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import quote_plus

# ── Konfigurasi ───────────────────────────────────────
OUTPUT_DIR       = Path("gambar_scrap")
DELAY_MIN        = 1.5
DELAY_MAX        = 4.0
MAX_PER_KATEGORI = 1100

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

KATEGORI = {
    "cabai_merah": {
        "flickr_q":          "red chili, red peppers",
        "flickr_tags":       "redchili,capsicumfrutescens",
    },
    "cabai_hijau": {
        "flickr_q":          "green chili",
        "flickr_tags":       "greenchili,capsicumfrutescens",
    },
    "paprika_merah": {
        "flickr_q":          "red bell pepper, red bell peppers",
        "flickr_tags":       "redbellpepper,redpaprika,bellpepper,paprika,capsicumannuum",
    },
    "paprika_hijau": {
        "flickr_q":          "green bell pepper, green bell peppers",
        "flickr_tags":       "greenbellpepper,greenpaprika,bellpepper,paprika,capsicumannuum",
    },
    "tomat_merah": {
        "flickr_q":          "ripe tomato, red tomato",
        "flickr_tags":       "ripetomato,redtomato,tomato,tomat,solanum",
    },
    "tomat_hijau": {
        "flickr_q":          "green tomato",
        "flickr_tags":       "greentomato,tomato,tomat,solanum",
    },
}
# ─────────────────────────────────────────────────────

def buat_folder(nama):
    f = OUTPUT_DIR / nama
    f.mkdir(parents=True, exist_ok=True)
    return f

def jeda():
    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

def unduh(url, path, sesi, retry=3):
    for i in range(retry):
        try:
            r = sesi.get(url, timeout=25, stream=True)
            if r.status_code == 429:
                wait = int(r.headers.get("Retry-After", 15 * (i+1)))
                print(f"    [429] Tunggu {wait}s...")
                time.sleep(wait)
                continue
            r.raise_for_status()
            if "image" not in r.headers.get("Content-Type", ""):
                return False
            with open(path, "wb") as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            kb = path.stat().st_size // 1024
            if kb < 10:
                path.unlink()
                return False
            print(f"    [OK] {path.name} ({kb} KB)")
            return True
        except Exception as e:
            print(f"    [!] {str(e)[:70]}")
            if i < retry - 1:
                time.sleep(5 * (i + 1))
    return False

def scrape_flickr_web(q, tags, folder, counter, sisa):
    print(f"\n  [Flickr Web] Mencari: '{q}'")

    sesi = requests.Session()
    sesi.headers.update({
        **HEADERS,
        "Referer": "https://www.flickr.com/",
    })

    dapat = 0
    page = 1

    while dapat < sisa:
        try:
            url = f"https://www.flickr.com/search/?text={quote_plus(q)}&page={page}"

            r = sesi.get(url, timeout=20)
            r.raise_for_status()

            soup = BeautifulSoup(r.text, "html.parser")

            urls_found = set()

            # Cari semua tag img
            imgs = soup.find_all("img")

            for img in imgs:

                # Ambil src gambar
                src = (
                    img.get("src")
                    or img.get("data-defer-src")
                    or img.get("data-src")
                )

                if src and "staticflickr.com" in src:

                    # Tambahkan https jika URL diawali //
                    if src.startswith("//"):
                        src = "https:" + src

                    # Ubah ke resolusi besar
                    src = re.sub(
                        r'_(q|t|m|n|s|z|c)\.jpg',
                        '_b.jpg',
                        src
                    )

                    urls_found.add(src)

            print(f"    Page {page}: {len(urls_found)} URL ditemukan")

            if not urls_found:
                print("    Tidak ada gambar ditemukan.")
                break

            # Download gambar
            for img_url in urls_found:

                if dapat >= sisa:
                    break

                path = folder / f"flickr_{counter:04d}.jpg"

                if unduh(img_url, path, sesi):
                    counter += 1
                    dapat += 1

                jeda()

            print(f"    Total Flickr saat ini: {dapat}")

            page += 1

            # Batasi page
            if page > 50:
                print("    Maksimal 10 halaman Flickr.")
                break

        except Exception as e:
            print(f"    [Flickr ERR] {e}")
            break

    print(f"  => Flickr selesai: {dapat} gambar")

    return counter, dapat


# MAIN
def jalankan():
    print("""
""")
    total_semua = 0

    for nama_kat, cfg in KATEGORI.items():
        print(f"\n{'='*52}")
        print(f"  KATEGORI: {nama_kat.upper().replace('_',' ')}")
        print(f"{'='*52}")
        folder  = buat_folder(nama_kat)
        counter = 1
        total   = 0
        if total < MAX_PER_KATEGORI:
            sisa = min(1000, MAX_PER_KATEGORI - total)
            counter, n = scrape_flickr_web(
                cfg["flickr_q"], cfg["flickr_tags"],
                folder, counter, sisa
            )
            total += n
            print(f"\n  Progress: {total}/{MAX_PER_KATEGORI}")

        total_semua += total
        print(f"\n  TOTAL {nama_kat}: {total} gambar")
        print(f"  Folder: {folder.resolve()}")

    print(f"""
====================================================
  SELESAI!
  Total semua kategori : {total_semua} gambar
  Output               : {OUTPUT_DIR.resolve()}
====================================================
""")

if __name__ == "__main__":
    jalankan()