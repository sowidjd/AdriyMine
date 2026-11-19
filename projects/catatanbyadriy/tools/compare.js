// Render setiap layar & tempel berdampingan dengan gambar contoh
const {chromium}=require('playwright');const path=require('path');
const OUT=process.argv[2];const WWW=path.resolve(__dirname,'../www/index.html');
(async()=>{
 const b=await chromium.launch();const W=412,DSF=1086/412;
 const p=await b.newPage({viewport:{width:W,height:Math.round((1448-58)/DSF)},deviceScaleFactor:DSF,hasTouch:true});
 p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
 await p.clock.setFixedTime(new Date(2026,10,18,8,26));
 await p.goto('file://'+WWW);await p.waitForTimeout(500);
 const shots=[['dashboard',null],['catatan',null],['editor',"document.querySelector('#catatan .nrow').click()"],['editor2',"document.querySelector('#editor [data-c=edit]').click();document.activeElement.blur()"],['berkas',null],['ai',null],['kalender',null]];
 for(const [n,js] of shots){
   if(!js){await p.evaluate(v=>document.querySelector(`#nav [data-v=${v}]`).click(),n)}
   else{if(n==='editor')await p.evaluate(()=>document.querySelector('#nav [data-v=catatan]').click());await p.evaluate(js)}
   await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/m_${n}.png`});
 }
 await b.close();
})();
