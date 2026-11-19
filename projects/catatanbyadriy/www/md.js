/* Markdown untuk CatatanByAdriy:
   - render: Markdown luas → HTML (GFM: tabel, tugas, coret; catatan kaki, ==stabilo==, ++sisipan++, ~sub~, ^sup^,
     singkatan, daftar definisi, emoji :smile:, kotak ::: info, peringatan > [!NOTE], rumus $..$ / $$..$$,
     kode berwarna, diagram ```mermaid, HTML mentah yang aman)
   - toMd: HTML catatan → Markdown
   - tidy: merapikan Markdown (spasi, penanda daftar, huruf kapital, judul, jarak antar blok) */
(function(){
'use strict';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const md=window.markdownit({html:true,linkify:true,typographer:true,breaks:true,
  highlight(code,lang){
    if(lang==='mermaid')return '';
    try{if(lang&&window.hljs&&hljs.getLanguage(lang))return '<pre class="hljs"><code class="language-'+esc(lang)+'">'+hljs.highlight(code,{language:lang,ignoreIllegals:true}).value+'</code></pre>';}catch(e){}
    return '';
  }});
md.use(window.markdownitFootnote).use(window.markdownitTaskLists,{enabled:true})
  .use(window.markdownitMark).use(window.markdownitSub).use(window.markdownitSup).use(window.markdownitIns)
  .use(window.markdownitAbbr).use(window.markdownitDeflist).use(window.markdownitEmoji)
  .use(texmath,{engine:window.katex,delimiters:'dollars',katexOptions:{throwOnError:false}});
const BOX={info:'Info',tip:'Tips',note:'Catatan',warning:'Perhatian',danger:'Bahaya',success:'Berhasil',details:'Detail'};
Object.keys(BOX).forEach(k=>md.use(window.markdownitContainer,k,{render(tokens,i){
  const t=tokens[i];if(t.nesting===1){const title=t.info.trim().slice(k.length).trim()||BOX[k];
    return k==='details'?'<details class="md-box details"><summary>'+md.renderInline(title)+'</summary>\n':'<div class="md-box '+k+'"><div class="md-box-t">'+md.renderInline(title)+'</div>\n'}
  return k==='details'?'</details>\n':'</div>\n'}}));
const fence=md.renderer.rules.fence;
md.renderer.rules.fence=function(tokens,idx,opt,env,self){const t=tokens[idx];
  if(t.info.trim()==='mermaid')return '<pre class="mermaid" data-src="'+esc(t.content)+'">'+esc(t.content)+'</pre>\n';
  return fence(tokens,idx,opt,env,self)};

const ALERT={NOTE:['note','Catatan'],TIP:['tip','Tips'],IMPORTANT:['important','Penting'],WARNING:['warning','Perhatian'],CAUTION:['danger','Hati-hati']};
function post(html){
  const t=document.createElement('template');t.innerHTML=html;
  t.content.querySelectorAll('blockquote').forEach(bq=>{const p=bq.firstElementChild;if(!p||p.tagName!=='P')return;
    const m=p.innerHTML.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(<br>)?\s*/i);if(!m)return;
    const a=ALERT[m[1].toUpperCase()];p.innerHTML=p.innerHTML.slice(m[0].length);if(!p.innerHTML.trim())p.remove();
    const d=document.createElement('div');d.className='md-box '+a[0];d.innerHTML='<div class="md-box-t">'+a[1]+'</div>'+bq.innerHTML;bq.replaceWith(d)});
  t.content.querySelectorAll('table').forEach(tb=>{if(tb.parentElement&&tb.parentElement.classList.contains('tbl'))return;const w=document.createElement('div');w.className='tbl';tb.replaceWith(w);w.appendChild(tb)});
  return t.innerHTML}
function clean(html){return window.DOMPurify?DOMPurify.sanitize(html,{ADD_TAGS:['eq','eqn','section','details','summary'],ADD_ATTR:['target','checked','data-src','open'],FORBID_TAGS:['script','iframe','object','embed','form','style'],FORBID_ATTR:['onerror','onload','onclick']}):html}
function render(src){return clean(post(md.render(String(src||''))))}

/* ---------- HTML → Markdown ---------- */
const td=new TurndownService({headingStyle:'atx',bulletListMarker:'-',codeBlockStyle:'fenced',emDelimiter:'*',strongDelimiter:'**',hr:'---',br:'  '});
td.use(turndownPluginGfm.gfm);
td.escape=s=>s; // simpan Markdown yang diketik apa adanya
const texOf=n=>{const a=n.querySelector('annotation');return a?a.textContent.trim():n.textContent.trim()};
td.addRule('steps',{filter:n=>n.nodeName==='OL'&&n.classList.contains('steps'),replacement:(c,n)=>'\n\n'+n.outerHTML+'\n\n'});
td.addRule('mathBlock',{filter:n=>n.nodeName==='SECTION'&&n.querySelector('eqn'),replacement:(c,n)=>'\n\n$$'+texOf(n)+'$$\n\n'});
td.addRule('mathInline',{filter:n=>n.nodeName==='EQ'||(n.nodeName==='EQN'&&!(n.parentNode&&n.parentNode.nodeName==='SECTION')),replacement:(c,n)=>'$'+texOf(n)+'$'});
td.addRule('mermaid',{filter:n=>n.nodeName==='PRE'&&n.classList.contains('mermaid'),replacement:(c,n)=>'\n\n```mermaid\n'+(n.getAttribute('data-src')||n.textContent).replace(/\n$/,'')+'\n```\n\n'});
td.addRule('oldCheck',{filter:n=>n.nodeName==='DIV'&&n.classList.contains('ck'),replacement:(c,n)=>{const i=n.querySelector('input');return '\n- ['+(i&&i.checked||i&&i.hasAttribute('checked')?'x':' ')+'] '+n.textContent.trim()+'\n'}});
td.addRule('mark',{filter:'mark',replacement:c=>'=='+c+'=='});
td.addRule('ins',{filter:['ins','u'],replacement:c=>'++'+c+'++'});
td.addRule('sub',{filter:'sub',replacement:c=>'~'+c+'~'});
td.addRule('sup',{filter:n=>n.nodeName==='SUP'&&!n.classList.contains('footnote-ref'),replacement:c=>'^'+c+'^'});
td.addRule('box',{filter:n=>(n.nodeName==='DIV'&&n.classList.contains('md-box'))||(n.nodeName==='DETAILS'&&n.classList.contains('md-box')),replacement:(c,n)=>{
  const kind=[...n.classList].find(k=>k!=='md-box')||'info';const tt=n.querySelector('.md-box-t,summary');const title=tt?tt.textContent.trim():'';
  const body=td.turndown([...n.childNodes].filter(x=>x!==tt).map(x=>x.outerHTML||x.textContent||'').join(''));
  const map={note:'NOTE',tip:'TIP',important:'IMPORTANT',warning:'WARNING',danger:'CAUTION'};
  if(map[kind]&&!['Info','Detail'].includes(title)&&(!title||Object.values(ALERT).some(a=>a[1]===title)))return '\n\n> [!'+map[kind]+']\n'+body.split('\n').map(l=>'> '+l).join('\n')+'\n\n';
  return '\n\n::: '+kind+(title&&title!==BOX[kind]?' '+title:'')+'\n'+body+'\n:::\n\n'}});
td.addRule('tblwrap',{filter:n=>n.nodeName==='DIV'&&n.classList.contains('tbl'),replacement:c=>'\n\n'+c+'\n\n'});
td.keep(n=>(n.nodeName==='SPAN'&&n.getAttribute('style'))||n.nodeName==='FONT'||n.nodeName==='KBD'||n.nodeName==='ABBR'||n.nodeName==='DL');
td.keep(n=>(n.nodeName==='SECTION'&&n.classList.contains('footnotes'))||(n.nodeName==='SUP'&&n.classList.contains('footnote-ref'))||n.nodeName==='DETAILS');
function toMd(html){return td.turndown(String(html||'')).replace(/^(\s*)([-*+]|\d+\.) {2,}/gm,'$1$2 ').replace(/\n{3,}/g,'\n\n').trim()}

/* ---------- merapikan Markdown ---------- */
const LIST=/^(\s*)([-*+]|\d+\.)\s+/;
function tidyMd(src){
  const lines=String(src||'').replace(/\r\n?/g,'\n').replace(/ /g,' ').split('\n');
  let out=[],fence=false,math=false;
  for(let i=0;i<lines.length;i++){let l=lines[i];
    if(/^\s*(```|~~~)/.test(l)){fence=!fence;out.push(l.trimEnd());continue}
    if(fence){out.push(l);continue}
    if(/^\s*\$\$\s*$/.test(l)){math=!math;out.push(l.trim());continue}
    if(math){out.push(l);continue}
    l=l.replace(/\s+$/,'');
    if(/^\s*</.test(l)){out.push(l);continue} // HTML mentah
    l=l.replace(/^(\s*)[•●▪◦·]\s*/,'$1- ').replace(/^(\s*)[*+]\s+(?!\*)/,'$1- ')
       .replace(/^(\s*)(\d+)[)]\s+/,'$1$2. ').replace(/^(#{1,6})([^#\s])/,'$1 $2')
       .replace(/^(\s*)(?:- ?)?\[\s?\]\s*/,'$1- [ ] ').replace(/^(\s*)(?:- ?)?\[[xX]\]\s*/,'$1- [x] ');
    if(!/`/.test(l)&&!/^\s*\|/.test(l)){
      const lead=l.match(/^\s*/)[0];l=lead+l.slice(lead.length).replace(/ {2,}/g,' ').replace(/ +([,.;:!?])(?=\s|$)/g,'$1').replace(/(\S) +,(?=\S)/g,'$1, ');
      l=l.replace(/^(\s*(?:>\s*)*(?:#{1,6} |- \[[ x]\] |- |\d+\. )?)([a-zà-ÿ])/,(m,a,b)=>/https?:|www\./.test(l.slice(a.length,a.length+8))?m:a+b.toUpperCase());
    }
    out.push(l)}
  // "Judul:" pendek tepat sebelum daftar → judul bagian
  for(let i=0;i<out.length;i++){const l=out[i];
    if(/^[^\s#>|<\-*\d][^:]{1,40}:$/.test(l)&&!LIST.test(l)){let j=i+1;while(j<out.length&&!out[j].trim())j++;
      if(j<out.length&&LIST.test(out[j])&&(i===0||!out[i-1].trim()))out[i]='### '+l.slice(0,-1)}}
  // hapus baris kosong di antara butir daftar / baris tabel yang berurutan
  const isRow=l=>LIST.test(l)?'list':/^\s*\|.*\|\s*$/.test(l)?'tbl':'';
  const res=[];
  for(let i=0;i<out.length;i++){const l=out[i];
    if(!l.trim()){let j=i+1;while(j<out.length&&!out[j].trim())j++;const prev=res.length?res[res.length-1]:'';
      if(prev&&j<out.length&&isRow(prev)&&isRow(prev)===isRow(out[j]))continue;
      if(res.length&&!res[res.length-1].trim())continue;res.push('');continue}
    const prev=res.length?res[res.length-1]:'';
    const block=/^#{1,6} /.test(l)||/^\s*(```|~~~)/.test(l)||(isRow(l)&&!isRow(prev))||/^(---|\*\*\*)$/.test(l);
    if(block&&prev.trim()&&!/^\s*(```|~~~)/.test(prev))res.push('');
    res.push(l);
    if(/^#{1,6} /.test(l)&&i+1<out.length&&out[i+1].trim())res.push('')}
  return res.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n'}
function tidy(html){return render(tidyMd(toMd(html)))}

/* ---------- diagram mermaid (dimuat saat dibutuhkan) ---------- */
let mp=null;
function loadMermaid(){if(mp)return mp;mp=new Promise((res,rej)=>{const s=document.createElement('script');s.src='lib/mermaid.min.js';s.onload=()=>{mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'default',fontFamily:'Inter, sans-serif'});res()};s.onerror=rej;document.head.appendChild(s)});return mp}
async function diagrams(root){const ns=[...root.querySelectorAll('pre.mermaid:not([data-processed])')];if(!ns.length)return;
  try{await loadMermaid();await mermaid.run({nodes:ns,suppressErrors:true})}catch(e){}}

window.MD={render,toMd,tidyMd,tidy,diagrams};
})();
