import { sha256 } from "../utils";

// Default pre-computed SHA-256 hashes
// '654321' -> 481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5
// '1234'   -> 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
const DEFAULT_ADMIN_HASH = "481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5";
const DEFAULT_VOLUNTEER_HASH = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

export async function verifyEventPin(role: "admin" | "volunteer", enteredPin: string): Promise<boolean> {
  const cleanPin = (enteredPin || "").trim();
  if (role === "admin" && cleanPin.length !== 6) {
    return false;
  }
  if (role === "volunteer" && cleanPin.length !== 4) {
    return false;
  }

  const computedHash = (await sha256(cleanPin)).toLowerCase();

  if (role === "admin") {
    // 1. Check raw PIN env variables if configured
    const rawEnvPin = (process.env.ADMIN_PIN || process.env.EVENT_ADMIN_PIN || "").trim().replace(/^["']|["']$/g, "");
    if (rawEnvPin && cleanPin === rawEnvPin) return true;

    // 2. Check hash env variable (or raw PIN if set into EVENT_ADMIN_PIN_HASH)
    const envHash = (process.env.EVENT_ADMIN_PIN_HASH || "").trim().replace(/^["']|["']$/g, "");
    if (envHash) {
      if (envHash.length === 6 && cleanPin === envHash) return true;
      if (computedHash === envHash.toLowerCase()) return true;
    }

    // 3. Check default demo admin PIN (654321)
    if (computedHash === DEFAULT_ADMIN_HASH.toLowerCase() || cleanPin === "654321") return true;

    return false;
  } else {
    // 1. Check raw PIN env variables if configured
    const rawEnvPin = (process.env.VOLUNTEER_PIN || process.env.EVENT_VOLUNTEER_PIN || "").trim().replace(/^["']|["']$/g, "");
    if (rawEnvPin && cleanPin === rawEnvPin) return true;

    // 2. Check hash env variable (or raw PIN if set into EVENT_VOLUNTEER_PIN_HASH)
    const envHash = (process.env.EVENT_VOLUNTEER_PIN_HASH || "").trim().replace(/^["']|["']$/g, "");
    if (envHash) {
      if (envHash.length === 4 && cleanPin === envHash) return true;
      if (computedHash === envHash.toLowerCase()) return true;
    }

    // 3. Check default demo volunteer PIN (1234)
    if (computedHash === DEFAULT_VOLUNTEER_HASH.toLowerCase() || cleanPin === "1234") return true;

    return false;
  }
}
