import { createClient } from "@supabase/supabase-js";
import { makeCertificate } from "../lib/makeCertificate.mjs";
import fs from "node:fs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OUT_DIR = "out-pdf";
const PAGE = 500;
fs.mkdirSync(OUT_DIR, { recursive: true });

let from = 0;
let total = 0;
while (true) {
  const { data, error } = await supabase
    .from("certificates")
    .select("cert_code, full_name, event_name, role")
    .order("id")
    .range(from, from + PAGE - 1);

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }
  if (data.length === 0) break;

  for (const r of data) {
    const bytes = await makeCertificate({
      name: r.full_name,
      code: r.cert_code,
      event: r.event_name,
      role: r.role,
    });
    fs.writeFileSync(`${OUT_DIR}/${r.cert_code}.pdf`, bytes);
    total++;
  }
  from += PAGE;
}

console.log(`Done: ${total} certificates in ${OUT_DIR}`);