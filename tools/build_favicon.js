// Merender PNG favicon, ikon aplikasi, dan avatar dari SVG buatan tools/build_favicon.py, lalu favicon.ico (16, 32, 48).
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const dir=path.resolve(__dirname,'../brand/favicon');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
for(const [f,s,src] of [['favicon-16.png',16,'icon.svg'],['favicon-32.png',32,'icon.svg'],['favicon-48.png',48,'icon.svg'],['favicon-192.png',192,'icon-maskable.svg'],['favicon-512.png',512,'icon-maskable.svg'],['apple-touch-icon.png',180,'icon-maskable.svg'],['avatar-1080.png',1080,'avatar.svg']]){
 await p.setViewportSize({width:s,height:s});await p.setContent(`<body style="margin:0"><img src="data:image/svg+xml;base64,${fs.readFileSync(path.join(dir,src)).toString("base64")}" style="width:${s}px;height:${s}px;display:block">`);await p.waitForTimeout(80);
 await p.screenshot({path:path.join(dir,f),omitBackground:true});}
await b.close();
// ICO berisi PNG 16, 32, 48
const png=[16,32,48].map(s=>fs.readFileSync(path.join(dir,`favicon-${s}.png`)));
const h=Buffer.alloc(6+16*png.length);h.writeUInt16LE(0,0);h.writeUInt16LE(1,2);h.writeUInt16LE(png.length,4);let off=h.length;
png.forEach((d,i)=>{const s=[16,32,48][i];const e=6+16*i;h.writeUInt8(s,e);h.writeUInt8(s,e+1);h.writeUInt8(0,e+2);h.writeUInt8(0,e+3);h.writeUInt16LE(1,e+4);h.writeUInt16LE(32,e+6);h.writeUInt32LE(d.length,e+8);h.writeUInt32LE(off,e+12);off+=d.length;});
fs.writeFileSync(path.join(dir,'favicon.ico'),Buffer.concat([h,...png]));for(const s of [16,48])fs.unlinkSync(path.join(dir,`favicon-${s}.png`));console.log('favicon selesai')})()
