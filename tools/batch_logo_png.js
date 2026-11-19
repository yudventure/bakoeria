const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const dir='brand/logo';const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:1});
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.svg'))){
 const svg=fs.readFileSync(path.join(dir,f),'utf8');const vb=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
 const target=f.includes('mark')?1200:f.includes('horizontal')?2400:2000; const W=target,H=Math.round(target*vb[3]/vb[2]);
 await p.setViewportSize({width:W,height:H});
 await p.setContent(`<body style="margin:0;background:transparent"><img src="file://${path.resolve(dir,f)}" style="width:${W}px;height:${H}px;display:block">`);
 await p.waitForTimeout(150);
 await p.screenshot({path:path.join(dir,'png',f.replace('.svg','.png')),omitBackground:true});}
await b.close()})()
