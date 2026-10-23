import fs from "node:fs";
import { makeCertificate } from "../lib/makeCertificate.mjs";

const raw = fs
  .readFileSync(new URL("../assets/tricky-names.txt", import.meta.url), "utf8")
  .replace(/^\uFEFF/, "");
const names = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

const outDir = new URL("../out-tricky/", import.meta.url);
fs.mkdirSync(outDir, { recursive: true });

let n = 0;
for (const name of names) {
  n++;
  const code = "TRICKY" + String(n).padStart(2, "0");
  try {
    const bytes = await makeCertificate({ name, code, event: "Figment", role: "Participant" });
    fs.writeFileSync(new URL(`${code}.pdf`, outDir), bytes);
    console.log(`ok    ${code}  ${name}`);
  } catch (e) {
    console.log(`FAIL  ${code}  ${name}  ->  ${e.message}`);
  }
}
console.log("\nDone. Open the out-tricky folder.");
