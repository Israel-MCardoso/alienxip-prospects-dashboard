import type { ValidationResult } from "./types";

export function validateE164Phone(phone: string): ValidationResult {
  const errors: string[] = [];

  if (typeof phone !== "string" || phone.length === 0) {
    errors.push("phone is required");
  }
  if (!/^[1-9]\d{9,14}$/.test(phone)) {
    errors.push("phone must be E.164 digits only, without +, spaces or symbols");
  }
  if (/^(\d)\1+$/.test(phone)) {
    errors.push("phone cannot be a repeated digit placeholder");
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidE164Phone(phone: string) {
  const validation = validateE164Phone(phone);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }
}
