import { describe, expect, it } from "vitest";
import { validateLicenseKey } from "../../src/license/validate.js";

// Separate test key pair — not the production keys.
const TEST_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAhZfFQyciHKS4toBHbTTUbBpSnAIFOC7+OfB2fqZJV80=
-----END PUBLIC KEY-----`;

// Pre-signed with TEST_PRIVATE_KEY, exp=9999999999 (far future)
const VALID_LICENSE_KEY =
  "AG-v1.eyJzdWIiOiJ0ZXN0LWN1c3RvbWVyIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTksInRpZXIiOiJwcm8ifQ.pY8k_OAeCE4jR2Z-iopL_NwgbDkB1vMsANHVf7QUO-NTP6F5akaERN8fcHoJFSQcvoMgvP5xCKUFfWxDegcLBw";

// Pre-signed with TEST_PRIVATE_KEY, exp=1700001000 (January 2024 — expired)
const EXPIRED_LICENSE_KEY =
  "AG-v1.eyJzdWIiOiJ0ZXN0LWN1c3RvbWVyIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDEwMDAsInRpZXIiOiJwcm8ifQ.NlvpafUxSezZ7YOhHEBUYv_52CPABvUA6tH2H04AnY9OM54Ze-HNiy5fkmdU4cY_eSXrx8TEHwQD6mYUO7tYAg";

function validate(key: string) {
  return validateLicenseKey(key, TEST_PUBLIC_KEY);
}

describe("validateLicenseKey", () => {
  it("accepts a valid signed key", () => {
    const result = validate(VALID_LICENSE_KEY);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.sub).toBe("test-customer");
      expect(result.payload.tier).toBe("pro");
    }
  });

  it("rejects an empty key", () => {
    const result = validate("");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("No license key provided.");
  });

  it("rejects a key with the wrong prefix", () => {
    const result = validate("WRONG-v1.abc.def");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("Invalid license key format.");
  });

  it("rejects a key missing the signature segment", () => {
    const result = validate("AG-v1.onlyone");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("Invalid license key format.");
  });

  it("rejects a key with a malformed payload", () => {
    const result = validate("AG-v1.!!!notbase64!!!.somesig");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain("malformed payload");
  });

  it("rejects an expired key", () => {
    const result = validate(EXPIRED_LICENSE_KEY);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("License key has expired.");
  });

  it("rejects a key with a tampered payload", () => {
    // Change the tier to enterprise in the payload, keeping the original signature
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: "test-customer", iat: 1700000000, exp: 9999999999, tier: "enterprise" })
    ).toString("base64url");
    const parts = VALID_LICENSE_KEY.split(".");
    const tampered = `AG-v1.${tamperedPayload}.${parts[parts.length - 1]}`;
    const result = validate(tampered);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain("signature verification failed");
  });

  it("rejects a key with a corrupted signature", () => {
    const parts = VALID_LICENSE_KEY.split(".");
    const corrupt = `${parts[0]}.${parts[1]}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
    const result = validate(corrupt);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/signature/);
  });

  it("trims surrounding whitespace from the key", () => {
    const result = validate(`  ${VALID_LICENSE_KEY}  `);
    expect(result.valid).toBe(true);
  });
});
