import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes university roll numbers consistently:
 * Trims whitespace, collapses internal multi-spaces, and converts to uppercase.
 * e.g., "  2026cse001  " -> "2026CSE001"
 */
export function normalizeRollNumber(val: string): string {
  if (!val) return "";
  return val.trim().replace(/\s+/g, "").toUpperCase();
}

/**
 * Sanitizes untrusted strings before writing to Excel cells
 * to prevent Formula Injection (CSV/Excel Formula Injection vulnerability).
 * Prefixes strings beginning with =, +, -, @, \t, \r with a single apostrophe.
 */
export function sanitizeExcelString(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Deterministic SHA-256 calculation for client/server PIN verification
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
