/**
 * Dukungan peramban lama, terutama Safari iOS 15 ke bawah (iPhone 6s, 7, SE generasi
 * pertama). Next.js dan Tailwind 4 menargetkan Safari 16.4 ke atas.
 *
 * Skrip ini disisipkan paling awal di <head>, sebelum skrip Next berjalan:
 * 1. Fungsi yang belum ada di Safari 15.3 ke bawah (structuredClone, .at(), Object.hasOwn,
 *    findLast) diisi versi sederhana. Tanpa itu router Next berhenti dan halaman mati.
 * 2. Safari tanpa @layer (sebelum 15.4) mengabaikan semua gaya Tailwind. Untuknya dimuat
 *    salinan CSS tanpa @layer (`*.lama.css`, dibuat scripts/package.mjs).
 * 3. Kelas `peramban-lama` di <html> untuk iOS 15 ke bawah, supaya komponen berat
 *    (pemutar TikTok dan YouTube) tidak dimuat di ponsel bermemori kecil.
 * Peramban modern hanya menjalankan beberapa pemeriksaan singkat.
 */
export const SKRIP_PERAMBAN_LAMA = `(function(){try{
var d=function(o,n,f){if(!o[n])Object.defineProperty(o,n,{value:f,writable:true,configurable:true})};
var at=function(i){i=Math.trunc(i)||0;if(i<0)i+=this.length;return i<0||i>=this.length?undefined:this[i]};
d(Array.prototype,"at",at);d(String.prototype,"at",at);
d(Array.prototype,"findLast",function(f,t){for(var i=this.length-1;i>=0;i--)if(f.call(t,this[i],i,this))return this[i]});
d(Array.prototype,"findLastIndex",function(f,t){for(var i=this.length-1;i>=0;i--)if(f.call(t,this[i],i,this))return i;return -1});
d(Object,"hasOwn",function(o,k){return Object.prototype.hasOwnProperty.call(o,k)});
d(window,"structuredClone",function(v){return v===undefined?v:JSON.parse(JSON.stringify(v))});
var ua=navigator.userAgent,h=document.documentElement;
var ios=/(iPhone|iPad|iPod)[^)]* OS (\\d+)_/.exec(ua);
var safari=/AppleWebKit/.test(ua)&&!/Android|Chrome\\//.test(ua);
if(ios&&+ios[2]<16)h.classList.add("peramban-lama");
var lapis=!!(window.CSS&&CSS.supports&&CSS.supports("selector(:has(a))"));
if(safari&&!lapis){h.classList.add("peramban-lama");
var muat=function(){var l=document.querySelectorAll('link[rel="stylesheet"][href*="/_next/static/css/"]');
for(var i=0;i<l.length;i++){var a=l[i].getAttribute("href");if(a.indexOf(".lama.css")>-1||l[i].getAttribute("data-lama"))continue;l[i].setAttribute("data-lama","1");
var b=document.createElement("link");b.rel="stylesheet";b.href=a.replace(/\\.css(\\?|$)/,".lama.css$1");b.setAttribute("data-lama","1");document.head.appendChild(b)}};
muat();document.addEventListener("DOMContentLoaded",muat);}
}catch(e){}})();`;
