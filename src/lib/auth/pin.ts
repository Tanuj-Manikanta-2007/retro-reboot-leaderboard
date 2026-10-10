import { sha256 } from "../utils";

// Default pre-computed SHA-256 hashes
// '654321' -> 481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5
// '1234'   -> 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
const DEFAULT_ADMIN_HASH = "481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5";
const DEFAULT_VOLUNTEER_HASH = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

export async function verifyEventPin(role: "admin" | "volunteer", enteredPin: string): Promise<boolean> {
  if (!enteredPin || (role === "admin" && enteredPin.length !== 6) || (role === "volunteer" && enteredPin.length !== 4)) {
    return false;
  }

  const computedHash = await sha256(enteredPin.trim());
  const expectedHash =
    role === "admin"
      ? process.env.EVENT_ADMIN_PIN_HASH || DEFAULT_ADMIN_HASH
      : process.env.EVENT_VOLUNTEER_PIN_HASH || DEFAULT_VOLUNTEER_HASH;

  return computedHash.toLowerCase() === expectedHash.toLowerCase();
}
