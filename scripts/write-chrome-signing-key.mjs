import { writeFileSync } from "node:fs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node scripts/write-chrome-signing-key.mjs <pem-path>");
  process.exit(1);
}

let raw = process.env.PRIVATE_CHROME_PRIVATE_SIGNING_KEY ?? "";
raw = raw.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
  raw = raw.slice(1, -1);
}
if (!raw.includes("-----BEGIN") && raw.includes("\\n")) {
  raw = raw.replaceAll("\\n", "\n");
}
if (!/^-----BEGIN [\w ]*PRIVATE KEY-----/m.test(raw)) {
  console.error("Signing key is not a PEM private key");
  process.exit(1);
}

writeFileSync(out, raw.endsWith("\n") ? raw : `${raw}\n`);
