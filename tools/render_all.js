// node tools/render_all.js social/jobs.json   -> merender semua template ke PNG
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const jobs=JSON.parse(fs.readFileSync(process.argv[2]));const b=await chromium.launch();const p=await b.newPage();
for(const j of jobs){await p.setViewportSize({width:j.w,height:j.h});await p.goto('file://'+path.resolve(j.src));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(150);
 fs.mkdirSync(path.dirname(j.out),{recursive:true});await p.screenshot({path:j.out});}
console.log(jobs.length,'file');await b.close()})()
