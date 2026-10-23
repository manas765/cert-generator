import { makeCertificate } from "../lib/makeCertificate.mjs";
import fs from "node:fs";

const people = [
  { name: "Test Participant", code: "ABC12345" },
  { name: "A Much Longer Participant Name For Testing", code: "LONG0001" },
  { name: "Ananya", code: "ONE00001" },
  { name: "Aarav K. Sharma-Iyer", code: "DOTS0001" },
  { name: "JOSÉ MARÍA", code: "ACNT0001" },
];

fs.mkdirSync("out-pdf", { recursive: true });
for (const p of people) {
  fs.writeFileSync(`out-pdf/${p.code}.pdf`, await makeCertificate(p));
  console.log("created", p.code);
}