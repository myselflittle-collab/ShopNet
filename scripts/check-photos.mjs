// Checks that every product photo URL loads. Run on a machine with normal internet access: npm run check:photos
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../lib/catalog/photos.ts", import.meta.url), "utf8");
const ids = [...new Set([...src.matchAll(/id: "(photo-[\w-]+)"/g)].map((m) => m[1]))];
let bad = 0;
for (const id of ids) {
  const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&h=500&q=60`;
  try {
    const r = await fetch(url, { method: "GET" });
    const type = r.headers.get("content-type") ?? "";
    const ok = r.ok && type.startsWith("image/");
    if (!ok) bad++;
    console.log(`${ok ? "OK  " : "FAIL"} ${r.status} ${type.padEnd(12)} ${id}`);
  } catch (e) {
    bad++;
    console.log(`FAIL network      ${id} (${e.message})`);
  }
}
console.log(`\n${ids.length - bad}/${ids.length} photos load`);
process.exit(bad ? 1 : 0);
