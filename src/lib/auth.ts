import { cookies } from "next/headers";
import crypto from "crypto";

export type StaffRole = "ADMIN" | "KITCHEN" | "CASHIER";

const SESSION_COOKIE_NAME = "ph_staff_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "pizza-house-mukalla-secret-key-2026";
const SESSION_MAX_AGE_MS = 14 * 60 * 60 * 1000; // 14 hours (full restaurant double shift)

// Configured PINs
const ROLE_PINS: Record<StaffRole, string> = {
  ADMIN: process.env.ADMIN_PIN || "1024",
  KITCHEN: process.env.KITCHEN_PIN || "2048",
  CASHIER: process.env.CASHIER_PIN || "4096",
};

/**
 * Generates an HMAC signature for a payload.
 */
function signPayload(payload: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");
}

/**
 * Creates a signed session token.
 */
export function createStaffToken(role: StaffRole): string {
  const timestamp = Date.now();
  const payload = `${role}:${timestamp}`;
  const signature = signPayload(payload);
  return `${payload}:${signature}`;
}

/**
 * Verifies a signed session token.
 */
export function verifyStaffToken(
  token: string | undefined | null
): { isValid: boolean; role?: StaffRole } {
  if (!token) return { isValid: false };

  const parts = token.split(":");
  if (parts.length !== 3) return { isValid: false };

  const [roleStr, timestampStr, signature] = parts;
  const role = roleStr as StaffRole;

  if (!["ADMIN", "KITCHEN", "CASHIER"].includes(role)) {
    return { isValid: false };
  }

  const payload = `${roleStr}:${timestampStr}`;
  const expectedSignature = signPayload(payload);

  if (signature !== expectedSignature) {
    return { isValid: false };
  }

  const timestamp = Number(timestampStr);
  if (isNaN(timestamp) || Date.now() - timestamp > SESSION_MAX_AGE_MS) {
    return { isValid: false }; // Expired session
  }

  return { isValid: true, role };
}

/**
 * Verifies if entered PIN matches role.
 * Also allows ADMIN PIN to unlock any role.
 */
export function verifyPinForRole(
  pin: string,
  targetRole: StaffRole
): { success: boolean; role?: StaffRole } {
  const trimmed = pin.trim();

  // Admin PIN unlocks everything
  if (trimmed === ROLE_PINS.ADMIN) {
    return { success: true, role: "ADMIN" };
  }

  if (trimmed === ROLE_PINS[targetRole]) {
    return { success: true, role: targetRole };
  }

  return { success: false };
}

/**
 * Reads staff session from cookies in Server Components or Server Actions.
 */
export function getStaffSession(): { isAuthenticated: boolean; role?: StaffRole } {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const result = verifyStaffToken(token);
    return {
      isAuthenticated: result.isValid,
      role: result.role,
    };
  } catch {
    return { isAuthenticated: false };
  }
}

/**
 * Sets staff session cookie.
 */
export function setStaffSessionCookie(role: StaffRole): void {
  const token = createStaffToken(role);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
}

/**
 * Clears staff session cookie.
 */
export function clearStaffSessionCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Authoritative guard helper for Server Actions.
 * Returns true if the user has one of the required roles.
 */
export function isAuthorizedStaff(
  allowedRoles: StaffRole[] = ["ADMIN", "KITCHEN", "CASHIER"]
): boolean {
  const session = getStaffSession();
  if (!session.isAuthenticated || !session.role) {
    return false;
  }
  // ADMIN has full authority over all staff actions
  if (session.role === "ADMIN") {
    return true;
  }
  return allowedRoles.includes(session.role);
}
