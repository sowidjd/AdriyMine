// Menyusun www/icons.js dari lucide-static (ISC) — hanya ikon yang dipakai
const fs=require('fs'),path=require('path');
const dir=process.argv[2];
const names=['house','file-text','folder','calendar','calendar-days','chevron-right','chevron-left','chevron-down','search','sliders-horizontal','layout-grid','star','bookmark','archive','trash-2','ellipsis-vertical','arrow-up-down','plus','undo-2','redo-2','bold','italic','underline','list','list-ordered','square-check','link','image','table','book-open','pencil','cloud','arrow-left','x','history','settings','paperclip','send','calendar-plus','square-check-big','zap','briefcase-business','circle-play','flag','sticky-note','file','message-circle-more','list-filter','check','download','upload','folder-input','pen-line','layout-list','music','video','file-archive','share-2','pin','type','quote','code','minus','copy','file-down','eye','menu','square-pen','refresh-cw','thumbs-up','thumbs-down','square','file-plus','file-check'];
let out='window.ICONS={';
for(const n of names){
  const s=fs.readFileSync(path.join(dir,n+'.svg'),'utf8');
  const inner=s.replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>[\s\S]*$/,'').replace(/\s+/g,' ').trim();
  out+=JSON.stringify(n)+':'+JSON.stringify(inner)+',';
}
out+='};';
fs.writeFileSync(process.argv[3],out);
console.log('icons',names.length);
