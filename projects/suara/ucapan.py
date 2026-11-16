"""Kamus ucapan untuk tiruan suara (VoxCPM2), hasil pelatihan & pengecekan dengan Whisper.
Pelajaran dari pelatihan alfabet: huruf yang diucapkan tanpa konteks membuat nada melonjak; beri kalimat pengantar
("Sekarang hurufnya: ...") lalu potong pengantarnya (lihat alfabet_versi.py). Di dalam kalimat biasa, konteks sudah ada.
  from ucapan import siapkan
  siapkan("Taruh HP jauh dari kasur, matikan alarm.")  ->  "Taruh Ha Pé jauh dari kasur, matikan alarrm."
Hanya untuk teks yang dibacakan; teks di layar tetap memakai ejaan asli."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
HURUF = json.load(open(os.path.join(HERE, 'kamus_huruf.json')))   # A -> "A", B -> "Bé", ... (alfabet versi 2: lolos cek Whisper & dipilih pemilik suara)
# kata yang terbukti sering salah ucap -> ejaan bantu yang berhasil (lihat projects/bangun-pagi/perbaiki_ucapan.py)
KATA = {'alarm': 'alarrm', 'Alarm': 'Alarrm', 'snooze': 'snuz', 'Snooze': 'Snuz', 'Cahaya': 'Cahaaya', 'cahaya': 'cahaaya',
        'weekend': 'wiken', 'Weekend': 'Wiken', 'Clawd': 'Klod'}

def eja(singkatan):
    """'HP' -> 'Ha Pé', 'AI' -> 'Aa I' : singkatan dibaca per huruf dengan ejaan yang sudah lolos pelatihan."""
    return ' '.join(HURUF.get(c.upper()) or c for c in singkatan if c.isalpha())

def siapkan(teks, baca_huruf=True):
    for k, v in KATA.items(): teks = re.sub(rf'\b{k}\b', v, teks)
    if baca_huruf:   # kata kapital 2-5 huruf tanpa vokal di tengah dianggap singkatan (HP, TV, AI, DM)
        teks = re.sub(r'\b[A-Z]{2,5}\b', lambda m: eja(m.group()), teks)
    return teks

if __name__ == '__main__':
    for s in ['Taruh HP jauh dari kasur.', 'Matikan alarm, buka TV.', 'Kirim DM ke aku.', 'Pakai AI buat bikin konten.']:
        print(s, '->', siapkan(s))
