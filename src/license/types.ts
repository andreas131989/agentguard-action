export type LicenseTier = "pro" | "enterprise";

export type LicensePayload = {
  sub: string;
  iat: number;
  exp: number;
  tier: LicenseTier;
};

export type LicenseValidationResult =
  | { valid: true; payload: LicensePayload }
  | { valid: false; reason: string };
