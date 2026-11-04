import { describe, it } from "node:test";
import assert from "node:assert/strict";

function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateNewsletterSubmission(
  email: unknown,
  consent: unknown,
): { valid: boolean; error?: string } {
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: "A valid email address is required." };
  }
  if (email.trim().length > 254) {
    return { valid: false, error: "Email address exceeds maximum length." };
  }
  if (consent !== true) {
    return {
      valid: false,
      error: "Please confirm that you agree to receive occasional newsletters and updates.",
    };
  }
  return { valid: true };
}

describe("Newsletter Normalization & Explicit Consent Rules", () => {
  it("normalizes mixed case emails to lowercase", () => {
    assert.equal(normalizeEmail("TestUser@Example.COM"), "testuser@example.com");
  });

  it("trims surrounding whitespace from emails", () => {
    assert.equal(normalizeEmail("  hello@community.org \t\n"), "hello@community.org");
  });

  it("rejects submission when consent is false or missing", () => {
    const resWithoutConsent = validateNewsletterSubmission("user@example.com", false);
    assert.equal(resWithoutConsent.valid, false);
    assert.ok(resWithoutConsent.error?.includes("agree"));

    const resWithConsent = validateNewsletterSubmission("user@example.com", true);
    assert.equal(resWithConsent.valid, true);
  });

  it("rejects invalid emails even if consent is true", () => {
    const res = validateNewsletterSubmission("invalid-email", true);
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes("valid email"));
  });

  it("rejects emails exceeding 254 characters", () => {
    const longEmail = "a".repeat(250) + "@domain.com";
    const res = validateNewsletterSubmission(longEmail, true);
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes("maximum length"));
  });
});
