/* Mesin AI CatatanByAdriy — model gratis, ditemukan otomatis.
   Urutan: penyedia berkunci gratis yang diisi pemilik (OpenRouter :free, Groq, Gemini) → Pollinations tanpa kunci.
   Daftar model diambil langsung dari tiap penyedia; bila satu model error / kena batas, otomatis pindah ke model
   berikutnya, dan daftar dicari ulang saat semua gagal atau internet tersambung kembali. */
(function(){
'use strict';
const PROV={
  openrouter:{name:'OpenRouter (model :free)',key:true,keyUrl:'openrouter.ai/keys',
    list:'https://openrouter.ai/api/v1/models',chat:'https://openrouter.ai/api/v1/chat/completions',
    pick:j=>(j.data||[]).filter(m=>/:free$/.test(m.id)||(m.pricing&&+m.pricing.prompt===0&&+m.pricing.completion===0))
      .filter(m=>!m.architecture||!m.architecture.output_modalities||m.architecture.output_modalities.includes('text'))
      .sort((a,b)=>(b.context_length||0)-(a.context_length||0)).map(m=>({id:m.id,name:m.name||m.id}))},
  groq:{name:'Groq (kuota gratis)',key:true,keyUrl:'console.groq.com/keys',
    list:'https://api.groq.com/openai/v1/models',chat:'https://api.groq.com/openai/v1/chat/completions',
    pick:j=>(j.data||[]).filter(m=>m.active!==false&&!/whisper|tts|guard|embed|playai|orpheus/i.test(m.id)).map(m=>({id:m.id,name:m.id}))},
  gemini:{name:'Google Gemini (kuota gratis)',key:true,keyUrl:'aistudio.google.com/apikey',
    list:'https://generativelanguage.googleapis.com/v1beta/openai/models',chat:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    pick:j=>(j.data||[]).map(m=>String(m.id).replace(/^models\//,'')).filter(id=>/gemini/.test(id)&&/flash/.test(id)&&!/image|tts|audio|live|embed|thinking-exp/.test(id))
      .sort((a,b)=>b.localeCompare(a)).map(id=>({id,name:id}))},
  pollinations:{name:'Pollinations (gratis tanpa kunci)',key:false,keyUrl:'enter.pollinations.ai',
    list:'https://text.pollinations.ai/models',chat:'https://text.pollinations.ai/openai',
    pick:(j,hasKey)=>(Array.isArray(j)?j:(j.data||[])).filter(m=>(!m.output_modalities||m.output_modalities.includes('text'))&&(hasKey||!m.tier||m.tier==='anonymous'))
      .map(m=>({id:m.name||m.id,name:(m.description||m.name||m.id)}))}
};
const ORDER=['openrouter','groq','gemini','pollinations'];
const SYS='Kamu adalah Asisten AI di aplikasi CatatanByAdriy milik Adriy. Jawab dalam bahasa Indonesia yang jelas, ramah, dan santai, kecuali diminta bahasa lain. Gunakan Markdown (judul, daftar, tabel, kode) bila membantu. Jawab langsung tanpa basa-basi panjang.';

let st=null,save=()=>{};
function init(state,saver){st=state;save=saver;st.keys=st.keys||{};st.cands=st.cands||[];st.cool=st.cool||{};st.model=st.model||'auto';
  window.addEventListener('online',()=>discover(true).catch(()=>{}))}

/* ---------- HTTP: lewat Android (tanpa batasan CORS) atau fetch ---------- */
let seq=0;const pend={};
window.__httpDone=(id,status,text,hdr)=>{const p=pend[id];if(!p)return;delete pend[id];p({status,text,headers:hdr?JSON.parse(hdr):{}})};
function http(method,url,headers,body,timeout){
  timeout=timeout||90000;
  if(window.Android&&Android.httpRequest){return new Promise((res,rej)=>{const id='h'+(++seq);
    const t=setTimeout(()=>{delete pend[id];rej(new Error('timeout'))},timeout+2000);
    pend[id]=r=>{clearTimeout(t);r.status?res(r):rej(new Error(r.text||'network'))};
    Android.httpRequest(id,method,url,JSON.stringify(headers||{}),body||'',timeout)})}
  const c=new AbortController();const t=setTimeout(()=>c.abort(),timeout);
  return fetch(url,{method,headers,body:body||undefined,signal:c.signal}).then(async r=>{clearTimeout(t);const h={};r.headers.forEach((v,k)=>h[k.toLowerCase()]=v);return {status:r.status,text:await r.text(),headers:h}})}

/* ---------- mencari model gratis ---------- */
const ready=p=>!PROV[p].key||!!(st.keys[p]||'').trim();
const auth=p=>{const k=(st.keys[p]||'').trim();return k?{Authorization:'Bearer '+k}:{}};
let discovering=null;
function discover(force){
  if(discovering)return discovering;
  if(!force&&st.cands.length&&Date.now()-(st.candsAt||0)<6*3600e3)return Promise.resolve(st.cands);
  discovering=(async()=>{const found=[];const errs=[];
    await Promise.all(ORDER.filter(ready).map(async p=>{try{
      const r=await http('GET',PROV[p].list,auth(p),'',20000);
      if(r.status>=400)throw new Error('HTTP '+r.status);
      const ms=PROV[p].pick(JSON.parse(r.text),!!(st.keys[p]||'').trim()).slice(0,p==='pollinations'?6:12);
      ms.forEach(m=>found.push({p,id:m.id,name:m.name}));
    }catch(e){errs.push(p+': '+e.message)}}));
    found.sort((a,b)=>ORDER.indexOf(a.p)-ORDER.indexOf(b.p));
    if(!found.length&&!st.cands.length)found.push({p:'pollinations',id:'openai-fast',name:'Bawaan (cadangan)'}); // cadangan bila daftar gagal dimuat
    if(found.length){st.cands=found;st.candsAt=Date.now();save()}
    discovering=null;return st.cands})();
  return discovering}
function keyOf(c){return c.p+'|'+c.id}
function ordered(){const list=st.cands.slice();
  if(st.model!=='auto'){const i=list.findIndex(c=>keyOf(c)===st.model);if(i>0)list.unshift(list.splice(i,1)[0])}
  else if(st.last){const i=list.findIndex(c=>keyOf(c)===st.last);if(i>0)list.unshift(list.splice(i,1)[0])}
  return list.filter(c=>ready(c.p))}

/* ---------- satu permintaan ---------- */
async function call(c,messages,regen){
  const o={model:c.id,messages,temperature:regen?0.95:0.7};if(c.p==='pollinations')o.seed=Math.floor(Math.random()*1e9);else if(regen)o.seed=Math.floor(Math.random()*1e9);
  const body=JSON.stringify(o);
  const r=await http('POST',PROV[c.p].chat,Object.assign({'Content-Type':'application/json'},auth(c.p),c.p==='openrouter'?{'X-Title':'CatatanByAdriy'}:{}),body,90000);
  if(r.status>=400){const e=new Error(errText(r));e.status=r.status;e.wait=waitOf(r);throw e}
  let j;try{j=JSON.parse(r.text)}catch(e){const er=new Error('Jawaban tidak terbaca');er.status=502;throw er}
  const m=j.choices&&j.choices[0]&&j.choices[0].message;let t=m&&(typeof m.content==='string'?m.content:Array.isArray(m.content)?m.content.map(x=>x.text||'').join(''):'');
  t=(t||'').replace(/<think>[\s\S]*?<\/think>/g,'').trim();
  if(!t){const er=new Error('Jawaban kosong');er.status=502;throw er}
  return {text:t,model:j.model||c.id}}
function errText(r){try{const j=JSON.parse(r.text);return (j.error&&(j.error.message||j.error))||j.message||r.text}catch(e){return String(r.text||'').slice(0,200)}}
function waitOf(r){const h=r.headers||{};let s=+h['retry-after'];if(!s){const m=String(r.text).match(/wait (\d+) second/i);if(m)s=+m[1]}return s||0}

/* ---------- obrolan dengan cadangan otomatis ---------- */
async function chat(history,opt){opt=opt||{};const status=opt.onStatus||(()=>{});const isCancel=opt.cancelled||(()=>false);
  if(navigator.onLine===false)throw new Error('Tidak ada koneksi internet. Sambungkan internet lalu coba lagi.');
  const messages=[{role:'system',content:SYS}].concat(history.slice(-14).map(m=>({role:m.role,content:m.content})));
  let rescanned=false;
  for(let round=0;round<4;round++){
    status('Mencari model gratis...');
    await discover(false);
    const now=Date.now();const list=ordered();const usable=list.filter(c=>!(st.cool[keyOf(c)]>now));
    for(const c of usable){if(isCancel())throw new Error('cancel');
      status('Menghubungi '+shortName(c)+'...');
      try{const r=await call(c,messages,opt.regen);st.last=keyOf(c);delete st.cool[keyOf(c)];save();return Object.assign(r,{provider:c.p,label:shortName(c)})}
      catch(e){if(isCancel())throw new Error('cancel');
        const k=keyOf(c),s=e.status||0;
        if(s===401||s===403){list.filter(x=>x.p===c.p).forEach(x=>st.cool[keyOf(x)]=now+30*60e3)}
        else if(s===402||s===429)st.cool[k]=now+Math.max(e.wait||60,15)*1000;
        else if(s===404||s===400)st.cool[k]=now+6*3600e3;
        else st.cool[k]=now+2*60e3;
        save()}}
    // semua gagal: cari ulang daftar model sekali, lalu tunggu jatah gratis terdekat bila singkat
    if(!rescanned){rescanned=true;status('Mencari ulang model gratis...');await discover(true);continue}
    const soon=list.map(c=>st.cool[keyOf(c)]||0).filter(t=>t>Date.now()).sort((a,b)=>a-b)[0];
    if(soon&&soon-Date.now()<=75000){
      while(Date.now()<soon){if(isCancel())throw new Error('cancel');status('Menunggu jatah gratis berikutnya... '+Math.ceil((soon-Date.now())/1000)+' dtk');await new Promise(r=>setTimeout(r,1000))}
      continue}
    break}
  throw new Error(ORDER.some(p=>PROV[p].key&&ready(p))?'Semua model gratis sedang sibuk atau error. Coba lagi sebentar lagi.':'Model gratis tanpa kunci sedang sibuk (batas 1 balasan / 45 detik). Coba lagi sebentar, atau isi kunci gratis OpenRouter/Groq/Gemini di Pengaturan agar lebih lancar.')}
function shortName(c){const n=String(c.id).split('/').pop().replace(/:free$/,'');return n+' · '+({openrouter:'OpenRouter',groq:'Groq',gemini:'Gemini',pollinations:'Pollinations'}[c.p])}
function imageUrl(prompt){return 'https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt)+'?width=768&height=768&nologo=true&seed='+Math.floor(Math.random()*1e6)}

window.AIX={PROV,ORDER,init,discover,chat,shortName,keyOf,imageUrl,ready};
})();
