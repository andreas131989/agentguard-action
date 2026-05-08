import { createPublicKey, verify } from "node:crypto";
import { AGENTGUARD_LICENSE_PUBLIC_KEY, LICENSE_KEY_PREFIX } from "./constants.js";
import type { LicensePayload, LicenseValidationResult } from "./types.js";

export function validateLicenseKey(
  key: string,
  publicKeyPem: string = AGENTGUARD_LICENSE_PUBLIC_KEY
): LicenseValidationResult {
  const trimmed = key.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: "No license key provided." };
  }

  if (!trimmed.startsWith(LICENSE_KEY_PREFIX)) {
    return { valid: false, reason: "Invalid license key format." };
  }

  const withoutPrefix = trimmed.slice(LICENSE_KEY_PREFIX.length);
  const dotIndex = withoutPrefix.indexOf(".");

  if (dotIndex === -1) {
    return { valid: false, reason: "Invalid license key format." };
  }

  const payloadB64 = withoutPrefix.slice(0, dotIndex);
  const sigB64 = withoutPrefix.slice(dotIndex + 1);

  let payload: LicensePayload;

  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    payload = JSON.parse(json) as LicensePayload;
  } catch {
    return { valid: false, reason: "Invalid license key: malformed payload." };
  }

  const nowSec = Math.floor(Date.now() / 1000);

  if (typeof payload.exp === "number" && payload.exp < nowSec) {
    return { valid: false, reason: "License key has expired." };
  }

  try {
    const publicKey = createPublicKey({ key: publicKeyPem, format: "pem", type: "spki" });
    const data = Buffer.from(payloadB64, "utf8");
    const sig = Buffer.from(sigB64, "base64url");

    if (!verify(null, data, publicKey, sig)) {
      return { valid: false, reason: "Invalid license key: signature verification failed." };
    }
  } catch {
    return { valid: false, reason: "Invalid license key: could not verify signature." };
  }

  return { valid: true, payload };
}
