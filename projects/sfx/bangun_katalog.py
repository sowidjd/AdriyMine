"""Bangun katalog SFX terpadu dari semua sumber (file TIDAK dipindah).

  python3 projects/sfx/bangun_katalog.py

Hasil: projects/sfx/katalog.json (dibaca oleh cari.py). Jalankan ulang bila ada SFX baru.
"""
import json, os, re, subprocess, concurrent.futures as cf
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D = os.path.join(R, 'projects', 'sfx')
J = lambda *p: os.path.join(R, *p)

# ---- Kategori (taksonomi berbasis momen di video) ----
KATEGORI = {
 'transisi':      'Pindah adegan: whoosh, swish, zip, riser, reverse',
 'muncul-hilang': 'Sesuatu muncul / hilang / pop / berubah bentuk',
 'benturan':      'Tumbukan, pukulan, jatuh, pecah, boom, bass',
 'ui-klik':       'Klik, tombol, ketik keyboard, saklar, antarmuka',
 'notifikasi':    'Ding, ting, bel, jawaban benar/salah, pesan masuk',
 'lucu-kartun':   'Boing, pegas, cartoon, konyol, lucu',
 'tegang':        'Tegang, horor, misteri, ancaman, detak',
 'ajaib':         'Kilau, sihir, shimmer, bintang, chime',
 'suasana':       'Latar loop: kota, hutan, ruangan, angin, keramaian',
 'hewan':         'Suara hewan & makhluk',
 'tubuh':         'Tubuh manusia: perut, napas, detak jantung, batuk, langkah',
 'alam-air':      'Air, ombak, hujan, petir, api, angin, cipratan',
 'alat-benda':    'Benda sehari-hari: pintu, jam, kertas, kayu, logam, dapur',
 'kendaraan':     'Mobil, motor, kereta, pesawat, kapal, sirene',
 'scifi-digital': 'Laser, robot, data, glitch, teknologi, luar angkasa',
 'musik-sting':   'Jingle, sting logo, nada pendek',
 'game-retro':    '8-bit, koin, level up, power up, game',
 'perayaan':      'Tepuk tangan, sorak, kembang api, menang',
 'uang':          'Koin, kasir, uang, kartu, kasino',
 'waktu':         'Jam berdetak, alarm, hitung mundur',
 'suara-orang':   'Suara orang bicara (bahasa Inggris) — HINDARI di bawah narasi',
}

# kata kunci → kategori (cek berurutan; boleh lebih dari satu kategori)
ATURAN = [
 ('suara-orang', r'voiceover|voice ?over|voice|speech|talk|laugh|giggle|scream|yell|shout|kid|baby|male|female|man|woman|girl|boy|human|person|aww|shush|goodbye|hello|cry|gag|sigh|whisper|orang|teriak|tawa'),
 ('perayaan', r'applause|clap|cheer|ovation|firework|celebrat\w*|victory|win|party|confetti|fanfare|yay|tada|tepuk|sorak|kembang api|menang'),
 ('game-retro', r'8.?bit|retro|chiptune|level ?up|power ?up|coin get|rpg|arcade|jump|gmae|game|bleep'),
 ('uang', r'coin|cash|money|register|casino|chip|dice|card|pool|kasir|uang|koin'),
 ('waktu', r'clock|tick|alarm|timer|countdown|jam|detik|bangun'),
 ('kendaraan', r'car|engine|motor|truck|train|plane|airplane|jet|helicopter|boat|ship|siren|horn|traffic|vehicle|flyby|whistle|mobil|kereta|pesawat|kapal|sirene|ambulance|tank|harley|davidson'),
 ('hewan', r'creature|creture|monster|beast|roar|growl|dog|cat|meow|bark|bird|chirp|owl|crow|cow|horse|pig|sheep|lamb|goat|chicken|rooster|duck|frog|cricket|insect|bug|bee|fly|wolf|wolves|lion|tiger|elephant|monkey|snake|whale|dolphin|seal|falcon|eagle|pterodactyl|dinosaur|dino|hewan|burung|elang|alap|kucing|anjing|singa|moose|moo|doberman|grasshopper|horse|bluejay|anhinga|ape|bull|bleat|tomcat|moo'),
 ('tubuh', r'heart|breath|blow|blows|cough|sneeze|burp|stomach|belly|gulp|swallow|chew|bite|eat|footstep|step|walk|run|kiss|snore|fart|nasal|perut|napas|jantung|batuk|langkah|kunyah|tubuh|hiccup\w*|poop\w*|spit|drink|dying|die|gulp|ecg'),
 ('alam-air', r'water|underwater|liquid|splash|drip|drop|bubbl\w*|wave|ocean|sea|river|rain|hail\w*|thunder|storm|wind|fire|flame|burn|lava|slime|squelch\w*|swamp|boil|steam|sink|stone|stones|gravel|rock|avalanche|leaves|rustle|air|hujan|ombak|laut|petir|api|angin|cipratan|gelembung|tornado|jungle|fizz\w*|fireplace|crackl\w*'),
 ('suasana', r'ambien\w*|atmos\w*|loop|room tone|forest|city|crowd|street|night|suasana|latar'),
 ('tegang', r'horror|scary|creepy|suspense|tension|apprehensive|dark|evil|ghost|haunt\w*|drone|heartbeat|cinematic|tegang|horor|misteri|seram|poltergeist|dun dun dun|kill'),
 ('ajaib', r'magic|spell|shimmer|sparkle|twinkle|chime|fairy|glitter|wand|wizard|mystic\w*|ajaib|kilau|sihir'),
 ('scifi-digital', r'sci.?fi|laser|phaser|space|robot|computer|digital|glitch|data|beep|electr\w*|tech\w*|cyber\w*|futur\w*|teleport|warp|alien|ufo|power down|scan|modem|buzz|software|teknologi|luar angkasa'),
 ('lucu-kartun', r'cartoon|boing|spring|funny|comic|silly|squeak|wobble|slide whistle|honk|toy|lucu|kartun|konyol'),
 ('notifikasi', r'ding|ting|bell|notif\w*|alert|correct|wrong|error|success|complete|message|affirmation|jawaban|pesan|benar|salah'),
 ('ui-klik', r'click|button|switch|toggle|interface|ui|gui|menu|hover|select|keyboard|space bar|typing|type|mouse|klik|tombol|ketik'),
 ('benturan', r'hit|punch|impact|crash|smash|break|shatter|glass|fall|thud|slam|bang|boom|explo\w*|bomb\w*|grenade|flashbang|crack|destr\w*|kick|slap|bass|attack|stab|spear|shot|gun|rapid fire|ricochet|sword|blade|whip|thump|knock|benturan|pukul|jatuh|pecah|ledak|tumbuk|hantam|rifle|missile|arrow|knife|silencer|barreta|barrett|throw|shoot|blast'),
 ('transisi', r'whoosh|woosh|swoosh|swish|swipe|zip|riser|rise|reverse|sweep|transition|pass ?by|transisi|menukik|zoom|spin\w*'),
 ('muncul-hilang', r'pop|appear|vanish|disappear|morph|poof|blink|plop|fizzle|muncul|hilang|blop|newthingget'),
 ('musik-sting', r'jingle|sting|music|melody|tune|tone|chord|guitar|piano|flute|drum|gong|musik|nada'),
 ('alat-benda', r'door|paper|book|page|pen|pencil|write|wood|wooden|metal|tool|hammer|saw|drill|workshop|kitchen|cooking|plate|dish|pot|pan|cup|can|soda|plastic|cloth|toilet|flush|bathroom|machine|mechanism|bulb|light|spray|glass|bottle|zipper|bag|key|lock|chair|table|phone|camera|shutter|fridge|microwave|stamp|scissor|tape|box|apple|kertas|pintu|kayu|logam|alat|benda|kamera|kulkas|stempel|telephone|ringtone|radio|frying|fry|projector|pin|hacksaw'),
]
KIT_KAT = {
 'whooshes':'transisi','swishes-and-zips':'transisi','swipes':'transisi','reverse-whooshes':'transisi','risers-and-fallers':'transisi',
 'bounce-spin-zoom':'lucu-kartun','impacts':'benturan','cinematic-hits':'benturan','booms-and-bass':'benturan','pops':'muncul-hilang',
 'appear-and-vanish':'muncul-hilang','shape-changes':'muncul-hilang','interface':'ui-klik','keyboard':'ui-klik',
 'writing-and-drawing':'alat-benda','phone':'notifikasi','mechanical':'alat-benda','foley':'alat-benda','everyday-props':'alat-benda',
 'notifications':'notifikasi','tones':'musik-sting','shimmers':'ajaib','logo-stings':'musik-sting','celebration':'perayaan',
 'time':'waktu','money':'uang','digital':'scifi-digital','data':'scifi-digital'}
SAYA_KAT = {'Alat & benda':'alat-benda','Suasana (ambience)':'suasana','Tubuh':'tubuh','Laut & air':'alam-air',
 'UI & notifikasi':'notifikasi','Sinematik':'tegang','Musik (efek)':'musik-sting','Hewan':'hewan','Makanan':'tubuh',
 'Sains':'scifi-digital','Mesin & benturan':'benturan','Teknologi':'scifi-digital','Transisi':'transisi'}

# kamus Inggris → Indonesia supaya bisa dicari dengan kata Indonesia
KAMUS = dict(x.split('=') for x in '''whoosh=wus swoosh=wus swish=wus rain=hujan thunder=petir water=air splash=cipratan wave=ombak ocean=laut sea=laut
river=sungai fire=api wind=angin storm=badai bubble=gelembung drip=tetes door=pintu knock=ketuk paper=kertas book=buku page=halaman wood=kayu
metal=logam glass=kaca break=pecah crash=tabrak hit=pukul punch=tinju fall=jatuh explosion=ledakan bang=dor boom=dentum click=klik button=tombol
switch=saklar keyboard=keyboard typing=ketik bell=bel ding=ting alarm=alarm clock=jam tick=detik coin=koin money=uang cash=uang card=kartu dice=dadu
dog=anjing cat=kucing bird=burung owl=burung_hantu cow=sapi horse=kuda chicken=ayam rooster=ayam_jago duck=bebek frog=katak cricket=jangkrik
bee=lebah wolf=serigala lion=singa monster=monster creature=makhluk roar=auman growl=geraman heart=jantung heartbeat=detak_jantung breath=napas
cough=batuk sneeze=bersin burp=sendawa footstep=langkah step=langkah walk=jalan run=lari eat=makan chew=kunyah stomach=perut car=mobil engine=mesin
train=kereta plane=pesawat boat=kapal siren=sirene horn=klakson laser=laser robot=robot space=luar_angkasa magic=ajaib spell=sihir sparkle=kilau
twinkle=kelip chime=dentang applause=tepuk_tangan clap=tepuk cheer=sorak firework=kembang_api win=menang lose=kalah correct=benar wrong=salah
error=salah success=berhasil level=level jump=lompat pop=pop appear=muncul vanish=hilang scary=seram horror=horor creepy=seram ghost=hantu
cartoon=kartun funny=lucu spring=pegas slime=lendir swamp=rawa forest=hutan city=kota crowd=keramaian night=malam leaves=daun gravel=kerikil
snow=salju mud=lumpur stone=batu tool=alat hammer=palu saw=gergaji drill=bor steam=uap boil=mendidih kitchen=dapur phone=hp camera=kamera
zipper=resleting scream=teriak laugh=tawa voice=suara music=musik jingle=jingle drum=drum guitar=gitar piano=piano beep=bip glitch=glitch
whistle=peluit shot=tembakan gun=pistol sword=pedang cut=potong slice=iris tear=sobek rip=sobek crumple=remas squeak=cicit'''.split())

def durasi(p):
    try:
        o = subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',p],capture_output=True,text=True,timeout=20).stdout.strip()
        return round(float(o), 2)
    except Exception:
        return None

def kategorikan(teks):
    t = teks.lower().replace('_', ' ').replace('-', ' ')
    k = [c for c, pola in ATURAN if re.search(r'\b(?:' + pola + r')(?:s|es|ing|ed|er|y)?\b', t)]
    return k or ['lain']

def kata_id(teks):
    t = re.findall(r'[a-z]+', teks.lower())
    return sorted({KAMUS[w].replace('_', ' ') for w in t if w in KAMUS} |
                  {KAMUS[w[:-1]].replace('_', ' ') for w in t if w.endswith('s') and w[:-1] in KAMUS})

out = []
def tambah(**e):
    e.setdefault('tersedia', os.path.exists(J(e['file'])))
    out.append(e)

# 1) sfx-saya (milik pemilik, ElevenLabs)
for v in json.load(open(J('projects/sfx-saya/katalog.json'))):
    f = 'projects/sfx-saya/' + v.get('normal', 'audio/' + v['file'])
    teks = ' '.join([v['file'], v.get('cocok_untuk', ''), ' '.join(v.get('tags', [])), v.get('prompt_en', '')])
    teks_kat = ' '.join([v['file'].rsplit('.', 1)[0], v.get('cocok_untuk', ''), ' '.join(v.get('tags', []))])
    kat = [SAYA_KAT.get(v['kategori'], 'lain')] + [k for k in kategorikan(teks_kat) if k != 'lain']
    tambah(id='saya/' + v['file'].rsplit('.', 1)[0], sumber='sfx-saya', prioritas=1, file=f,
           asli='projects/sfx-saya/audio/' + v['file'], judul=v['file'].rsplit('.', 1)[0].replace('_', ' '),
           kategori=list(dict.fromkeys(kat)), cocok_untuk=v.get('cocok_untuk', ''), hindari='',
           kata_kunci=sorted(set(v.get('tags', [])) | set(kata_id(teks))), durasi_s=v.get('durasi_s'),
           lisensi='ElevenLabs (milik pemilik)', kredit_wajib=False, boleh_di_repo=True)

# 2) _bersama/sfx (rekaman/olahan proyek)
for f in sorted(os.listdir(J('projects/_bersama/sfx'))):
    if not f.endswith('.wav'): continue
    p = 'projects/_bersama/sfx/' + f; n = f[:-4]
    tambah(id='bersama/' + n, sumber='bersama', prioritas=1, file=p, judul=n.replace('-', ' '),
           kategori=list(dict.fromkeys(kategorikan(n))), cocok_untuk=n.replace('-', ' '), hindari='',
           kata_kunci=n.split('-'), durasi_s=durasi(J(p)), lisensi='Milik proyek', kredit_wajib=False, boleh_di_repo=True)

# 3) sfx-kit (CC0, metadata paling lengkap)
for s in json.load(open(J('repos/sfx-kit/sounds.json')))['sounds']:
    teks = ' '.join([s['id'], s['name'], s.get('description', ''), ' '.join(s.get('tags', [])), ' '.join(s.get('use_for', []))])
    kat = [KIT_KAT.get(s['category'], 'lain')]
    tambah(id='kit/' + s['id'], sumber='sfx-kit', prioritas=2, file='repos/sfx-kit/' + s['file'], judul=s['name'],
           kategori=kat, kategori_asli=s['category'], cocok_untuk='; '.join(s.get('use_for', [])),
           hindari='; '.join(s.get('avoid_for', [])), kata_kunci=sorted(set(s.get('tags', [])) | set(kata_id(teks))),
           durasi_s=s.get('duration'), kekuatan=(s.get('level') or {}).get('tier'),
           sync_at=(s.get('sync') or {}).get('at'), turun_di_narasi_db=s.get('under_voiceover_db'),
           lisensi='CC0', kredit_wajib=False, boleh_di_repo=True)

# 4) sfx-bebas (opengameart + soundbible)
bebas = json.load(open(J('projects/sfx-bebas/katalog.json')))['sfx']
with cf.ThreadPoolExecutor(16) as ex:
    durs = list(ex.map(lambda v: durasi(J('projects/sfx-bebas', v['file'])), bebas))
for v, d in zip(bebas, durs):
    paket = v.get('paket', '')
    teks = f"{v['judul']} {paket} {os.path.basename(v['file']).rsplit('.', 1)[0]}"
    by = 'BY' in v['lisensi']
    kat = kategorikan(teks)
    if paket.startswith('Voiceover'): kat = ['suara-orang']
    if paket.startswith('85 Short music'): kat = ['musik-sting']
    tambah(id='bebas/' + v['file'].rsplit('.', 1)[0], sumber='sfx-bebas', prioritas=4 if by else 3,
           file='projects/sfx-bebas/' + v['file'], judul=v['judul'], paket=paket, kategori=kat,
           cocok_untuk='', hindari='suara orang berbahasa Inggris, jangan di bawah narasi' if 'suara-orang' in kat else '',
           kata_kunci=kata_id(teks), durasi_s=d, lisensi=v['lisensi'], kredit_wajib=by,
           kredit=f"\"{v['judul']}\" oleh {v['pembuat']}, {v['lisensi']}, {v['sumber']}" if by else '',
           boleh_di_repo=True)

# 5) Mixkit (hanya katalog; file tidak ada di container & dilarang di repo publik)
for v in json.load(open(J('projects/sfx-saya/mixkit/katalog.json'))):
    teks = f"{v['nama']} {v.get('cocok_untuk', '')}"
    kat = kategorikan(teks)
    if v.get('suasana_loop') and 'suasana' not in kat: kat.append('suasana')
    tambah(id='mixkit/' + v['nama'], sumber='mixkit', prioritas=5, file='projects/sfx-saya/mixkit/' + v['normal'],
           judul=v['nama'].replace('-', ' '), kategori=kat, cocok_untuk=v.get('cocok_untuk', ''), hindari='',
           kata_kunci=kata_id(teks), durasi_s=v.get('durasi_s'), loop=v.get('suasana_loop', False),
           lisensi='Mixkit Free License (belum dikonfirmasi pemilik)', kredit_wajib=False, boleh_di_repo=False)

SENSITIF = re.compile(r'\b(?:gun|shotgun|rifle|sniper|pistol|m4a1|winchester|barrett\w*|barreta|silencer|grenade|missile|bomb\w*|suicide|decapitat\w*|kill|blood|gore|dying|battlefield|war|stab)\b')
def grup(e):
    b = os.path.basename(e['file']).rsplit('.', 1)[0].lower()
    b = re.sub(r'([\s_-]*\d+[a-z]?)+$', '', b)
    if e['sumber'] == 'sfx-kit':
        b = re.sub(r'-(soft|medium|firm|hard|subtle|short|long|light|heavy|bright|dark|large|small|big|massive|strong|in|out)\b', '', b)
    return e['sumber'] + ':' + os.path.basename(os.path.dirname(e['file'])) + '/' + b
KOREKSI = json.load(open(os.path.join(D, 'koreksi.json')))
for e in out:
    e['grup'] = grup(e)
    e['kata_judul'] = kata_id(e['id'] + ' ' + e['judul'])
    kr = KOREKSI.get(e['id'])
    if kr == 'buang': e['dibuang'] = True
    elif kr: e['kategori'] = kr
    if SENSITIF.search((e['judul'] + ' ' + e.get('paket', '')).lower().replace('-', ' ')):
        e['sensitif'] = True
    if e['durasi_s'] is not None:
        e['panjang'] = 'pendek' if e['durasi_s'] < 1.5 else 'sedang' if e['durasi_s'] < 5 else 'panjang'
json.dump({'catatan': 'Dibangun oleh bangun_katalog.py. Jangan edit manual. Prioritas: 1 milik sendiri, 2 sfx-kit, 3 bebas CC0/PD, 4 bebas CC BY (wajib kredit), 5 Mixkit (file tidak tersedia).',
           'kategori': KATEGORI, 'sfx': out}, open(os.path.join(D, 'katalog.json'), 'w'), ensure_ascii=False, indent=0)
import collections
print(len(out), 'SFX'); print(collections.Counter(e['sumber'] for e in out))
c = collections.Counter(k for e in out for k in e['kategori']); print(c.most_common())
print('tidak tersedia:', collections.Counter(e['sumber'] for e in out if not e['tersedia']))

# ---- ANDALAN.md: menu pendek 6 pilihan per kategori (hemat token untuk AI) ----
SINGKAT = [('projects/sfx-saya/normal/', 'saya:'), ('repos/sfx-kit/sounds/', 'kit:'),
           ('projects/sfx-bebas/opengameart/', 'bebas:'), ('projects/sfx-bebas/soundbible/', 'sb:'), ('projects/_bersama/sfx/', 'bersama:')]
def pendek(f):
    for a, b in SINGKAT:
        if f.startswith(a): return b + f[len(a):]
    return f
def singkat(e):
    c = e['cocok_untuk'].split(';')[0].strip() if e['cocok_untuk'] else ''
    return c[:45] + ('…' if len(c) > 45 else '')
baris = ['# SFX andalan (dibuat otomatis oleh bangun_katalog.py, jangan diedit)', '',
         'Baca ini DULU. Kalau tidak ada yang pas: `python3 projects/sfx/cari.py <kata>`. Aturan lengkap: PANDUAN.md.',
         'Singkatan path: saya: = projects/sfx-saya/normal/ · kit: = repos/sfx-kit/sounds/ · bebas: = projects/sfx-bebas/opengameart/ · sb: = projects/sfx-bebas/soundbible/',
         'Bunyi khas nama channel selalu kit:logo-stings/sting-bright-short.wav. Semua di bawah bebas kredit.', '']
for k, ket in KATEGORI.items():
    if k == 'suara-orang': continue
    cal = [e for e in out if k in e['kategori'] and e['tersedia'] and not e.get('sensitif') and not e.get('dibuang')
           and 'suara-orang' not in e['kategori'] and not e['kredit_wajib']]
    cal.sort(key=lambda e: (e['kategori'].index(k) > 0, e['prioritas'], (e['durasi_s'] or 0) > 10, e['kategori'].index(k)))
    pilih, g = [], set()
    for e in cal:
        if e['grup'] in g: continue
        g.add(e['grup']); pilih.append(e)
        if len(pilih) == 6: break
    baris.append(f'## {k} — {ket}')
    baris += [f"- {pendek(e['file'])} {e['durasi_s'] or 0:.1f}s {singkat(e)}" for e in pilih]
    baris.append('')
open(os.path.join(D, 'ANDALAN.md'), 'w').write('\n'.join(baris))
