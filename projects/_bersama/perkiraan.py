"""Timeline perkiraan (sebelum suara jadi) + daftar detik untuk pratinjau: python3 perkiraan.py <folder> id1,id2,..."""
import json, sys, os
d = sys.argv[1]; n = json.load(open(os.path.join(d, 'naskah.json'))); t = n['lead']; L = []
for l in n['lines']:
    dur = max(1.0, len(l['text'].split()) / 2.4); L.append({'id': l['id'], 't0': round(t, 3), 't1': round(t + dur, 3), 'cap': l['cap']}); t += dur + l['gap']
json.dump({'duration': round(t + 2.5, 3), 'lines': L, 'perkiraan': True}, open(os.path.join(d, 'timeline.json'), 'w'), ensure_ascii=False)
LN = {l['id']: l for l in L}; print(','.join('%g' % round(LN[g]['t0'] + 1.4, 1) for g in sys.argv[2].split(',')))
