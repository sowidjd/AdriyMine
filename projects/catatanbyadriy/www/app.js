/* CatatanByAdriy — logika aplikasi (offline, data di perangkat) */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CUSTOM={
  'nav-house-on':'<path d="M3 10.2a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6a2 2 0 0 1 .7 1.5V19a2 2 0 0 1-2 2h-4.3v-5.6a1.6 1.6 0 0 0-1.6-1.6h-2.2a1.6 1.6 0 0 0-1.6 1.6V21H5a2 2 0 0 1-2-2z" fill="currentColor"/>',
  'nav-file-on':'<path d="M6.2 2h8.3L20 7.5V20a2 2 0 0 1-2 2H6.2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="currentColor"/><path d="M8.6 12.6h6.8M8.6 16.6h6.8M8.6 8.6h2.6" stroke="#fff" stroke-width="2"/>',
  'nav-folder-on':'<path d="M2 6.2a2.2 2.2 0 0 1 2.2-2.2h4.6c.6 0 1.1.3 1.5.7L12 6.6h7.8A2.2 2.2 0 0 1 22 8.8v9a2.2 2.2 0 0 1-2.2 2.2H4.2A2.2 2.2 0 0 1 2 17.8z" fill="currentColor"/>',
  'nav-cal-on':'<rect x="3" y="4.6" width="18" height="16.8" rx="3.2" fill="currentColor"/><path d="M8 2.4v4.2M16 2.4v4.2" stroke="currentColor" stroke-width="2.4"/><path d="M7.5 14.2h9" stroke="#fff" stroke-width="2.2"/><path d="M3 9.6h18" stroke="#fff" stroke-width="1.2" opacity=".5"/>',
  'nav-ai':'<path d="M10.5 1.8c.8 5.8 2.5 7.5 8.3 8.3-5.8.8-7.5 2.5-8.3 8.3-.8-5.8-2.5-7.5-8.3-8.3 5.8-.8 7.5-2.5 8.3-8.3z"/><path d="M19.6 15.4v6.2M16.5 18.5h6.2"/>',
  'nav-ai-on':'<path d="M10.5 1.8c.8 5.8 2.5 7.5 8.3 8.3-5.8.8-7.5 2.5-8.3 8.3-.8-5.8-2.5-7.5-8.3-8.3 5.8-.8 7.5-2.5 8.3-8.3z" fill="currentColor"/><path d="M19.6 15.4v6.2M16.5 18.5h6.2" stroke="currentColor" stroke-width="2.2"/>',
  'bars':'<rect x="1.5" y="12.5" width="5.2" height="9.5" rx="1.6" fill="#3b82f6" stroke="none"/><rect x="9.4" y="7.5" width="5.2" height="14.5" rx="1.6" fill="#1d63e0" stroke="none"/><rect x="17.3" y="2" width="5.2" height="20" rx="1.6" fill="#1d63e0" stroke="none"/>',
  'star-fill':'<path d="M11.5 2.3a.6.6 0 0 1 1 0l2.8 5.8 6.3.9a.6.6 0 0 1 .3 1l-4.6 4.4 1.1 6.3a.6.6 0 0 1-.8.6L12 18.3l-5.6 3a.6.6 0 0 1-.8-.6l1.1-6.3L2.1 10a.6.6 0 0 1 .3-1l6.3-.9z"/>',
  'play':'<path d="M6 3.8v16.4a1 1 0 0 0 1.5.9l13.2-8.2a1 1 0 0 0 0-1.8L7.5 2.9A1 1 0 0 0 6 3.8z"/>',
  'cloud-check':'<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m9 13.5 2 2 4-4"/>',
  'pdf':'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h6"/><rect x="6.6" y="11.4" width="10.8" height="6" rx="1" fill="currentColor" stroke="none"/><text x="12" y="16" font-size="4.4" font-weight="800" text-anchor="middle" fill="#fff" stroke="none" font-family="Arial">PDF</text>',
  'sparkle-ai':'<path d="M10 3.5c.6 4.4 1.9 5.7 6.3 6.3-4.4.6-5.7 1.9-6.3 6.3-.6-4.4-1.9-5.7-6.3-6.3 4.4-.6 5.7-1.9 6.3-6.3z" fill="currentColor"/><path d="M18.2 13.6c.3 2 .9 2.6 2.9 2.9-2 .3-2.6.9-2.9 2.9-.3-2-.9-2.6-2.9-2.9 2-.3 2.6-.9 2.9-2.9z" fill="currentColor"/><path d="M17.5 3.2c.2 1.3.6 1.7 1.9 1.9-1.3.2-1.7.6-1.9 1.9-.2-1.3-.6-1.7-1.9-1.9 1.3-.2 1.7-.6 1.9-1.9z" fill="currentColor"/>',
  'send-fill':'<path d="M21.4 2.6 2.9 10.1c-.8.3-.8 1.5.1 1.8l6.4 2.2 2.2 6.4c.3.9 1.5.9 1.8.1l7.5-18.5c.3-.8-.5-1.6-1.3-1.3z"/><path d="m9.4 14.1 5.2-5.2" stroke="#2a6fe8" stroke-width="1.6"/>',
  'chatfill':'<path d="M12 2.5c5.5 0 10 3.9 10 8.7s-4.5 8.7-10 8.7c-1.3 0-2.6-.2-3.8-.6L3.5 21l1.3-4.2C3.1 15.3 2 13.3 2 11.2 2 6.4 6.5 2.5 12 2.5z" fill="#1e6ff0" stroke="none"/><circle cx="7.6" cy="11.2" r="1.3" fill="#fff" stroke="none"/><circle cx="12" cy="11.2" r="1.3" fill="#fff" stroke="none"/><circle cx="16.4" cy="11.2" r="1.3" fill="#fff" stroke="none"/>',
  'x-small':'<path d="M6 6l12 12M18 6 6 18"/>'
};
function ic(n,cls,st){const p=CUSTOM[n]||(window.ICONS[n]||'');return `<svg class="i ${cls||''}" viewBox="0 0 24 24"${st?` style="${st}"`:''}>${p}</svg>`;}

/* ---------- tanggal ---------- */
const HARI=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const BLN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const pad=n=>String(n).padStart(2,'0');
const dayStart=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
const ymd=d=>{d=new Date(d);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const parseYmd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const hm=d=>pad(d.getHours())+'.'+pad(d.getMinutes());
function rel(ts){const d=new Date(ts),t=dayStart(Date.now()),diff=Math.round((dayStart(d)-t)/864e5);
  if(diff===0)return 'Hari ini, '+hm(d); if(diff===-1)return 'Kemarin, '+hm(d);
  return d.getDate()+' '+BLN[d.getMonth()]+' '+d.getFullYear()+', '+hm(d);}
function at(off,h,m){const d=dayStart(Date.now());d.setDate(d.getDate()+off);d.setHours(h,m,0,0);return off<=0?Math.min(d.getTime(),Date.now()-(h*60+m)*1000):d.getTime();}
const fmtSize=b=>{if(b>=1e9)return (b/1e9).toFixed(1).replace('.',',')+' GB';if(b>=1e6)return (b/1e6).toFixed(1).replace('.0','').replace('.',',')+' MB';if(b>=1e3)return Math.round(b/1e3)+' KB';return b+' B'};

/* ---------- data ---------- */
const KEY='cba_data_v1';
let S;
const TILE={kerja:'nt_blue',belajar:'nt_purple',konten:'nt_green',finansial:'nt_yellow',bahasa:'nt_pink',pribadi:'nt_purple'};
const TAGN={kerja:'Kerja',belajar:'Belajar',konten:'Konten',finansial:'Finansial',bahasa:'Bahasa',pribadi:'Pribadi'};
const COKING=`<h2>Pendahuluan</h2><p>Proses coking adalah proses pemanasan batubara tanpa oksigen di dalam tungku kokas untuk menghasilkan kokas, gas kokas, dan produk samping seperti tar, benzena, naftalena, dan amonia.</p><h2>Alur Proses Utama</h2><ol class="steps"><li><b>Persiapan Batubara</b><span>Pencampuran beberapa jenis batubara sesuai rasio, kemudian dihancurkan dan disaring (&lt; 3 mm).</span></li><li><b>Pengisian ke Tungku</b><span>Batubara halus dimasukkan ke dalam tungku (top-loading atau tamping) dengan densitas dan tinggi muatan sesuai standar.</span></li><li><b>Proses Kokasifikasi</b><span>Pemanasan pada suhu ±1.000–1.100°C selama ±18–20 jam tanpa oksigen, terjadi pirolisis yang menghasilkan gas kokas dan kokas padat.</span></li><li><b>Pendinginan dan Pengeluaran</b><span>Kokas didinginkan (quenching) lalu dikeluarkan dari tungku untuk kemudian dikirim ke proses berikutnya.</span></li></ol>`;
function seed(){
  let id=1;const N=(title,sub,tag,upd,o)=>Object.assign({id:'n'+(id++),title,sub,tag,body:`<h2>${esc(title)}</h2><p>${esc(sub)}.</p>`,updated:upd,opened:upd,labels:[],star:false,fav:false,archived:false,trashed:false,pinned:false,draft:false},o||{});
  const notes=[
    N('Alur Proses Coking','Ringkasan alur produksi, parameter, dan catatan penting','kerja',at(0,7,50),{body:COKING,labels:['Produksi']}),
    N('Rencana Konten YouTube','Ide, outline, dan jadwal upload mingguan','konten',at(0,7,50),{pinned:true,draft:true,opened:at(-1,21,14),labels:['Konten'],body:'<h2>Ide Video</h2><p>Kumpulan ide video untuk minggu ini.</p><h2>Outline</h2><p>Hook, isi, dan penutup untuk setiap video.</p><h2>Jadwal Upload</h2><p>Upload rutin setiap minggu pukul 20.00.</p>'}),
    N('Materi Pembelajaran Produksi','Rangkuman materi, proses, dan poin penting','belajar',at(-1,21,14),{star:true,opened:at(-6,19,0)}),
    N('Ide Konten Sains','Daftar ide topik: luar angkasa, penemuan, dan fakta unik','konten',at(-2,19,30),{draft:true}),
    N('Target & Rencana Keuangan','Target bulanan, investasi, dan evaluasi','finansial',at(-3,8,10)),
    N('Belajar Mandarin','Kosakata dasar, frasa kerja, dan catatan harian','bahasa',at(-4,20,6)),
  ];
  const more=[['Checklist Shift Malam','Daftar periksa sebelum dan sesudah shift','kerja'],['Laporan Harian Produksi','Catatan hasil produksi per shift','kerja'],['Ide Shorts Fakta Unik','Ide video pendek fakta unik','konten',1],['Naskah Video Burung Hantu','Draf naskah video edukasi','konten',1],['Kosakata HSK 1','Daftar kosakata Mandarin tingkat dasar','bahasa'],['Anggaran Bulanan','Rencana pemasukan dan pengeluaran','finansial'],['Skrip Hook TikTok','Kumpulan kalimat pembuka video','konten',1],['Parameter Tungku Kokas','Catatan suhu dan waktu proses','kerja'],['Ringkasan Buku','Poin penting dari buku yang dibaca','belajar'],['Draft Thumbnail YouTube','Ide teks dan gambar thumbnail','konten',1],['Frasa Mandarin di Tempat Kerja','Frasa yang sering dipakai saat kerja','bahasa'],['Catatan Investasi','Catatan investasi dan evaluasi bulanan','finansial'],['Ide Konten Edukasi Sains','Ide konten edukasi untuk pelajar','konten',1],['Catatan K3 Area Kokas','Poin keselamatan kerja di area tungku','kerja'],['Draft Caption Instagram','Draf caption untuk unggahan','konten',1],['Dasar Kimia Batubara','Catatan belajar sifat batubara','belajar'],['Daftar Lagu Backsound','Pilihan musik latar untuk konten','konten'],['Jadwal Olahraga Pagi','Rutinitas olahraga sebelum shift','pribadi']];
  more.forEach((m,i)=>notes.push(N(m[0],m[1],m[2],at(-5-i,9+(i%10),(i*7)%60),{draft:!!m[3]})));
  const F=(name,size,type,ts,folder,o)=>Object.assign({id:'f'+(id++),name,size,type,ts,folder,seed:true},o||{});
  const files=[
    F('Alur Proses Coking.pdf',12.4e6,'pdf',at(0,8,20),'Materi Produksi'),
    F('Materi Pelatihan Produksi.docx',8.7e6,'doc',at(-1,21,14),'Materi Produksi'),
    F('Diagram Alur Coking.png',2.9e6,'image',at(-2,19,30),'Materi Produksi',{thumb:'img/fi_thumb.png'}),
    F('Cara Kerja Tungku Kokas.mp4',285e6,'video',at(-3,10,24),'Referensi',{thumb:'img/fi_video.png'}),
    F('Backsound Konten.mp3',6.1e6,'music',at(-4,20,6),'Konten YouTube'),
  ];
  [['Parameter Tungku.pdf',3.2e6,'pdf','Materi Produksi'],['Naskah Video.docx',.4e6,'doc','Konten YouTube'],['Thumbnail Sains.png',1.8e6,'image','Aset Desain'],['Intro Channel.mp4',48e6,'video','Konten YouTube'],['Logo Adriy.png',.9e6,'image','Aset Desain'],['Laporan Bulanan.pdf',2.1e6,'pdf','Arsip'],['Aset Desain.zip',64e6,'zip','Aset Desain'],['Sound Effect Pop.mp3',.3e6,'music','Konten YouTube'],['KTP Scan.jpg',1.1e6,'image','Pribadi'],['Referensi K3.pdf',5.6e6,'pdf','Referensi'],['Template Thumbnail.zip',22e6,'zip','Aset Desain'],['Catatan Kursus.txt',.02e6,'other','Pribadi']]
    .forEach((f,i)=>files.push(F(f[0],f[1],f[2],at(-6-i*2,10+(i%8),(i*13)%60),f[3])));
  const folders=[['Materi Produksi',24,'f_gear'],['Konten YouTube',18,'f_play'],['Referensi',32,'f_book'],['Pribadi',12,'f_user'],['Aset Desain',56,'f_img'],['Arsip',9,'f_arch']].map(f=>({name:f[0],count:f[1],img:f[2]}));
  const A=(off,title,start,end,cat)=>({id:'a'+(id++),date:ymd(dayStart(Date.now()).getTime()+off*864e5+432e5),title,start,end,cat,done:false});
  const agendas=[A(0,'Shift Malam','19.00','07.00','kerja'),A(0,'Upload Konten YouTube','20.00','','konten'),A(0,'Belajar Mandarin','21.00','22.00','belajar'),
    A(1,'Shift Pagi','07.00','19.00','kerja'),A(2,'Upload Shorts','20.00','','konten'),A(2,'Rapat Tim Produksi','21.30','','kerja'),A(3,'Belajar Produksi','19.30','21.00','belajar'),
    A(11,'Bayar Tagihan','10.00','','pribadi'),A(-8,'Kelas Online K3','19.00','20.30','belajar'),A(-5,'Servis Motor','09.00','','pribadi'),A(-3,'Evaluasi Target','20.00','','target')];
  return {notes,files,folders,agendas,storageBase:125.4e9-files.reduce((a,f)=>a+f.size,0),model:'Umum'};
}
function load(){try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}if(!S||!S.notes){S=seed()}migrate();save()}
function migrate(){S.chats=S.chats||[];S.ai=S.ai||{};if(S.chatCur===undefined)S.chatCur=null;AIX.init(S.ai,save)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('Penyimpanan penuh')}}

/* ---------- IndexedDB untuk isi berkas ---------- */
let dbp=null;
function db(){if(dbp)return dbp;dbp=new Promise((res,rej)=>{const r=indexedDB.open('cba_blobs',1);r.onupgradeneeded=()=>r.result.createObjectStore('b');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return dbp}
async function putBlob(k,b){const d=await db();return new Promise((res,rej)=>{const t=d.transaction('b','readwrite');t.objectStore('b').put(b,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function getBlob(k){const d=await db();return new Promise(res=>{const r=d.transaction('b').objectStore('b').get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)})}
async function delBlob(k){const d=await db();d.transaction('b','readwrite').objectStore('b').delete(k)}

/* ---------- util UI ---------- */
let tt;function toast(m){const t=$('#toast');t.style.pointerEvents='none';t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2200)}
function toastAct(m,label,fn){const t=$('#toast');t.innerHTML=esc(m)+' <button style="color:#8ec0ff;font-weight:700;margin-left:1.4rem">'+esc(label)+'</button>';t.style.pointerEvents='auto';t.querySelector('button').onclick=()=>{t.classList.remove('on');fn()};t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>{t.classList.remove('on');t.style.pointerEvents='none'},5000)}
const stack=[]; // tumpukan overlay untuk tombol kembali
function sheet(html,onMount){$('#sheet').innerHTML='<div class="grab"></div>'+html;$('#sheetbg').classList.add('on');stack.push('sheet');onMount&&onMount($('#sheet'))}
function closeSheet(){$('#sheetbg').classList.remove('on');const i=stack.lastIndexOf('sheet');if(i>=0)stack.splice(i,1)}
$('#sheetbg').addEventListener('click',e=>{if(e.target.id==='sheetbg')closeSheet()});
function menu(title,opts){sheet(`<h3>${esc(title)}</h3>`+opts.map((o,i)=>`<button class="opt ${o.red?'red':''}" data-i="${i}">${ic(o.icon)}${esc(o.label)}</button>`).join(''),el=>{
  el.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{closeSheet();opts[+b.dataset.i].fn()})})}
function ask(title,fields,onOk,okLabel){
  sheet(`<h3>${esc(title)}</h3><form id="askf">${fields.map(f=>`<label class="fld"><span>${esc(f.label)}</span>${f.type==='select'?`<select name="${f.name}">${f.options.map(o=>`<option value="${esc(o[0])}" ${o[0]===f.value?'selected':''}>${esc(o[1])}</option>`).join('')}</select>`:f.type==='textarea'?`<textarea name="${f.name}" placeholder="${esc(f.ph||'')}">${esc(f.value||'')}</textarea>`:`<input name="${f.name}" type="${f.type||'text'}" value="${esc(f.value||'')}" placeholder="${esc(f.ph||'')}">`}</label>`).join('')}<button class="prim" type="submit">${esc(okLabel||'Simpan')}</button></form>`,el=>{
    const f=el.querySelector('#askf');const first=f.querySelector('input,textarea');if(first)setTimeout(()=>first.focus(),150);
    f.onsubmit=e=>{e.preventDefault();const v={};new FormData(f).forEach((x,k)=>v[k]=String(x).trim());if(onOk(v)!==false)closeSheet()}})}
function confirmBox(msg,label,fn){sheet(`<h3>${esc(msg)}</h3><button class="prim" id="cfy" style="background:linear-gradient(180deg,#ef5a6f,#d63a4f)">${esc(label)}</button><button class="prim" id="cfn" style="background:#eef1f6;color:#141b36">Batal</button>`,el=>{el.querySelector('#cfy').onclick=()=>{closeSheet();fn()};el.querySelector('#cfn').onclick=closeSheet})}

/* ---------- navigasi ---------- */
let cur='dashboard',prevTab='dashboard';
const TABS=[['dashboard','Dashboard','house','nav-house-on'],['catatan','Catatan','file-text','nav-file-on'],['berkas','Berkas','folder','nav-folder-on'],['ai','AI','nav-ai','nav-ai-on'],['kalender','Kalender','calendar','nav-cal-on']];
function renderNav(){const t=cur==='editor'?'catatan':cur;const idx=TABS.findIndex(x=>x[0]===t);
  const nav=$('#nav');
  if(!nav.querySelector('.ind')){nav.innerHTML='<span class="ind"></span>'+TABS.map(x=>`<button data-v="${x[0]}"><span class="ico"></span><span class="lb">${x[1]}</span></button>`).join('');
    nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.v!==(cur==='editor'?'catatan':cur)||cur==='editor')go(b.dataset.v);else window.scrollTo({top:0,behavior:'smooth'})})}
  nav.querySelectorAll('button').forEach((b,i)=>{const on=i===idx;if(b.classList.contains('on')!==on||!b.firstChild.innerHTML){b.classList.toggle('on',on);b.firstChild.innerHTML=ic(on?TABS[i][3]:TABS[i][2])}});
  nav.style.setProperty('--i',idx)}
const ORDERV={dashboard:0,catatan:1,editor:1.5,berkas:2,ai:3,kalender:4};
function go(v){const from=cur;if(cur==='editor'&&v!=='editor')leaveEditor();if(v!=='editor')prevTab=v;cur=v;
  const dir=(ORDERV[v]||0)>=(ORDERV[from]||0)?1:-1;
  document.querySelectorAll('.view').forEach(s=>{const on=s.id===v;s.classList.toggle('on',on);if(!on)s.classList.remove('in')});
  R[v]&&R[v]();renderNav();window.scrollTo(0,0);
  const el=document.getElementById(v);if(from!==v&&booted){el.style.setProperty('--dx',(v==='editor'?8:dir*7)+'%');el.classList.remove('in');void el.offsetWidth;el.classList.add('in')}}
let booted=false;
window.appBack=function(){
  if($('#viewer').classList.contains('on')){closeViewer();return true}
  if(stack.length){const t=stack[stack.length-1];if(t==='sheet')closeSheet();else if(t==='srch')closeSearch();else if(t==='side')closeSidebar();return true}
  if(cur==='ai'&&curChat()&&curChat().msgs.length){S.chatCur=null;save();R.ai();window.scrollTo(0,0);return true}
  if(cur==='editor'){if(EV.mode==='edit'){setEdMode('read');return true}go(EV.from||'catatan');return true}
  if(cur!=='dashboard'){go('dashboard');return true}
  return false};
document.addEventListener('keydown',e=>{if(e.key==='Escape')window.appBack()});

/* ---------- header bersama ---------- */
const hdrMain=()=>`<div class="hdr"><img class="logo" src="img/logo_dash.png" alt=""><div><div class="t1">CatatanByAdriy</div><div class="t2">Catat • Kelola • Simpan • Akses Kapan Saja</div></div><div class="sp"></div><button class="profile"><img class="avatar" src="img/avatar.png" alt="Profil"></button></div>`;
function bindProfile(root){root.querySelector('.profile').onclick=()=>menu('Profil',[{icon:'download',label:'Cadangkan data (unduh)',fn:backup},{icon:'upload',label:'Pulihkan data dari cadangan',fn:restore},{icon:'trash-2',label:'Atur ulang ke data contoh',red:true,fn:()=>confirmBox('Hapus semua data dan kembali ke data contoh?','Atur ulang',()=>{S=seed();migrate();save();go(cur)})}])}

/* ---------- catatan helpers ---------- */
const liveNotes=()=>S.notes.filter(n=>!n.trashed);
const noteDate=n=>n.updated;
function notesBy(f){let a=S.notes.filter(n=>{if(f==='sampah')return n.trashed;if(n.trashed)return false;if(f==='arsip')return n.archived;if(n.archived)return false;
  if(f==='penting')return n.star;if(f==='favorit')return n.fav;if(f==='draft')return n.draft;return true});return a}
function sortNotes(a){return a.sort(S.sortOld?(x,y)=>x.updated-y.updated:(x,y)=>y.updated-x.updated)}
function newNote(){const n={id:'n'+Date.now(),title:'',sub:'',tag:'kerja',body:'',updated:Date.now(),opened:Date.now(),labels:[],star:false,fav:false,archived:false,trashed:false,pinned:false,draft:false};
  S.notes.push(n);save();openNote(n.id,true)}
function noteMenu(n,after,inEd){
  const mdItems=inEd?[{icon:'code',label:'Edit sebagai Markdown',fn:()=>mdSource(n)},{icon:'copy',label:'Salin sebagai Markdown',fn:()=>copyText(MD.toMd(n.body))},{icon:'file-down',label:'Ekspor ke file .md',fn:()=>exportMd(n)}]:[];
  menu(n.title||'Tanpa judul',mdItems.concat([
    {icon:'pin',label:n.pinned?'Lepas sematan':'Sematkan',fn:()=>{S.notes.forEach(x=>{if(x!==n&&!n.pinned)x.pinned=false});n.pinned=!n.pinned;save();after()}},
    {icon:'bookmark',label:n.fav?'Hapus dari Favorit':'Tambah ke Favorit',fn:()=>{n.fav=!n.fav;save();after()}},
    {icon:'type',label:'Ubah kategori',fn:()=>ask('Kategori',[{name:'tag',label:'Kategori',type:'select',value:n.tag,options:Object.entries(TAGN)}],v=>{n.tag=v.tag;save();after()})},
    n.trashed?{icon:'undo-2',label:'Pulihkan',fn:()=>{n.trashed=false;save();after()}}:{icon:'archive',label:n.archived?'Keluarkan dari Arsip':'Arsipkan',fn:()=>{n.archived=!n.archived;save();after()}},
    n.trashed?{icon:'trash-2',label:'Hapus permanen',red:true,fn:()=>confirmBox('Hapus catatan ini selamanya?','Hapus',()=>{S.notes=S.notes.filter(x=>x!==n);save();after()})}
             :{icon:'trash-2',label:'Pindahkan ke Sampah',red:true,fn:()=>confirmBox('Pindahkan "'+(n.title||'Tanpa judul')+'" ke Sampah?','Ya, hapus',()=>{n.trashed=true;n.pinned=false;save();after();toastAct('Dipindahkan ke Sampah','Batalkan',()=>{n.trashed=false;save();go(cur)})})}
  ]))}
function copyText(t){const done=()=>toast('Disalin');if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,()=>fallbackCopy(t));else fallbackCopy(t)}
function fallbackCopy(t){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');toast('Disalin')}catch(e){toast('Gagal menyalin')}a.remove()}
function exportMd(n){const md='# '+(n.title||'Tanpa judul')+'\n\n'+MD.toMd(n.body)+'\n';const name=(n.title||'catatan').replace(/[\\/:*?"<>|]+/g,'-')+'.md';
  if(window.Android&&Android.saveFile)Android.saveFile(name,'text/markdown',btoa(unescape(encodeURIComponent(md))));else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([md],{type:'text/markdown'}));a.download=name;a.click()}}

/* ================= DASHBOARD ================= */
const R={};
R.dashboard=function(){
  const el=$('#dashboard');
  const rec=liveNotes().filter(n=>!n.archived).sort((a,b)=>b.opened-a.opened).slice(0,3);
  const today=ymd(Date.now()),now=new Date();
  const upcoming=S.agendas.filter(a=>!a.done&&a.date>today).length;
  const urgent=S.agendas.filter(a=>{if(a.done||a.date!==today)return false;const [h,m]=a.start.split('.').map(Number);const t=new Date();t.setHours(h,m,0,0);const d=(t-now)/6e4;return d>=0&&d<=60});
  el.innerHTML=hdrMain()+`
  <div class="banner"><img src="img/banner_dash.png" alt="Selamat Datang, Adriy!"></div>
  <div class="qa">
    <button id="qNew"><img src="img/qa_note.png" alt=""><span>Catatan Baru</span></button>
    <button id="qUp"><img src="img/qa_upload.png" alt=""><span>Unggah Berkas</span></button>
    <button id="qAi"><img src="img/qa_ai.png" alt=""><span>Mulai AI</span></button>
    <button id="qCal"><img src="img/qa_cal.png" alt=""><span>Lihat Kalender</span></button>
    <button id="qMore"><img src="img/qa_more.png" alt=""><span>Lainnya</span></button>
  </div>
  <div class="row2">
    <div class="card ring"><h3>${ic('bars','bars')}Ringkasan Saya</h3><div class="in">
      <button class="r" data-go="catatan">${ic('sticky-note','ico')}Catatan<b>${liveNotes().length}</b>${ic('chevron-right','chev')}</button>
      <button class="r" data-go="berkas">${ic('folder','ico')}Berkas<b>${S.files.length}</b>${ic('chevron-right','chev')}</button>
      <button class="r" data-go="kalender">${ic('calendar-days','ico')}Agenda<b>${upcoming}</b>${ic('chevron-right','chev')}</button>
      <button class="r" data-go="draft">${ic('star','ico')}Ide &amp; Draft<b>${notesBy('draft').length}</b>${ic('chevron-right','chev')}</button>
    </div></div>
    <div class="recent"><h3>${ic('file-text')}Catatan Terakhir</h3><div class="in">
      ${rec.map(n=>`<div class="it" data-id="${n.id}"><img src="img/doc_tile.png" alt=""><div class="tx"><div class="a">${esc(n.title||'Tanpa judul')}</div><div class="b">${rel(n.opened)}</div></div><button class="m" data-m="${n.id}">${ic('ellipsis-vertical')}</button></div>`).join('')||'<div class="empty" style="padding:4rem 0">Belum ada catatan</div>'}
      <button class="all" id="allNotes">Lihat Semua Catatan ${ic('chevron-right')}</button>
    </div></div>
  </div>
  <div class="agcard"><img class="ill" src="img/agenda_illu.png" alt=""><div class="hd">${ic('calendar')}<div><h3>Agenda Hari Ini</h3>
    <p>${urgent.length?esc(urgent[0].title)+' • '+urgent[0].start:'Tidak ada agenda yang mendesak.'}</p></div></div>
    <button class="add" id="dAddAg">${ic('plus')}Tambah Agenda</button></div>`;
  bindProfile(el);
  el.querySelector('#qNew').onclick=newNote;
  el.querySelector('#qUp').onclick=()=>pickFiles(null);
  el.querySelector('#qAi').onclick=()=>go('ai');
  el.querySelector('#qCal').onclick=()=>go('kalender');
  el.querySelector('#qMore').onclick=()=>menu('Lainnya',[{icon:'search',label:'Cari',fn:openSearch},{icon:'star',label:'Catatan Penting',fn:()=>{noteFilter='penting';go('catatan')}},{icon:'archive',label:'Arsip',fn:()=>{noteFilter='arsip';go('catatan')}},{icon:'trash-2',label:'Sampah',fn:()=>{noteFilter='sampah';go('catatan')}},{icon:'download',label:'Cadangkan data',fn:backup},{icon:'upload',label:'Pulihkan data',fn:restore}]);
  el.querySelectorAll('.r').forEach(b=>b.onclick=()=>{const g=b.dataset.go;if(g==='draft'){noteFilter='draft';go('catatan')}else{if(g==='catatan')noteFilter='semua';go(g)}});
  el.querySelectorAll('.it').forEach(b=>b.onclick=e=>{if(e.target.closest('.m'))return;openNote(b.dataset.id)});
  el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const n=S.notes.find(x=>x.id===b.dataset.m);noteMenu(n,R.dashboard)});
  el.querySelector('#allNotes').onclick=()=>{noteFilter='semua';go('catatan')};
  el.querySelector('#dAddAg').onclick=()=>addAgenda(ymd(Date.now()),R.dashboard);
};

/* ================= CATATAN ================= */
let noteFilter='semua';
R.catatan=function(){
  const el=$('#catatan');
  const F=[['semua','Semua','file-text'],['penting','Penting','star'],['favorit','Favorit','bookmark'],['arsip','Arsip','archive'],['sampah','Sampah','trash-2']];
  const all=sortNotes(notesBy(noteFilter));
  const pin=noteFilter==='semua'?S.notes.find(n=>n.pinned&&!n.trashed&&!n.archived):null;
  const list=all.filter(n=>n!==pin);
  const title=noteFilter==='draft'?'Ide & Draft':'Daftar Catatan';
  el.innerHTML=hdrMain()+`
  <div class="ctop"><img src="img/hdr_catatan.png" alt=""><div><h1>Catatan Saya</h1><p>Kelola semua catatanmu di sini.</p></div><div class="sp"></div>
    <button class="sqbtn" id="nSearch">${ic('search')}</button><button class="sqbtn" id="nFilter">${ic('sliders-horizontal')}</button><button class="sqbtn" id="nGrid">${ic('layout-grid')}</button></div>
  <div class="chips" id="chipsNote">${F.map(f=>`<button class="chip ${noteFilter===f[0]?'on':''}" data-f="${f[0]}">${ic(f[2])}${f[1]}</button>`).join('')}</div>
  ${pin?`<button class="pin" id="pinCard"><img class="ill" src="img/pin_illu.png" alt=""><span class="badge">${ic('star-fill')}Disematkan</span><span class="more" id="pinMore">${ic('ellipsis-vertical')}</span>
    <div class="row"><img class="doc" src="img/pin_doc.png" alt=""><div class="tt"><h2>${esc(pin.title)}</h2><div class="s">${esc(pin.sub)}</div><div class="d">${ic('calendar')}Diperbarui: ${rel(pin.updated)}</div></div></div></button>`:''}
  <div class="lhead"><h2>${title} <span>(${all.length})</span></h2><button class="sort" id="nSort">${ic('arrow-up-down')}${S.sortOld?'Terlama di Atas':'Terbaru di Atas'}${ic('chevron-down')}</button></div>
  <div class="nlist">${list.map(n=>`<div class="nrow" data-id="${n.id}"><img class="tile" src="img/${TILE[n.tag]||'nt_blue'}.png" alt=""><div class="tx"><div class="a">${esc(n.title||'Tanpa judul')}</div><div class="b">${esc(n.sub||plain(n.body).slice(0,70))}</div>
    <div class="mt"><span class="dt">${ic('calendar')}${rel(n.updated)}</span><span class="tag t-${n.tag}">${TAGN[n.tag]||n.tag}</span></div></div>
    <button class="star ${n.star?'on':''}" data-s="${n.id}">${ic('star')}</button><button class="m" data-m="${n.id}">${ic('ellipsis-vertical')}</button></div>`).join('')||'<div class="empty">Belum ada catatan di sini.</div>'}</div>
  <button class="fab" id="nFab">${ic('plus')}</button>`;
  bindProfile(el);
  el.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{noteFilter=b.dataset.f;R.catatan()});
  el.querySelectorAll('.nrow').forEach(r=>r.onclick=e=>{if(e.target.closest('button'))return;openNote(r.dataset.id)});
  el.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{const n=S.notes.find(x=>x.id===b.dataset.s);n.star=!n.star;save();R.catatan()});
  el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>noteMenu(S.notes.find(x=>x.id===b.dataset.m),R.catatan));
  if(pin){el.querySelector('#pinCard').onclick=e=>{if(e.target.closest('#pinMore'))return noteMenu(pin,R.catatan);openNote(pin.id)}}
  el.querySelector('#nFab').onclick=newNote;
  el.querySelector('#nSearch').onclick=openSearch;
  el.querySelector('#nSort').onclick=()=>{S.sortOld=!S.sortOld;save();R.catatan()};
  el.querySelector('#nFilter').onclick=()=>menu('Saring kategori',[{icon:'file-text',label:'Semua kategori',fn:()=>{noteFilter='semua';R.catatan()}},{icon:'pen-line',label:'Ide & Draft',fn:()=>{noteFilter='draft';R.catatan()}}].concat(Object.entries(TAGN).map(([k,v])=>({icon:'type',label:v,fn:()=>showTag(k)}))));
  el.querySelector('#nGrid').onclick=()=>toast('Tampilan daftar');
};
function showTag(k){openSearch();$('#srchIn').value='';renderSearch(TAGN[k],n=>n.tag===k)}
const plain=h=>{const d=document.createElement('div');d.innerHTML=h||'';return (d.textContent||'').replace(/\s+/g,' ').trim()};

/* ================= EDITOR ================= */
// Mode baca otomatis saat catatan dibuka; toolbar format hanya muncul di mode edit.
const EV={id:null,mode:'read',from:'catatan',timer:null};
function openNote(id,isNew){const n=S.notes.find(x=>x.id===id);if(!n)return;EV.from=cur==='editor'?EV.from:cur;n.opened=Date.now();save();EV.id=id;EV.mode=isNew?'edit':'read';go('editor');if(isNew)setEdMode('edit',true)}
function edNote(){return S.notes.find(x=>x.id===EV.id)}
R.editor=function(){
  const n=edNote(),el=$('#editor');if(!n)return go('catatan');
  el.innerHTML=`
  <div class="ehdr"><button class="back" id="eBack">${ic('arrow-left')}</button><img class="logo" src="img/logo_ed.png" alt=""><div style="min-width:0"><div class="t1">CatatanByAdriy</div><div class="t2">Editor Catatan</div></div><div class="sp"></div>
    <button class="circ" data-c="more">${ic('ellipsis-vertical')}</button></div>
  <div class="abar roonly"><button class="aibtn" data-c="ai">${ic('sparkle-ai')}Rapikan dengan AI</button><button class="obtn" data-c="pdf">${ic('pdf')}Ekspor PDF</button><button class="obtn" data-c="edit">${ic('pencil')}Edit</button></div>
  <div class="abar edonly"><div class="hgrp"><button data-c="undo">${ic('undo-2')}</button><button data-c="redo">${ic('redo-2')}</button></div><button class="spill ai" data-c="ai">${ic('sparkle-ai')}Rapikan AI</button><button class="spill" data-c="pdf">${ic('pdf')}Ekspor</button><button class="spill done" data-c="read">${ic('book-open')}Mode Baca</button></div>
  <div class="ecard">
    <div class="etitle"><h1 id="eTitle" data-ph="Judul catatan">${esc(n.title)}</h1><button class="st ${n.star?'on':''}" data-c="star">${ic('star')}</button></div>
    <div class="etags" id="eTags"></div>
    <div class="emeta"><span>${ic('calendar')}<em id="eEdited" style="font-style:normal">Terakhir diedit: ${rel(n.updated)}</em></span><span class="saved" id="eSaved">${ic('cloud-check')}<b style="font-weight:500">Tersimpan otomatis</b></span><span class="wc" id="eWc"></span></div>
    <div class="body" id="eBody"></div>
  </div>
  <div class="ftb edonly" id="eFtb"><button data-c="block" class="ddl">Teks ${ic('chevron-down')}</button><span class="sep"></span>
    <button data-c="bold" class="bold">B</button><button data-c="italic">${ic('italic')}</button><button data-c="underline">${ic('underline')}</button><button data-c="strikeThrough" class="strike">S</button><button data-c="color" class="col">A<i></i></button><span class="sep"></span>
    <button data-c="insertUnorderedList">${ic('list')}</button><button data-c="insertOrderedList">${ic('list-ordered')}</button><button data-c="check">${ic('square-check')}</button><span class="sep"></span>
    <button data-c="quote">${ic('quote')}</button><button data-c="code">${ic('code')}</button><button data-c="link">${ic('link')}</button><button data-c="image">${ic('image')}</button><button data-c="table">${ic('table')}</button><button data-c="hr">${ic('minus')}</button><span class="sep"></span><button data-c="mdsrc" class="mdb">MD</button></div>`;
  const body=el.querySelector('#eBody'),title=el.querySelector('#eTitle');
  body.addEventListener('input',dirty);title.addEventListener('input',dirty);
  title.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();body.focus()}});
  body.addEventListener('change',e=>{if(e.target.type!=='checkbox')return;e.target.toggleAttribute('checked',e.target.checked);
    if(EV.mode==='edit')dirty();else toggleStoredCheck(e.target)});
  body.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&EV.mode==='edit')e.preventDefault()});
  el.querySelectorAll('[data-c]').forEach(b=>{b.addEventListener('mousedown',e=>e.preventDefault());b.onclick=()=>edCmd(b.dataset.c)});
  el.querySelector('#eBack').onclick=()=>window.appBack();
  setEdMode(EV.mode);
};
function toggleStoredCheck(cb){const n=edNote(),all=[...$('#eBody').querySelectorAll('input[type=checkbox]')],i=all.indexOf(cb);
  const t=document.createElement('template');t.innerHTML=n.body;const st=[...t.content.querySelectorAll('input[type=checkbox]')][i];
  if(st){st.toggleAttribute('checked',cb.checked);n.body=t.innerHTML;touch()}}
function renderTags(){const n=edNote();const t=$('#eTags');const ed=EV.mode==='edit';
  t.innerHTML=n.labels.map((l,i)=>`<span class="etag">${ic('folder')}${esc(l)}${ed?`<button class="x" data-x="${i}">${ic('x-small','','stroke-width:2.6')}</button>`:''}</span>`).join('')+(ed?`<button class="etag add" id="eAddTag">${ic('plus')}Tambah Tag</button>`:'');
  t.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{n.labels.splice(+b.dataset.x,1);touch();renderTags()});
  const a=t.querySelector('#eAddTag');if(a)a.onclick=()=>ask('Tambah Tag',[{name:'t',label:'Nama tag',ph:'mis. Produksi'}],v=>{if(v.t){n.labels.push(v.t);touch();renderTags()}})}
function showBody(){const n=edNote(),b=$('#eBody');if(!b)return;b.innerHTML=n.body;if(EV.mode==='read')MD.diagrams(b);updWc()}
function setEdMode(m,focus){if(EV.mode==='edit'&&m==='read'&&EV.timer){clearTimeout(EV.timer);flush()}
  EV.mode=m;const el=$('#editor'),ed=m==='edit';el.classList.toggle('edit',ed);document.body.classList.toggle('edit',ed);
  const b=$('#eBody'),t=$('#eTitle');if(!b)return;
  b.contentEditable=ed?'true':'false';t.contentEditable=ed?'true':'false';
  showBody();renderTags();
  if(ed&&focus)setTimeout(()=>{(t.textContent?b:t).focus();if(t.textContent){const r=document.createRange();r.selectNodeContents(b);r.collapse(false);const s=getSelection();s.removeAllRanges();s.addRange(r)}},60);
  if(!ed&&document.activeElement&&document.activeElement.blur)document.activeElement.blur()}
function dirty(){const s=$('#eSaved');if(s)s.lastChild.textContent='Menyimpan...';clearTimeout(EV.timer);EV.timer=setTimeout(flush,500);updWc()}
function flush(){EV.timer=null;const n=edNote();if(!n||!$('#eBody')||EV.mode!=='edit')return;n.title=$('#eTitle').textContent.trim();n.body=$('#eBody').innerHTML;if(!n.sub||n.autoSub){n.sub=plain(n.body).slice(0,70);n.autoSub=true}touch()}
function touch(){const n=edNote();n.updated=Date.now();save();const e=$('#eEdited');if(e)e.textContent='Terakhir diedit: '+rel(n.updated);const s=$('#eSaved');if(s)s.lastChild.textContent='Tersimpan otomatis'}
function leaveEditor(){if(EV.timer){clearTimeout(EV.timer);flush()}const n=edNote();if(n&&!n.title&&!plain(n.body)){S.notes=S.notes.filter(x=>x!==n);save()}EV.mode='read';$('#editor').classList.remove('edit');document.body.classList.remove('edit')}
function updWc(){const t=plain((($('#eTitle')||{}).textContent||'')+' '+(($('#eBody')||{}).innerHTML||''));const w=t?t.split(' ').length:0;const f=x=>x.toLocaleString('id-ID');const e=$('#eWc');if(e)e.innerHTML=`${f(w)} kata<i></i>${f(t.length)} karakter`}
function saveRange(){const s=getSelection();EV.range=s.rangeCount&&$('#eBody').contains(s.anchorNode)?s.getRangeAt(0).cloneRange():null}
function restoreRange(){const b=$('#eBody');b.focus();if(EV.range){const s=getSelection();s.removeAllRanges();s.addRange(EV.range)}}
function edCmd(c){const n=edNote(),body=$('#eBody');
  const ex=(a,v)=>{restoreRange();document.execCommand(a,false,v);dirty()};
  const later=fn=>{saveRange();fn()};
  switch(c){
    case 'bold':case 'italic':case 'underline':case 'strikeThrough':case 'insertUnorderedList':case 'insertOrderedList':case 'undo':case 'redo':saveRange();ex(c);break;
    case 'hr':saveRange();ex('insertHorizontalRule');break;
    case 'color':later(()=>menu('Warna teks',[['#141a33','Hitam'],['#1a66e6','Biru'],['#d63a4f','Merah'],['#1d7f4c','Hijau']].map(x=>({icon:'type',label:x[1],fn:()=>ex('foreColor',x[0])})).concat([{icon:'pen-line',label:'Stabilo kuning',fn:()=>ex('hiliteColor','#fef08a')}])));break;
    case 'block':later(()=>menu('Gaya teks',[['P','Teks biasa'],['H1','Judul 1'],['H2','Judul 2'],['H3','Judul 3'],['BLOCKQUOTE','Kutipan']].map(x=>({icon:'type',label:x[1],fn:()=>ex('formatBlock',x[0])})).concat([{icon:'list-ordered',label:'Langkah bernomor',fn:()=>ex('insertHTML','<ol class="steps"><li><b>Judul langkah</b><span>Keterangan langkah</span></li></ol><p><br></p>')}])));break;
    case 'quote':saveRange();ex('formatBlock','BLOCKQUOTE');break;
    case 'code':{saveRange();const sel=getSelection().toString();ex('insertHTML',sel&&!sel.includes('\n')?'<code>'+esc(sel)+'</code>&nbsp;':'<pre><code>'+esc(sel||'kode')+'</code></pre><p><br></p>');break}
    case 'check':saveRange();ex('insertHTML','<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" class="task-list-item-checkbox"> Tugas baru</li></ul><p><br></p>');break;
    case 'table':saveRange();ex('insertHTML','<div class="tbl"><table><thead><tr><th>Kolom 1</th><th>Kolom 2</th><th>Kolom 3</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table></div><p><br></p>');break;
    case 'link':later(()=>{const txt=getSelection().toString();ask('Sisipkan tautan',[{name:'u',label:'Alamat tautan',ph:'https://',type:'url'},{name:'t',label:'Teks (opsional)',value:txt}],v=>{if(!v.u)return;const u=/^[a-z]+:/i.test(v.u)?v.u:'https://'+v.u;ex('insertHTML',`<a href="${esc(u)}">${esc(v.t||u)}</a>`)},'Sisipkan')});break;
    case 'image':saveRange();$('#imgPick').click();break;
    case 'mdsrc':mdSource(n);break;
    case 'star':n.star=!n.star;save();document.querySelector('#editor .st').classList.toggle('on',n.star);break;
    case 'read':setEdMode('read');break;
    case 'edit':setEdMode('edit',true);break;
    case 'pdf':exportPdf(n);break;
    case 'ai':aiTidy();break;
    case 'more':noteMenu(n,()=>{if(!S.notes.includes(n)||n.trashed)go(EV.from||'catatan');else R.editor()},true);break;
  }}
$('#imgPick').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();r.onload=()=>{restoreRange();document.execCommand('insertHTML',false,`<img src="${r.result}">`);dirty()};r.readAsDataURL(f)};
function mdSource(n){if(EV.timer){clearTimeout(EV.timer);flush()}
  const src=MD.toMd(n.body);
  sheet(`<h3>Edit sebagai Markdown</h3><p class="note">Tulis atau tempel Markdown di sini (judul #, daftar -, tabel |, [ ] tugas, \`\`\`kode\`\`\`, $rumus$, \`\`\`mermaid, > [!NOTE], ::: info, ==stabilo==, catatan kaki [^1], dll).</p><form id="mdf"><label class="fld"><textarea class="code" name="md" spellcheck="false">${esc(src)}</textarea></label><button class="prim" type="submit">Simpan</button></form>`,el=>{
    el.querySelector('#mdf').onsubmit=e=>{e.preventDefault();n.body=MD.render(e.target.md.value);n.autoSub=true;n.sub=plain(n.body).slice(0,70);touch();closeSheet();showBody();toast('Markdown disimpan')}})}
function aiTidy(){ // merapikan dengan Markdown: HTML → Markdown → dirapikan → ditampilkan ulang (tanpa server)
  const n=edNote();if(!n)return;if(EV.timer){clearTimeout(EV.timer);flush()}
  if(EV.mode==='edit'){n.body=$('#eBody').innerHTML}
  const before=n.body;n.body=MD.tidy(before);
  const t=($('#eTitle').textContent||'').trim().replace(/\s+/g,' ');if(t){n.title=t[0].toUpperCase()+t.slice(1);$('#eTitle').textContent=n.title}
  n.autoSub=true;n.sub=plain(n.body).slice(0,70);touch();showBody();
  EV.undoTidy=before;toastAct('Catatan dirapikan dengan Markdown','Batalkan',()=>{n.body=EV.undoTidy;touch();showBody()})}
function exportPdf(n){if(EV.timer){clearTimeout(EV.timer);flush()}
  const css=[...document.styleSheets].map(s=>{try{return [...s.cssRules].map(r=>r.cssText).join('\n')}catch(e){return ''}}).join('\n');
  const html=`<!doctype html><html><head><meta charset="utf-8"><base href="${location.href.replace(/[^/]*$/,'')}"><style>${css}\nhtml{font-size:7px}body{background:#fff!important;padding:24px;max-width:none}.body{padding:0;min-height:0}h1.tt{font-family:Jakarta,Inter;font-size:30px;margin:0 0 4px;color:#0b1130}.meta{color:#666;font-size:12px;margin-bottom:18px}</style></head><body><h1 class="tt">${esc(n.title||'Tanpa judul')}</h1><div class="meta">CatatanByAdriy • ${rel(n.updated)}</div><div class="body">${$('#eBody')?$('#eBody').innerHTML:n.body}</div></body></html>`;
  if(window.Android&&Android.printHtml){Android.printHtml(n.title||'Catatan',html)}else{const w=window.open('');if(w){w.document.write(html);w.document.close();w.print()}}}

/* ================= BERKAS ================= */
let fileFilter='semua',fileFolder=null,fileGrid=false;
const FICON={pdf:'fi_pdf',doc:'fi_doc',music:'fi_music'};
const typeOf=(name,mime)=>{const e=(name.split('.').pop()||'').toLowerCase();mime=mime||'';
  if(e==='pdf')return 'pdf';if(['doc','docx','odt','rtf','xls','xlsx','ppt','pptx','txt','csv'].includes(e))return e==='txt'||e==='csv'?'other':'doc';
  if(mime.startsWith('image/'))return 'image';if(mime.startsWith('video/'))return 'video';if(mime.startsWith('audio/'))return 'music';
  if(['zip','rar','7z','tar','gz'].includes(e))return 'zip';return 'other'};
function fileIcon(f){if(f.thumb)return `<img src="${f.thumb}" alt="">`;if(FICON[f.type])return `<img class="sm" src="img/${FICON[f.type]}.png" alt="">`;
  const m={image:['image','#3b82f6','#e0edff'],video:['video','#e8457a','#fde3ea'],zip:['file-archive','#f59e0b','#fff1db'],other:['file','#5b6380','#eef1f6']}[f.type]||['file','#5b6380','#eef1f6'];
  return `<span style="width:7rem;height:7rem;border-radius:1.6rem;background:${m[2]};color:${m[1]};display:flex;align-items:center;justify-content:center;font-size:4rem" data-thumb="${f.id}">${ic(m[0])}</span>`}
R.berkas=function(){
  const el=$('#berkas');
  const C=[['semua','Semua','layout-grid'],['file','File','file-text'],['image','Gambar','image'],['video','Video','circle-play'],['music','Musik','music'],['zip','ZIP','file-text'],['other','Lain-lain','ellipsis-vertical']];
  let fs=S.files.filter(f=>fileFilter==='semua'||(fileFilter==='file'?(f.type==='pdf'||f.type==='doc'):f.type===fileFilter));
  if(fileFolder)fs=fs.filter(f=>f.folder===fileFolder);
  fs.sort(S.fileOld?(a,b)=>a.ts-b.ts:(a,b)=>b.ts-a.ts);
  const used=S.storageBase+S.files.reduce((a,f)=>a+f.size,0);
  el.innerHTML=`<div class="hdr2"><img class="logo" src="img/logo_ber.png" alt=""><div><div class="t1">CatatanByAdriy</div><div class="t2">Berkas</div></div><div class="sp"></div>
    <button class="sqbtn" id="bSearch">${ic('search')}</button><button class="sqbtn" id="bFilt">${ic('sliders-horizontal')}</button><button class="sqbtn" id="bMore">${ic('ellipsis-vertical')}</button></div>
  <div class="chips" id="chipsFile">${C.map(c=>`<button class="chip ${fileFilter===c[0]?'on':''}" data-f="${c[0]}">${c[0]==='semua'?ic('layout-grid','','fill:currentColor;stroke-width:0'):c[0]==='other'?'<b style="font-size:2.6rem;letter-spacing:.1rem;margin-top:-1.2rem">•••</b>':ic(c[2])}${c[1]}</button>`).join('')}</div>
  <div class="stor"><img class="ill" src="img/store_illu.png" alt=""><img class="db" src="img/db.png" alt=""><h3>Penyimpanan</h3><p>${fmtSize(used)} dari ∞ (Tanpa Batas)</p><div class="bar"><i style="width:${Math.min(100,used/190e9*100).toFixed(1)}%"></i></div></div>
  <div class="sechd"><h2>Folder Saya <span>(${S.folders.length})</span></h2><button class="link" id="fAll">Lihat Semua ${ic('chevron-right')}</button></div>
  <div class="fgrid">${S.folders.slice(0,6).map((f,i)=>`<div class="fold ${fileFolder===f.name?'on':''}" data-i="${i}"><img src="img/${f.img||'f_arch'}.png" alt=""><div><div class="a">${esc(f.name)}</div><div class="b">${f.count} berkas</div></div><button class="m" data-fm="${i}">${ic('ellipsis-vertical')}</button></div>`).join('')}</div>
  <div class="sechd"><h2>${fileFolder?esc(fileFolder):'Berkas Terbaru'}</h2><div class="fl2"><button class="sort" id="fSort">${ic('arrow-up-down')}${S.fileOld?'Terlama di Atas':'Terbaru di Atas'}${ic('chevron-down')}</button>
    <div class="vt"><button class="${fileGrid?'':'on'}" id="vList">${ic('list')}</button><button class="${fileGrid?'on':''}" id="vGrid">${ic('layout-grid')}</button></div></div></div>
  <div class="flist ${fileGrid?'grid':''}">${fs.map(f=>`<div class="frow" data-id="${f.id}"><div class="ic">${fileIcon(f)}</div><div class="tx"><div class="a">${esc(f.name)}</div><div class="b">${fmtSize(f.size)}&nbsp; • &nbsp;${rel(f.ts)}</div></div><button class="m" data-m="${f.id}">${ic('ellipsis-vertical')}</button></div>`).join('')||'<div class="empty">Belum ada berkas.</div>'}</div>
  <button class="fab" id="fab2">${ic('plus')}</button>`;
  el.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{fileFilter=b.dataset.f;R.berkas()});
  el.querySelectorAll('.fold').forEach(b=>b.onclick=e=>{if(e.target.closest('.m'))return;const n=S.folders[+b.dataset.i].name;fileFolder=fileFolder===n?null:n;R.berkas()});
  el.querySelectorAll('[data-fm]').forEach(b=>b.onclick=()=>folderMenu(+b.dataset.fm));
  el.querySelectorAll('.frow').forEach(r=>r.onclick=e=>{if(e.target.closest('.m'))return;openFile(r.dataset.id)});
  el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>fileMenu(b.dataset.m));
  el.querySelector('#fab2').onclick=()=>pickFiles(fileFolder);
  el.querySelector('#bSearch').onclick=openSearch;
  el.querySelector('#bFilt').onclick=()=>menu('Saring folder',[{icon:'layout-grid',label:'Semua folder',fn:()=>{fileFolder=null;R.berkas()}}].concat(S.folders.map(f=>({icon:'folder',label:f.name,fn:()=>{fileFolder=f.name;R.berkas()}}))));
  el.querySelector('#bMore').onclick=()=>menu('Berkas',[{icon:'upload',label:'Unggah berkas',fn:()=>pickFiles(fileFolder)},{icon:'folder-input',label:'Folder baru',fn:newFolder}]);
  el.querySelector('#fAll').onclick=()=>menu('Folder Saya',S.folders.map((f,i)=>({icon:'folder',label:f.name+' ('+f.count+')',fn:()=>{fileFolder=f.name;R.berkas()}})).concat([{icon:'plus',label:'Folder baru',fn:newFolder}]));
  el.querySelector('#fSort').onclick=()=>{S.fileOld=!S.fileOld;save();R.berkas()};
  el.querySelector('#vList').onclick=()=>{fileGrid=false;R.berkas()};el.querySelector('#vGrid').onclick=()=>{fileGrid=true;R.berkas()};
  // gambar unggahan: tampilkan pratinjau asli
  el.querySelectorAll('[data-thumb]').forEach(async sp=>{const f=S.files.find(x=>x.id===sp.dataset.thumb);if(!f||f.type!=='image')return;const b=await getBlob(f.id);if(b){const u=URL.createObjectURL(b);sp.outerHTML=`<img src="${u}" alt="" style="width:11.3rem;height:7.1rem;object-fit:cover;border-radius:1rem">`}});
};
function newFolder(){ask('Folder baru',[{name:'n',label:'Nama folder'}],v=>{if(!v.n)return false;if(S.folders.some(f=>f.name===v.n)){toast('Nama folder sudah ada');return false}S.folders.push({name:v.n,count:0,img:'f_arch'});save();R.berkas()})}
function folderMenu(i){const f=S.folders[i];menu(f.name,[{icon:'folder',label:'Buka',fn:()=>{fileFolder=f.name;R.berkas()}},{icon:'upload',label:'Unggah ke folder ini',fn:()=>pickFiles(f.name)},{icon:'pencil',label:'Ganti nama',fn:()=>ask('Ganti nama folder',[{name:'n',label:'Nama',value:f.name}],v=>{if(!v.n)return false;S.files.forEach(x=>{if(x.folder===f.name)x.folder=v.n});if(fileFolder===f.name)fileFolder=v.n;f.name=v.n;save();R.berkas()})},
  {icon:'trash-2',label:'Hapus folder',red:true,fn:()=>confirmBox('Hapus folder "'+f.name+'"? Berkas di dalamnya tetap ada.','Hapus',()=>{S.files.forEach(x=>{if(x.folder===f.name)x.folder=''});S.folders.splice(i,1);if(fileFolder===f.name)fileFolder=null;save();R.berkas()})}])}
function fileMenu(id){const f=S.files.find(x=>x.id===id);menu(f.name,[{icon:'file',label:'Buka',fn:()=>openFile(id)},{icon:'pencil',label:'Ganti nama',fn:()=>ask('Ganti nama',[{name:'n',label:'Nama berkas',value:f.name}],v=>{if(!v.n)return false;f.name=v.n;save();R.berkas()})},
  {icon:'folder-input',label:'Pindahkan ke folder',fn:()=>menu('Pindahkan ke',S.folders.map(fo=>({icon:'folder',label:fo.name,fn:()=>{const old=S.folders.find(x=>x.name===f.folder);if(old&&old.count>0)old.count--;fo.count++;f.folder=fo.name;save();R.berkas()}})))},
  {icon:'share-2',label:'Bagikan / simpan ke HP',fn:()=>shareFile(f)},
  {icon:'trash-2',label:'Hapus',red:true,fn:()=>confirmBox('Hapus "'+f.name+'"?','Hapus',()=>{S.files=S.files.filter(x=>x!==f);const fo=S.folders.find(x=>x.name===f.folder);if(fo&&fo.count>0)fo.count--;delBlob(f.id);save();R.berkas()})}])}
function pickFiles(folder){pickFolder=folder;$('#filePick').click()}
let pickFolder=null;
$('#filePick').onchange=async e=>{const list=[...e.target.files];e.target.value='';if(!list.length)return;
  for(const file of list){const f={id:'f'+Date.now()+Math.random().toString(36).slice(2,6),name:file.name,size:file.size,type:typeOf(file.name,file.type),mime:file.type,ts:Date.now(),folder:pickFolder||''};
    try{await putBlob(f.id,file);S.files.push(f);const fo=S.folders.find(x=>x.name===f.folder);if(fo)fo.count++}catch(err){toast('Gagal menyimpan '+file.name)}}
  save();toast(list.length+' berkas diunggah');if(cur==='berkas'||cur==='dashboard')R[cur]()};
async function openFile(id){const f=S.files.find(x=>x.id===id);if(!f)return;
  const b=await getBlob(f.id);
  if(!b){if(f.thumb&&f.type==='image'){showViewer(`<img src="${f.thumb}">`)}else toast('Ini berkas contoh — unggah berkasmu sendiri lewat tombol +');return}
  const u=URL.createObjectURL(b);
  if(f.type==='image')showViewer(`<img src="${u}">`);else if(f.type==='video')showViewer(`<video src="${u}" controls autoplay></video>`);else if(f.type==='music')showViewer(`<audio src="${u}" controls autoplay></audio>`);
  else if(/\.(md|markdown)$/i.test(f.name)){const t=await b.text();showMd(f.name,t)}
  else if(/^text\//.test(b.type)||/\.(txt|csv)$/i.test(f.name)){const t=await b.text();showViewer(`<pre style="color:#fff;white-space:pre-wrap;font-size:2.2rem;max-height:80vh;overflow:auto;padding:3rem">${esc(t)}</pre>`)}
  else shareFile(f)}
async function shareFile(f){const b=await getBlob(f.id);if(!b){toast('Berkas contoh tidak punya isi');return}
  if(window.Android&&Android.saveFile){const r=new FileReader();r.onload=()=>Android.saveFile(f.name,f.mime||b.type||'application/octet-stream',String(r.result).split(',')[1]);r.readAsDataURL(b)}
  else{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=f.name;a.click()}}
function showViewer(h){$('#viewer').classList.remove('md');$('#viewerBody').innerHTML=h;$('#viewer').classList.add('on')}
function showMd(name,text){$('#viewerBody').innerHTML=`<div class="mdbar"><span>${esc(name)}</span><button id="mdToNote">Jadikan Catatan</button></div><div class="mdv"><div class="body">${MD.render(text)}</div></div>`;
  const v=$('#viewer');v.classList.add('on','md');MD.diagrams(v.querySelector('.mdv .body'));
  $('#mdToNote').onclick=()=>{let t=text,title=name.replace(/\.(md|markdown)$/i,'');const m=t.match(/^\s*#\s+(.+)\n/);if(m){title=m[1].trim();t=t.slice(m[0].length)}
    const n={id:'n'+Date.now(),title,sub:'',autoSub:true,tag:'kerja',body:MD.render(t),updated:Date.now(),opened:Date.now(),labels:[],star:false,fav:false,archived:false,trashed:false,pinned:false,draft:false};
    n.sub=plain(n.body).slice(0,70);S.notes.push(n);save();closeViewer();openNote(n.id)}}
function closeViewer(){$('#viewer').classList.remove('on','md');$('#viewerBody').innerHTML=''}
$('#viewerX').innerHTML=ic('x');$('#viewerX').onclick=closeViewer;

/* ================= AI ================= */
// Layar sambutan tampil hanya saat chat masih kosong. Setelah pesan pertama: mode chat
// (pesan di atas, kolom ketik di bawah). Riwayat & pengaturan ada di sidebar (lebar 78%).
const AIRUN={busy:false,cancel:false,status:''};
function curChat(){return S.chats.find(c=>c.id===S.chatCur)||null}
function newChatObj(){const c={id:'c'+Date.now(),title:'Chat baru',msgs:[],updated:Date.now()};S.chats.unshift(c);S.chatCur=c.id;return c}
R.ai=function(){
  const el=$('#ai');const c=curChat();
  if(c&&c.msgs.length){el.className='view on chatmode';renderChatMode(el,c)}else{el.className='view on';renderWelcome(el)}
  renderSidebar();
};
function renderWelcome(el){
  el.innerHTML=`<div class="hdr2"><img class="logo" src="img/logo_ai.png" alt=""><div><div class="t1">CatatanByAdriy</div><div class="t2">AI Assistant</div></div><div class="sp"></div>
    <button class="sqbtn" id="aHist">${ic('history')}</button><button class="sqbtn" id="aSet">${ic('settings')}</button></div>
  <div class="aibanner"><img src="img/banner_ai.png" alt="Asisten AI Kamu"></div>
  <div class="tools">
    <button data-t="chat"><img src="img/ai_chat.png" alt=""><span>Chat AI</span></button>
    <button data-t="sum"><img src="img/ai_sum.png" alt=""><span>Rangkum<br>Catatan</span></button>
    <button data-t="write"><img src="img/ai_write.png" alt=""><span>Tulis Konten</span></button>
    <button data-t="tr"><img src="img/ai_tr.png" alt=""><span>Terjemahkan</span></button>
    <button data-t="img"><img src="img/ai_img.png" alt=""><span>Buat Gambar</span></button>
    <button data-t="more"><img src="img/ai_more.png" alt=""><span>Lainnya</span></button>
  </div>
  <div class="mq"><div class="hd">${ic('zap','z')}<h2>Mulai Cepat</h2><button class="link" id="mqAll">Lihat Semua ${ic('chevron-right')}</button></div>
    <div class="g">
      <button data-q="Rangkum dokumen ini: "><img src="img/mq_doc.png" alt=""><div><div class="a">Rangkum Dokumen</div><div class="b">Ringkas PDF, DOCX, atau catatan</div></div></button>
      <button data-q="Carikan ide konten tentang "><img src="img/mq_bulb.png" alt=""><div><div class="a">Cari Ide Konten</div><div class="b">Ide video, artikel, atau shorts</div></div></button>
      <button data-q="Jelaskan dengan sederhana: "><img src="img/mq_book.png" alt=""><div><div class="a">Jelaskan Materi</div><div class="b">Buat penjelasan yang mudah dipahami</div></div></button>
      <button data-q="Bantu kode ini: "><img src="img/mq_code.png" alt=""><div><div class="a">Bantu Pemrograman</div><div class="b">Contoh kode, debug, dan penjelasan</div></div></button>
      <button data-q="Analisis data berikut: "><img src="img/mq_chart.png" alt=""><div><div class="a">Analisis Data</div><div class="b">Ubah data jadi insight yang jelas</div></div></button>
      <button data-q="Buatkan materi belajar tentang "><img src="img/mq_book2.png" alt=""><div><div class="a">Buat Materi Belajar</div><div class="b">Rangkuman, poin penting, dan latihan</div></div></button>
    </div></div>
  <div class="chat"><div class="hd">${ic('chatfill')}<h2>Chat dengan AI</h2></div>
    <div class="box"><textarea id="aIn" placeholder="Tanyakan sesuatu..."></textarea>
      <div class="ic"><button id="aAtt">${ic('paperclip')}</button><button id="aImg">${ic('image')}</button><button id="aDoc">${ic('file-text')}</button></div>
      <button class="model" id="aModel">Model: ${esc(modelLabel())} ${ic('chevron-down')}</button><button class="send" id="aSend">${ic('send-fill')}</button></div></div>`;
  const inp=el.querySelector('#aIn');
  const put=t=>{inp.value=t;inp.focus();inp.setSelectionRange(t.length,t.length)};
  const T={chat:'',write:'Tuliskan konten tentang ',tr:'Terjemahkan ke bahasa Inggris: ',img:'Buatkan gambar: '};
  el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const t=b.dataset.t;
    if(t==='more'){moreTools(put);return}
    if(t==='sum'){pickNoteFor(n=>sendAi('Rangkum catatan berikut menjadi poin-poin penting.\n\nJudul: '+(n.title||'Tanpa judul')+'\n\n'+MD.toMd(n.body).slice(0,6000)));return}
    put(T[t])});
  el.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>put(b.dataset.q));
  el.querySelector('#mqAll').onclick=()=>moreTools(put);
  el.querySelector('#aSend').onclick=()=>sendAi(inp.value);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAi(inp.value)}});
  el.querySelector('#aModel').onclick=pickModel;
  el.querySelector('#aDoc').onclick=el.querySelector('#aAtt').onclick=()=>pickNoteFor(n=>put('Tentang catatan "'+n.title+'":\n'+MD.toMd(n.body).slice(0,4000)+'\n\nPertanyaan: '));
  el.querySelector('#aImg').onclick=()=>put('Buatkan gambar: ');
  el.querySelector('#aHist').onclick=()=>openSidebar();
  el.querySelector('#aSet').onclick=()=>openSidebar(true);
}
function moreTools(put){menu('Fitur AI lainnya',[{icon:'pen-line',label:'Perbaiki tata bahasa',fn:()=>put('Perbaiki tata bahasa: ')},{icon:'list',label:'Buat daftar poin',fn:()=>put('Buat poin-poin dari: ')},{icon:'square-check',label:'Buat soal latihan',fn:()=>put('Buat 5 soal latihan beserta jawabannya tentang ')},{icon:'type',label:'Buat judul & caption',fn:()=>put('Buatkan 5 judul dan caption menarik untuk konten tentang ')}])}
function renderChatMode(el,c){
  el.innerHTML=`<div class="chdr"><button class="sqbtn" id="cSide">${ic('menu')}</button><div class="ct"><div class="a">${esc(c.title)}</div><div class="b" id="cModel">${esc(modelLabel(true))}</div></div><button class="sqbtn" id="cNew">${ic('square-pen')}</button></div>
  <div class="cmsgs" id="cMsgs"></div>
  <div class="composer"><div class="cbox"><button class="cic" id="cAtt">${ic('paperclip')}</button><textarea id="cIn" rows="1" placeholder="Ketik pesan..."></textarea>
    <button class="csend" id="cSend">${ic('send-fill')}</button></div></div>`;
  renderMsgs(true);
  const inp=el.querySelector('#cIn');
  const grow=()=>{inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,innerWidth*0.32)+'px'};inp.addEventListener('input',grow);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!('ontouchstart' in window)){e.preventDefault();sendAi(inp.value)}});
  el.querySelector('#cSend').onclick=()=>{if(AIRUN.busy){AIRUN.cancel=true;return}sendAi(inp.value)};
  el.querySelector('#cSide').onclick=()=>openSidebar();
  el.querySelector('#cNew').onclick=()=>{S.chatCur=null;save();R.ai()};
  el.querySelector('#cAtt').onclick=()=>menu('Lampirkan',[{icon:'file-text',label:'Isi catatan',fn:()=>pickNoteFor(n=>{inp.value='Tentang catatan "'+n.title+'":\n'+MD.toMd(n.body).slice(0,4000)+'\n\nPertanyaan: '+inp.value;grow();inp.focus()})},{icon:'image',label:'Buat gambar',fn:()=>{inp.value='Buatkan gambar: ';inp.focus()}}]);
  updSend();
}
function modelLabel(long){const a=S.ai;if(a.model!=='auto'){const c=a.cands.find(x=>AIX.keyOf(x)===a.model);return c?AIX.shortName(c):'Otomatis'}
  if(!long)return 'Otomatis';const c=a.cands.find(x=>AIX.keyOf(x)===a.last);return 'Otomatis'+(c?' · '+AIX.shortName(c):' · model gratis')}
function updSend(){const b=$('#cSend');if(b){b.innerHTML=AIRUN.busy?ic('square','','fill:#fff;stroke:#fff'):ic('send-fill');b.classList.toggle('stop',AIRUN.busy)}}
function renderMsgs(jump){const box=$('#cMsgs');const c=curChat();if(!box||!c)return;
  box.innerHTML=c.msgs.map((m,i)=>m.role==='user'?`<div class="mrow me"><div class="bub me">${esc(m.content).replace(/\n/g,'<br>')}</div></div>`
    :`<div class="mrow bot"><div class="bub bot ${m.err?'err':''}"><div class="body">${m.img?`<img src="${esc(m.img)}" alt="" onerror="this.alt='Gambar gagal dimuat'"><p>${esc(m.content)}</p>`:MD.render(m.content)}</div></div>
      ${m.err?`<div class="macts"><button data-a="regen" data-i="${i}">${ic('redo-2')}Coba lagi</button></div>`:`<div class="macts"><button data-a="copy" data-i="${i}" title="Salin">${ic('copy')}</button><button data-a="regen" data-i="${i}" title="Buat ulang">${ic('refresh-cw')}</button><button data-a="like" data-i="${i}" class="${m.fb===1?'on':''}" title="Suka">${ic('thumbs-up')}</button><button data-a="dislike" data-i="${i}" class="${m.fb===-1?'on':''}" title="Tidak suka">${ic('thumbs-down')}</button><span class="mm">${esc(m.label||'')}</span></div>`}</div>`).join('')
    +(AIRUN.busy?`<div class="mrow bot"><div class="bub bot typing"><i></i><i></i><i></i><span id="cStat">${esc(AIRUN.status)}</span></div></div>`:'');
  box.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>msgAct(b.dataset.a,+b.dataset.i));
  MD.diagrams(box);
  if(jump)requestAnimationFrame(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}))}
function msgAct(a,i){const c=curChat(),m=c.msgs[i];
  if(a==='copy')copyText(m.content);
  else if(a==='like'||a==='dislike'){const v=a==='like'?1:-1;m.fb=m.fb===v?0:v;save();renderMsgs();toast(m.fb===1?'Terima kasih atas masukannya':m.fb===-1?'Masukan dicatat':'Masukan dihapus')}
  else if(a==='regen'){if(AIRUN.busy)return;c.msgs.splice(i,1);save();runAi(c,true)}}
function sendAi(text){text=(text||'').trim();if(!text||AIRUN.busy)return;
  let c=curChat();if(!c)c=newChatObj();
  c.msgs.push({role:'user',content:text,ts:Date.now()});if(c.msgs.length===1)c.title=text.replace(/\s+/g,' ').slice(0,40);c.updated=Date.now();save();
  R.ai();runAi(c)}
async function runAi(c,regen){
  const last=[...c.msgs].reverse().find(m=>m.role==='user');if(!last)return;
  AIRUN.busy=true;AIRUN.cancel=false;AIRUN.status='Mencari model gratis...';renderMsgs(true);updSend();
  const im=last.content.match(/^\s*buat(?:kan)?\s+gambar\s*:?\s*(.+)/i);
  try{
    if(im){if(navigator.onLine===false)throw new Error('Tidak ada koneksi internet.');
      c.msgs.push({role:'assistant',content:'Gambar: '+im[1].trim(),img:AIX.imageUrl(im[1].trim()),label:'Pollinations Image',ts:Date.now()})}
    else{const hist=c.msgs.filter(m=>!m.err&&!m.img);
      const r=await AIX.chat(hist,{onStatus:s=>{AIRUN.status=s;const e=$('#cStat');if(e)e.textContent=s},cancelled:()=>AIRUN.cancel,regen:!!regen});
      c.msgs.push({role:'assistant',content:r.text,label:r.label,ts:Date.now()})}
  }catch(e){if(e.message!=='cancel')c.msgs.push({role:'assistant',content:e.message||'Terjadi kesalahan.',err:true,ts:Date.now()})}
  AIRUN.busy=false;c.updated=Date.now();save();
  if(cur==='ai'&&curChat()===c){renderMsgs(true);updSend();const b=$('#cModel');if(b)b.textContent=modelLabel(true)}}
function pickModel(){const a=S.ai;
  menu('Pilih model',[{icon:'sparkle-ai',label:(a.model==='auto'?'✓ ':'')+'Otomatis (cari model gratis yang aktif)',fn:()=>{a.model='auto';save();R.ai()}}]
    .concat(a.cands.slice(0,20).map(c=>({icon:'zap',label:(a.model===AIX.keyOf(c)?'✓ ':'')+AIX.shortName(c),fn:()=>{a.model=AIX.keyOf(c);save();R.ai()}})))
    .concat([{icon:'refresh-cw',label:'Cari ulang model gratis',fn:rescan}]))}
async function rescan(){toast('Mencari model gratis...');try{const l=await AIX.discover(true);S.ai.cool={};save();toast(l.length+' model gratis ditemukan');renderSidebar();if(cur==='ai')R.ai()}catch(e){toast('Gagal mencari model')}}
function pickNoteFor(fn){menu('Pilih catatan',liveNotes().slice().sort((a,b)=>b.updated-a.updated).slice(0,8).map(n=>({icon:'file-text',label:n.title||'Tanpa judul',fn:()=>fn(n)})))}

/* ---------- sidebar riwayat & pengaturan ---------- */
function openSidebar(toSettings){renderSidebar();$('#side').classList.add('on');stack.push('side');if(toSettings)setTimeout(()=>{const s=$('#sideSet');s&&s.scrollIntoView({behavior:'smooth'})},250)}
function closeSidebar(){$('#side').classList.remove('on');const i=stack.lastIndexOf('side');if(i>=0)stack.splice(i,1)}
function renderSidebar(){const p=$('#sidePanel');if(!p)return;const a=S.ai;
  const groups={};S.chats.filter(c=>c.msgs.length).sort((x,y)=>y.updated-x.updated).forEach(c=>{const d=Math.round((dayStart(Date.now())-dayStart(c.updated))/864e5);const g=d===0?'Hari ini':d===1?'Kemarin':d<7?'7 hari terakhir':'Lebih lama';(groups[g]=groups[g]||[]).push(c)});
  p.innerHTML=`<div class="shd"><img src="img/logo_ai.png" alt=""><div><b>Asisten AI</b><span>CatatanByAdriy</span></div><button id="sClose">${ic('x')}</button></div>
  <button class="snew" id="sNew">${ic('square-pen')}Chat baru</button>
  <div class="ssec">${ic('history')}Riwayat Chat</div>
  <div class="slist">${Object.keys(groups).map(g=>`<div class="sg">${g}</div>`+groups[g].map(c=>`<div class="sitem ${c.id===S.chatCur?'on':''}" data-c="${c.id}"><span>${esc(c.title)}</span><button data-cm="${c.id}">${ic('ellipsis-vertical')}</button></div>`).join('')).join('')||'<div class="sempty">Belum ada riwayat chat.</div>'}</div>
  <div class="ssec" id="sideSet">${ic('settings')}Pengaturan</div>
  <div class="sset">
    <button class="srow" id="sModel"><span><b>Model</b><em>${esc(modelLabel(true))}</em></span>${ic('chevron-right')}</button>
    <button class="srow" id="sScan"><span><b>Cari ulang model gratis</b><em>${a.cands.length} model ditemukan${a.candsAt?' · '+rel(a.candsAt):''}</em></span>${ic('refresh-cw')}</button>
    ${AIX.ORDER.map(k=>{const P=AIX.PROV[k];return `<button class="srow" data-k="${k}"><span><b>${esc(P.name)}</b><em>${P.key?((a.keys[k]||'').trim()?'Kunci tersimpan ✓':'Opsional — isi kunci gratis'):((a.keys[k]||'').trim()?'Kunci tersimpan ✓':'Aktif tanpa kunci')}</em></span>${ic('chevron-right')}</button>`}).join('')}
    <button class="srow red" id="sClear"><span><b>Hapus semua riwayat chat</b></span>${ic('trash-2')}</button>
  </div>`;
  p.querySelector('#sClose').onclick=closeSidebar;
  p.querySelector('#sNew').onclick=()=>{S.chatCur=null;save();closeSidebar();if(cur!=='ai')go('ai');else R.ai()};
  p.querySelectorAll('.sitem').forEach(x=>x.onclick=e=>{if(e.target.closest('[data-cm]'))return;S.chatCur=x.dataset.c;save();closeSidebar();if(cur!=='ai')go('ai');else R.ai()});
  p.querySelectorAll('[data-cm]').forEach(b=>b.onclick=()=>{const c=S.chats.find(x=>x.id===b.dataset.cm);menu(c.title,[
    {icon:'pencil',label:'Ganti nama',fn:()=>ask('Ganti nama chat',[{name:'t',label:'Nama',value:c.title}],v=>{if(!v.t)return false;c.title=v.t;save();renderSidebar();if(cur==='ai')R.ai()})},
    {icon:'trash-2',label:'Hapus chat',red:true,fn:()=>confirmBox('Hapus chat "'+c.title+'"?','Ya, hapus',()=>{S.chats=S.chats.filter(x=>x!==c);if(S.chatCur===c.id)S.chatCur=null;save();renderSidebar();if(cur==='ai')R.ai()})}])});
  p.querySelector('#sModel').onclick=pickModel;
  p.querySelector('#sScan').onclick=rescan;
  p.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k,P=AIX.PROV[k];
    sheet(`<h3>${esc(P.name)}</h3><p class="note">${P.key?'Gratis: buat akun lalu salin kunci API dari <b>'+esc(P.keyUrl)+'</b>. Kunci hanya disimpan di HP ini.':'Sudah aktif tanpa kunci (dibatasi 1 balasan / 45 detik). Kunci dari <b>'+esc(P.keyUrl)+'</b> bersifat opsional untuk membuka batas.'}</p><form id="kf"><label class="fld"><span>Kunci API</span><input name="k" value="${esc(a.keys[k]||'')}" placeholder="Tempel kunci di sini" autocomplete="off"></label><button class="prim" type="submit">Simpan & cari model</button></form>`,el=>{
      el.querySelector('#kf').onsubmit=e=>{e.preventDefault();a.keys[k]=e.target.k.value.trim();a.cool={};save();closeSheet();rescan()}})});
  p.querySelector('#sClear').onclick=()=>confirmBox('Hapus semua riwayat chat?','Ya, hapus semua',()=>{S.chats=[];S.chatCur=null;save();renderSidebar();if(cur==='ai')R.ai()});
}

/* ================= KALENDER ================= */
let calMonth=null,calSel=null,calTab='agenda';
const CATN={kerja:'Kerja',konten:'Konten',belajar:'Belajar',pribadi:'Pribadi',target:'Target'};
const CATI={kerja:['briefcase-business','#1e6ff0'],konten:['circle-play','#e8457a'],belajar:['book-open','#1e6ff0'],pribadi:['calendar-days','#8b4ef0'],target:['flag','#f59e0b']};
const DOT={kerja:'#2f8af5',konten:'#ef5e8a',belajar:'#34b46a',pribadi:'#9b5cf0',target:'#f59e0b'};
const TAGC={kerja:'t-kerja',konten:'t-konten2',belajar:'d-belajar',pribadi:'t-pribadi',target:'t-target'};
const timeStr=a=>a.start+(a.end?' – '+a.end:'');
const agSort=(x,y)=>x.date===y.date?(x.start<y.start?-1:1):(x.date<y.date?-1:1);
R.kalender=function(){
  const el=$('#kalender');const today=new Date();
  if(!calSel)calSel=ymd(today);if(!calMonth){const d=parseYmd(calSel);calMonth=new Date(d.getFullYear(),d.getMonth(),1)}
  const y=calMonth.getFullYear(),m=calMonth.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  let cells='';for(let i=0;i<first;i++)cells+='<span></span>';
  for(let d=1;d<=days;d++){const k=y+'-'+pad(m+1)+'-'+pad(d);const ags=S.agendas.filter(a=>a.date===k).sort(agSort);const dow=(first+d-1)%7;
    cells+=`<button data-d="${k}" class="${k===calSel?'on':''} ${k===ymd(today)?'today':''} ${dow===6?'sat':''}"><span>${d}</span>${ags.length&&k!==calSel?`<i style="background:${DOT[ags[ags.length-1].cat]}"></i>`:''}</button>`}
  const sd=parseYmd(calSel);const dayAg=S.agendas.filter(a=>a.date===calSel).sort(agSort);
  const tk=ymd(today);const nextDays={};S.agendas.filter(a=>a.date>tk&&!a.done).sort(agSort).forEach(a=>{if(!nextDays[a.date])nextDays[a.date]=a});
  const up=Object.values(nextDays).slice(0,3);
  let lower='';
  if(calTab==='agenda'){lower=`<div class="sechd"><h2>Agenda Mendatang</h2><button class="link" id="kAll">Lihat Semua ${ic('chevron-right')}</button></div>
    <div class="uplist">${up.map(a=>{const d=parseYmd(a.date);return `<div class="up" data-id="${a.id}"><div class="dt d-${a.cat}"><span>${HARI[d.getDay()]}</span><span>${d.getDate()} ${BLN[d.getMonth()]}</span></div><span class="vl"></span>${ic(CATI[a.cat][0],'ic','color:'+CATI[a.cat][1])}<div class="tx"><div class="a">${esc(a.title)}</div><div class="b">${timeStr(a)}</div></div><span class="tag ${TAGC[a.cat]}">${CATN[a.cat]}</span><button class="m" data-m="${a.id}">${ic('ellipsis-vertical')}</button></div>`}).join('')||'<div class="empty">Tidak ada agenda mendatang.</div>'}</div>`}
  else if(calTab==='tugas'){const t=S.agendas.filter(a=>a.date>=tk).sort(agSort);lower=`<div class="sechd"><h2>Tugas</h2><span class="link">${t.filter(a=>a.done).length}/${t.length} selesai</span></div><div class="uplist">${t.map(agRow).join('')||'<div class="empty">Tidak ada tugas.</div>'}</div>`}
  else{const mm=S.agendas.filter(a=>a.date.startsWith(y+'-'+pad(m+1)));lower=`<div class="sechd"><h2>Ringkasan ${BULAN[m]}</h2></div><div class="ksum"><div>Total agenda<b>${mm.length}</b></div><div>Selesai<b>${mm.filter(a=>a.done).length}</b></div>${Object.keys(CATN).map(c=>`<div>${CATN[c]}<b>${mm.filter(a=>a.cat===c).length}</b></div>`).join('')}</div>`}
  el.innerHTML=`<div class="hdr3"><img class="logo" src="img/logo_kal.png" alt=""><div><div class="t1">CatatanByAdriy</div><div class="t2">Kalender</div></div><div class="sp"></div>
    <button class="sqbtn" id="kSearch">${ic('search')}</button><button class="sqbtn" id="kAdd">${ic('calendar-plus')}</button><button class="sqbtn" id="kSet">${ic('settings')}</button></div>
  <div class="krow"><div class="mcal"><div class="top"><button id="kPrev">${ic('chevron-left')}</button><button class="ttl" id="kMon">${BULAN[m]} ${y} ${ic('chevron-down')}</button><button id="kNext">${ic('chevron-right')}</button></div>
    <div class="wd">${HARI.map(h=>`<span>${h}</span>`).join('')}</div><div class="dd">${cells}</div></div>
    <div class="dayc"><div class="hd">${ic('calendar')}<div><h2>${HARI[sd.getDay()]}, ${sd.getDate()} ${BLN[sd.getMonth()]} ${sd.getFullYear()}</h2><p>${dayAg.length} Agenda</p></div></div>
      <div class="ls">${dayAg.map(agRow).join('')||'<div class="empty" style="padding:4rem 1rem">Belum ada agenda.</div>'}</div></div></div>
  <div class="krow2"><button class="addag" id="kAddBtn">${ic('plus')}Tambah Agenda</button><div class="ktabs"><button class="${calTab==='agenda'?'on':''}" data-tab="agenda">${ic('calendar')}Agenda</button><button class="${calTab==='tugas'?'on':''}" data-tab="tugas">${ic('square-check-big')}Tugas</button><button class="${calTab==='ringkasan'?'on':''}" data-tab="ringkasan">${ic('bars','barsic','')}Ringkasan</button></div></div>
  ${lower}
  <div class="sechd"><h2>Kategori Agenda</h2><button class="link" id="kKat">Kelola Kategori ${ic('chevron-right')}</button></div>
  <div class="kats">${Object.keys(CATN).map(c=>`<button class="kat k-${c}" data-k="${c}">${ic(c==='kerja'?'briefcase-business':c==='konten'?'play':c==='belajar'?'book-open':c==='pribadi'?'calendar-days':'flag')}${CATN[c]}</button>`).join('')}<button class="kat k-add" id="kKatAdd">${ic('plus')}Tambah</button></div>`;
  // ikon ringkasan pada tab: batang biru → warna teks
  el.querySelectorAll('.ktabs .barsic rect').forEach(r=>r.setAttribute('fill','currentColor'));
  el.querySelectorAll('.dd button').forEach(b=>b.onclick=()=>{calSel=b.dataset.d;R.kalender()});
  el.querySelector('#kPrev').onclick=()=>{calMonth=new Date(y,m-1,1);R.kalender()};
  el.querySelector('#kNext').onclick=()=>{calMonth=new Date(y,m+1,1);R.kalender()};
  el.querySelector('#kMon').onclick=()=>{calSel=ymd(new Date());calMonth=null;R.kalender();toast('Kembali ke hari ini')};
  el.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{calTab=b.dataset.tab;R.kalender()});
  el.querySelector('#kAddBtn').onclick=el.querySelector('#kAdd').onclick=()=>addAgenda(calSel,R.kalender);
  el.querySelectorAll('.ag .cb').forEach(b=>b.onclick=()=>{const a=S.agendas.find(x=>x.id===b.dataset.cb);a.done=!a.done;save();R.kalender()});
  el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>agMenu(b.dataset.m));
  el.querySelector('#kSearch').onclick=openSearch;
  el.querySelector('#kSet').onclick=()=>menu('Pengaturan Kalender',[{icon:'calendar',label:'Kembali ke hari ini',fn:()=>{calSel=ymd(new Date());calMonth=null;R.kalender()}},{icon:'trash-2',label:'Hapus agenda yang sudah selesai',red:true,fn:()=>{S.agendas=S.agendas.filter(a=>!a.done);save();R.kalender()}}]);
  const allAg=()=>menu('Semua agenda mendatang',S.agendas.filter(a=>a.date>=tk).sort(agSort).map(a=>{const d=parseYmd(a.date);return {icon:CATI[a.cat][0],label:`${HARI[d.getDay()]} ${d.getDate()} ${BLN[d.getMonth()]} • ${a.title} (${timeStr(a)})`,fn:()=>{calSel=a.date;calMonth=null;R.kalender()}}}));
  const ka=el.querySelector('#kAll');if(ka)ka.onclick=allAg;
  el.querySelectorAll('.kat[data-k]').forEach(b=>b.onclick=()=>{const c=b.dataset.k;menu('Agenda '+CATN[c],S.agendas.filter(a=>a.cat===c).sort(agSort).map(a=>{const d=parseYmd(a.date);return {icon:CATI[c][0],label:`${d.getDate()} ${BLN[d.getMonth()]} • ${a.title}`,fn:()=>{calSel=a.date;calMonth=null;R.kalender()}}}).concat([{icon:'plus',label:'Tambah agenda '+CATN[c],fn:()=>addAgenda(calSel,R.kalender,c)}]))});
  el.querySelector('#kKat').onclick=el.querySelector('#kKatAdd').onclick=()=>toast('Kategori: Kerja, Konten, Belajar, Pribadi, Target');
};
function agRow(a){return `<div class="ag c-${a.cat} ${a.done?'done':''}"><button class="cb" data-cb="${a.id}"><i>${a.done?ic('check'):''}</i></button><div class="tx"><div class="a">${esc(a.title)}</div><div class="b">${timeStr(a)}</div></div><span class="tag ${TAGC[a.cat]}">${CATN[a.cat]}</span><button class="m" data-m="${a.id}">${ic('ellipsis-vertical')}</button></div>`}
function agMenu(id){const a=S.agendas.find(x=>x.id===id);menu(a.title,[{icon:'square-check',label:a.done?'Tandai belum selesai':'Tandai selesai',fn:()=>{a.done=!a.done;save();go(cur)}},{icon:'pencil',label:'Ubah',fn:()=>addAgenda(a.date,()=>go(cur),a.cat,a)},{icon:'trash-2',label:'Hapus',red:true,fn:()=>confirmBox('Hapus agenda "'+a.title+'"?','Ya, hapus',()=>{S.agendas=S.agendas.filter(x=>x!==a);save();go(cur)})}])}
function addAgenda(date,after,cat,edit){
  const toT=s=>(s||'').replace('.',':'),fromT=s=>(s||'').replace(':','.');
  ask(edit?'Ubah Agenda':'Tambah Agenda',[{name:'title',label:'Judul agenda',value:edit&&edit.title,ph:'mis. Shift Pagi'},{name:'date',label:'Tanggal',type:'date',value:edit?edit.date:date},
    {name:'start',label:'Jam mulai',type:'time',value:toT(edit?edit.start:'08.00')},{name:'end',label:'Jam selesai (opsional)',type:'time',value:toT(edit&&edit.end)},
    {name:'cat',label:'Kategori',type:'select',value:edit?edit.cat:(cat||'kerja'),options:Object.entries(CATN)}],v=>{
      if(!v.title){toast('Judul agenda wajib diisi');return false}if(!v.date){toast('Tanggal wajib diisi');return false}
      const o=edit||{id:'a'+Date.now(),done:false};Object.assign(o,{title:v.title,date:v.date,start:fromT(v.start)||'00.00',end:fromT(v.end),cat:v.cat});if(!edit)S.agendas.push(o);save();
      if(cur==='kalender'){calSel=v.date;calMonth=null}after&&after();toast(edit?'Agenda diubah':'Agenda ditambahkan')})}

/* ================= CARI ================= */
function openSearch(){$('#srch').classList.add('on');stack.push('srch');$('#srchIn').value='';renderSearch('');setTimeout(()=>$('#srchIn').focus(),100)}
function closeSearch(){$('#srch').classList.remove('on');const i=stack.lastIndexOf('srch');if(i>=0)stack.splice(i,1);$('#srchIn').blur()}
$('#srchBack').innerHTML=ic('arrow-left');$('#srchBack').onclick=closeSearch;
$('#srchIn').oninput=e=>renderSearch(e.target.value);
function renderSearch(q,pred){q=(q||'').toLowerCase();const r=$('#srchRes');
  const ns=liveNotes().filter(n=>pred?pred(n):q&&(n.title+' '+n.sub+' '+plain(n.body)).toLowerCase().includes(q)).slice(0,30);
  const fs=pred?[]:S.files.filter(f=>q&&f.name.toLowerCase().includes(q)).slice(0,20);
  const as=pred?[]:S.agendas.filter(a=>q&&a.title.toLowerCase().includes(q)).slice(0,20);
  r.innerHTML=(pred?`<div class="lhead" style="margin:0 0 1rem"><h2>${esc(q)}</h2></div>`:'')+ns.map(n=>`<div class="nrow" data-n="${n.id}"><img class="tile" src="img/${TILE[n.tag]||'nt_blue'}.png"><div class="tx"><div class="a">${esc(n.title||'Tanpa judul')}</div><div class="b">${esc(n.sub)}</div></div><span class="tag t-${n.tag}" style="margin-right:2rem">${TAGN[n.tag]}</span></div>`).join('')
    +fs.map(f=>`<div class="frow" data-f="${f.id}"><div class="ic">${fileIcon(f)}</div><div class="tx"><div class="a">${esc(f.name)}</div><div class="b">${fmtSize(f.size)} • ${rel(f.ts)}</div></div></div>`).join('')
    +as.map(a=>`<div class="up" data-a="${a.date}" style="padding-left:2.4rem">${ic(CATI[a.cat][0],'ic','color:'+CATI[a.cat][1])}<div class="tx"><div class="a">${esc(a.title)}</div><div class="b">${a.date.split('-').reverse().join('/')} • ${timeStr(a)}</div></div></div>`).join('')
    ||(q?'<div class="empty">Tidak ditemukan.</div>':'<div class="empty">Ketik untuk mencari catatan, berkas, atau agenda.</div>');
  r.querySelectorAll('[data-n]').forEach(x=>x.onclick=()=>{closeSearch();openNote(x.dataset.n)});
  r.querySelectorAll('[data-f]').forEach(x=>x.onclick=()=>{closeSearch();openFile(x.dataset.f)});
  r.querySelectorAll('[data-a]').forEach(x=>x.onclick=()=>{closeSearch();calSel=x.dataset.a;calMonth=null;go('kalender')})}

/* ================= cadangan ================= */
function backup(){const data=JSON.stringify(Object.assign({},S,{ai:Object.assign({},S.ai,{keys:{}})}));const name='catatanbyadriy-cadangan-'+ymd(Date.now())+'.json';
  if(window.Android&&Android.saveFile){Android.saveFile(name,'application/json',btoa(unescape(encodeURIComponent(data))))}else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=name;a.click()}}
function restore(){const i=document.createElement('input');i.type='file';i.accept='application/json,.json';i.onchange=async()=>{const f=i.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!d.notes||!d.agendas)throw 0;const keys=S.ai&&S.ai.keys;S=d;migrate();if(keys)S.ai.keys=keys;save();go('dashboard');toast('Data dipulihkan')}catch(e){toast('Berkas cadangan tidak valid')}};i.click()}

/* ---------- keyboard: sembunyikan nav saat mengetik ---------- */
let baseH=Math.max(window.innerHeight,window.visualViewport?visualViewport.height:0);
function kbCheck(){const h=window.visualViewport?Math.min(visualViewport.height,window.innerHeight):window.innerHeight;const ae=document.activeElement;
  const typing=ae&&(ae.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName));const kb=h<baseH*0.8&&typing;
  document.body.classList.toggle('kb',kb);if(h>baseH)baseH=h;
  if(kb&&ae&&ae.isContentEditable){const s=getSelection();if(s.rangeCount){const r=s.getRangeAt(0).getBoundingClientRect();if(r.bottom>h-90)window.scrollBy(0,r.bottom-h+110)}}}
window.addEventListener('resize',kbCheck);if(window.visualViewport)visualViewport.addEventListener('resize',kbCheck);
document.addEventListener('focusout',()=>setTimeout(kbCheck,120));document.addEventListener('focusin',()=>setTimeout(kbCheck,350));
window.addEventListener('orientationchange',()=>{baseH=0;setTimeout(()=>{baseH=window.innerHeight;kbCheck()},400)});
const st=document.createElement('style');st.textContent='#eTitle:empty::before{content:attr(data-ph);color:#9aa1b5}';document.head.appendChild(st);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&cur==='editor'&&EV.timer){clearTimeout(EV.timer);flush()}});

/* ---------- animasi pembuka (video dibuat dengan Remotion: folder intro/) ---------- */
function runIntro(){const box=$('#intro'),v=$('#introVid');if(!box)return;let done=false;
  const end=()=>{if(done)return;done=true;box.classList.add('out');setTimeout(()=>box.remove(),520)};
  box.onclick=end;setTimeout(end,6000);
  fetch('media/intro.webm').then(r=>r.blob()).then(b=>{v.src=URL.createObjectURL(b);v.onended=end;v.onerror=end;
    const p=v.play();if(p&&p.catch)p.catch(end)}).catch(end)}
$('#sideOv').onclick=()=>closeSidebar();
load();go('dashboard');booted=true;runIntro();
AIX.discover(false).catch(()=>{});
})();
