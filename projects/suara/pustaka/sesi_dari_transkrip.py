"""Pasangkan panggilan creative_generate_speech di transkrip sesi dengan session_id hasilnya.
Dipakai saat membangun pustaka, supaya catatan sesi tidak hilang walau percakapan diringkas.

  python3 sesi_dari_transkrip.py <transkrip.jsonl> <tahapN.tsv>   -> cetak "session_id<TAB>suara" sesuai urutan tsv,
                                                                      lalu baris yang belum dibuat
"""
import json, sys
SUARA = {'AYDmN9T80hHmJLs3rapG': 'hasan', 'CxsauwAuNDfhOy59Ryo8': 'amy'}
calls, results = {}, {}
for line in open(sys.argv[1]):
    try: ev = json.loads(line)
    except Exception: continue
    msg = ev.get('message') or {}
    for c in msg.get('content') or []:
        if not isinstance(c, dict): continue
        if c.get('type') == 'tool_use' and c.get('name', '').endswith('creative_generate_speech'):
            calls[c['id']] = c['input']
        elif c.get('type') == 'tool_result':
            txt = c.get('content')
            if isinstance(txt, list): txt = ''.join(x.get('text', '') for x in txt if isinstance(x, dict))
            try: r = json.loads(txt)
            except Exception: continue
            if isinstance(r, dict) and r.get('session_ids'): results[c['tool_use_id']] = r['session_ids'][0]
done = {}
for k, inp in calls.items():
    if k in results and inp.get('voice_id') in SUARA:
        done.setdefault((inp['prompt'], SUARA[inp['voice_id']]), (results[k], inp.get('flow_id')))
rows = [l.rstrip('\n').split('\t') for l in open(sys.argv[2]) if l.strip()]
out, belum = [], []

for suara in ('hasan', 'amy'):
    for i, (fid, teks) in enumerate(rows):
        s = done.get((teks, suara))
        (out if s else belum).append((i, fid, teks, suara, s))
json.dump({'selesai': [(i, f, t, v, s[0], s[1]) for i, f, t, v, s in out], 'belum': [(i, f, t, v) for i, f, t, v, _ in belum]},
          sys.stdout, ensure_ascii=False)
