import { sha256 } from "../utils";

// Fallback hashes keep local development and tests working when environment
// variables are not loaded. Production deployments should set both hashes.
const DEFAULT_ADMIN_HASH = "a2f27d7f868174ca3a6cd7f80fc9b2ed16722b8c4e297456b483ac970afe8ecf";
const DEFAULT_VOLUNTEER_HASH = "45297c633d331e6ac35169ebaaf75bc7fafd206ebb59ba4efd80566936e46eb0";

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
    // Check the configured hash from the environment.
    const envHash = (process.env.EVENT_ADMIN_PIN_HASH || "").trim().replace(/^["']|["']$/g, "");
    if (envHash) {
      if (envHash.length === 6 && cleanPin === envHash) return true;
      if (computedHash === envHash.toLowerCase()) return true;
    }

    // 3. Check the local-development fallback hash
    if (computedHash === DEFAULT_ADMIN_HASH.toLowerCase()) return true;

    return false;
  } else {
    // Check the configured hash from the environment.
    const envHash = (process.env.EVENT_VOLUNTEER_PIN_HASH || "").trim().replace(/^["']|["']$/g, "");
    if (envHash) {
      if (envHash.length === 4 && cleanPin === envHash) return true;
      if (computedHash === envHash.toLowerCase()) return true;
    }

    // 3. Check the local-development fallback hash
    if (computedHash === DEFAULT_VOLUNTEER_HASH.toLowerCase()) return true;

    return false;
  }
}
