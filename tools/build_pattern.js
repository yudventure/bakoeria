// PNG dari pola (motif, ikon, cap 1200 px; bidang 2400 x 1600 untuk tiap pola berlatar, pita 2400 px, medali dan motif 1200 px.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const dir=path.resolve(__dirname,'../brand/pattern');const out=path.join(dir,'png');
(async()=>{fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);const b=await chromium.launch();const p=await b.newPage();
const uri=f=>`data:image/svg+xml;base64,${fs.readFileSync(path.join(dir,f)).toString('base64')}`;
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.svg'))){
 const svg=fs.readFileSync(path.join(dir,f),'utf8');const [,w,h]=svg.match(/width="(\d+)" height="(\d+)"/).map(Number);let W,H,html;
 if(f.includes('-pola-')){W=2400;H=1600;html=`<div style="width:${W}px;height:${H}px;background:url(${uri(f)}) 0 0/${Math.round(w*.62)}px ${Math.round(h*.62)}px"></div>`;}
 else if(f.includes('-pita-')){W=2400;H=Math.round(h*.55);html=`<div style="width:${W}px;height:${H}px;background:url(${uri(f)}) 0 0/${Math.round(w*.55)}px ${H}px repeat-x"></div>`;}
 else{W=1200;H=Math.round(1200*h/w);html=`<img src="${uri(f)}" style="width:${W}px;height:${H}px;display:block">`;}
 await p.setViewportSize({width:W,height:H});await p.setContent(`<body style="margin:0;background:transparent">${html}</body>`);await p.waitForTimeout(120);
 await p.screenshot({path:path.join(out,f.replace('.svg','.png')),omitBackground:true});}
console.log(fs.readdirSync(out).length,'png');await b.close()})()
