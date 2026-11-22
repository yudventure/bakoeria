// PNG transparan untuk tiap SVG di brand/logo (lambang 1200 px, horizontal 2400 px, lainnya 2000 px lebar).
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const dir=path.resolve(__dirname,'../brand/logo');const out=path.join(dir,'png');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:1});
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.svg'))){
 const svg=fs.readFileSync(path.join(dir,f));const vb=svg.toString().match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
 const W=f.includes('mark')?1200:f.includes('horizontal')?2400:2000,H=Math.round(W*vb[3]/vb[2]);
 await p.setViewportSize({width:W,height:H});
 await p.setContent(`<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${svg.toString('base64')}" style="width:${W}px;height:${H}px;display:block">`);
 await p.waitForTimeout(120);await p.screenshot({path:path.join(out,f.replace('.svg','.png')),omitBackground:true});}
console.log(fs.readdirSync(out).length,'png');await b.close()})()
