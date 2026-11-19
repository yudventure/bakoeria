const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file:///tmp/fx/pdf/guidelines.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
await p.pdf({path:'brand/Bakoeria-Brand-Guidelines.pdf',width:'297mm',height:'210mm',printBackground:true,preferCSSPageSize:true});await b.close()})()
