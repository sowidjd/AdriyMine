#!/usr/bin/env python3
"""Pindai naskah: frasa khas AI/kaku, kalimat > 12 kata, dan irama yang terlalu seragam.

Pakai:  python3 .claude/skills/skrip-manusiawi/cek_ai.py projects/<nama>/NASKAH.md
        cat teks.txt | python3 .claude/skills/skrip-manusiawi/cek_ai.py -
Hanya membaca baris naskah: baris berawalan "- " (format NASKAH.md) atau, bila tidak ada, semua baris teks.
Arahan suara _(…)_ dan tabel diabaikan.
"""
import re
import statistics
import sys

KLISE = [
    r"pernahkah (kamu|anda)", r"tahukah (kamu|anda)", r"\bmari kita\b", r"\byuk,? simak", r"di era (digital|modern)",
    r"^faktanya\b", r"\bmenariknya\b", r"\buniknya\b", r"\bselain itu\b", r"\boleh karena itu\b", r"\bdengan demikian\b",
    r"\bpada akhirnya\b", r"bukan (hanya|cuma|sekadar) .+,? (tetapi|tapi) juga", r"lebih dari sekadar", r"\bfenomena\b",
    r"\bmenyelami\b", r"mengungkap rahasia", r"yang menakjubkan", r"\btak terduga\b", r"hal ini menunjukkan",
    r"\bingatlah\b", r"\bpenting untuk (diingat|dipahami|diketahui)\b",
]
KAKU = {
    r"\btidak\b": "nggak", r"\bsangat\b": "banget", r"\bdapat\b": "bisa", r"\bhal (ini|tersebut)\b": "ini/itu/sebut bendanya",
    r"\bmerupakan\b": "hapus / 'itu'", r"\bnamun\b": "tapi / padahal", r"\banda\b": "kamu", r"\bmelakukan\b": "pakai kata kerjanya langsung",
    r"\b(sebuah|seorang)\b": "biasanya hapus", r"\btersebut\b": "itu",
}
TANDA = {"—": "tanda pisah panjang", ";": "titik koma"}


def baris_naskah(teks):
    lines = teks.splitlines()
    # baris naskah "- …" (catatan "- **Alur:**" dilewati); kalau tidak ada, semua baris teks biasa
    pakai = [l[2:] for l in lines if l.startswith("- ") and not l[2:].startswith("**") and "§" not in l] \
        or [l for l in lines if l.strip() and not l.lstrip().startswith(("|", "#", "**"))]
    out = []
    for l in pakai:
        l = re.sub(r"_\(.*?\)_", "", l).strip()      # buang arahan suara
        if l:
            out.append(l)
    return out


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    teks = sys.stdin.read() if sys.argv[1] == "-" else open(sys.argv[1], encoding="utf-8").read()
    rows = baris_naskah(teks)
    temuan, panjang = 0, []
    for i, l in enumerate(rows, 1):
        low = l.lower()
        catat = []
        catat += [f"klise: '{re.search(p, low).group(0)}'" for p in KLISE if re.search(p, low)]
        catat += [f"kaku: '{re.search(p, low).group(0)}' → {g}" for p, g in KAKU.items() if re.search(p, low)]
        catat += [f"{nama}" for t, nama in TANDA.items() if t in l]
        for kal in re.split(r"(?<=[.!?])\s+", l):
            n = len(kal.split())
            if n:
                panjang.append(n)
            if n > 12:
                catat.append(f"kalimat {n} kata (> 12)")
        if catat:
            temuan += len(catat)
            print(f"{i:3}. {l}\n     ⚠ " + "; ".join(catat))
    # irama: simpangan panjang kalimat kecil = datar seperti robot
    if len(panjang) >= 6:
        sd, rata = statistics.pstdev(panjang), statistics.mean(panjang)
        pendek = sum(1 for n in panjang if n <= 4)
        print(f"\nIrama: {len(panjang)} kalimat, rata-rata {rata:.1f} kata, simpangan {sd:.1f}, kalimat pendek (≤ 4 kata) {pendek}.")
        if sd < 2.5:
            print("     ⚠ panjang kalimat terlalu seragam: selipkan kalimat super pendek & variasikan.")
            temuan += 1
        if pendek == 0:
            print("     ⚠ tidak ada kalimat pendek yang 'nendang'.")
            temuan += 1
    print(f"\n{'✓ bersih' if temuan == 0 else f'{temuan} temuan'} ({len(rows)} baris naskah)")


if __name__ == "__main__":
    main()
