/* CSS tanpa @layer untuk Safari sebelum 15.4 (lihat src/lib/peramban-lama.ts dan /api/css-lama). */
/** `@layer` dibuka: blok `@layer x{...}` diganti isinya, pernyataan `@layer a,b;` dibuang. */
export function bukaLayer(css: string): string {
  let hasil = "";
  let i = 0;
  const n = css.length;
  const tutupan: boolean[] = []; // per kurung kurawal terbuka: true bila kurung itu milik @layer
  while (i < n) {
    const c = css[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && css[j] !== c) j += css[j] === "\\" ? 2 : 1;
      hasil += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === "/" && css[i + 1] === "*") {
      const j = css.indexOf("*/", i + 2);
      i = j < 0 ? n : j + 2;
      continue;
    }
    if (c === "@" && css.startsWith("@layer", i) && !/[\w-]/.test(css[i + 6] ?? "")) {
      let j = i + 6;
      while (j < n && css[j] !== "{" && css[j] !== ";") j++;
      if (css[j] === ";") { i = j + 1; continue; }
      tutupan.push(true);
      i = j + 1;
      continue;
    }
    if (c === "{") tutupan.push(false);
    if (c === "}") {
      if (tutupan.pop()) { i++; continue; }
    }
    hasil += c;
    i++;
  }
  return hasil;
}
