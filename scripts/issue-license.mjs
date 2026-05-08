#!/usr/bin/env node
/**
 * AgentGuard license key issuance script.
 *
 * Usage:
 *   node scripts/issue-license.mjs \
 *     --private-key ./agentguard-private.pem \
 *     --customer "acme-corp" \
 *     --tier pro \
 *     --days 365
 *
 * The private key is the Ed25519 PKCS#8 PEM key generated during key-pair setup.
 * Store it securely (e.g. in a secrets manager). Never commit it to source control.
 *
 * Output: a license key string starting with AG-v1. — send this to the customer.
 */

import { createPrivateKey, sign } from "node:crypto";
import { readFile } from "node:fs/promises";

const VALID_TIERS = ["pro", "enterprise"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      args[arg.slice(2)] = argv[i + 1] ?? "";
      i += 1;
    }
  }
  return args;
}

function usage() {
  console.error(
    [
      "Usage: node scripts/issue-license.mjs \\",
      "  --private-key <path-to-pem> \\",
      "  --customer <identifier> \\",
      "  --tier <pro|enterprise> \\",
      "  --days <number>"
    ].join("\n")
  );
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const privateKeyPath = args["private-key"];
  const customer = args["customer"];
  const tier = args["tier"];
  const days = parseInt(args["days"] ?? "", 10);

  if (!privateKeyPath || !customer || !tier || isNaN(days) || days <= 0) {
    usage();
  }

  if (!VALID_TIERS.includes(tier)) {
    console.error(`Invalid tier "${tier}". Must be one of: ${VALID_TIERS.join(", ")}`);
    process.exit(1);
  }

  let privateKeyPem;
  try {
    privateKeyPem = await readFile(privateKeyPath, "utf8");
  } catch (err) {
    console.error(`Failed to read private key at ${privateKeyPath}: ${err.message}`);
    process.exit(1);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + days * 86400;

  const payload = {
    sub: customer,
    iat: nowSec,
    exp: expSec,
    tier
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");

  let sig;
  try {
    const privateKey = createPrivateKey({ key: privateKeyPem, format: "pem", type: "pkcs8" });
    sig = sign(null, Buffer.from(payloadB64, "utf8"), privateKey);
  } catch (err) {
    console.error(`Failed to sign license payload: ${err.message}`);
    process.exit(1);
  }

  const sigB64 = sig.toString("base64url");
  const licenseKey = `AG-v1.${payloadB64}.${sigB64}`;

  console.log(licenseKey);
  console.error(`\nIssued ${tier} license for "${customer}", expires in ${days} days.`);
}

main();
