// node tools/render.js <input.html|svg> <out.png> <width> <height> [transparent=1] [scale=1]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const [,,i,o,w,h,tr,sc]=process.argv;const b=await chromium.launch();
const p=await b.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:+(sc||1)});
await p.goto('file://'+path.resolve(i));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
await p.screenshot({path:o,omitBackground:tr==='1'});await b.close()})()
