/**
 * Server-side validation of an uploaded payment receipt.
 *
 * The client sends the image as a base64 data URI. Everything the client says
 * about that image — its type, its size, its name — is attacker-controlled, so
 * the type is re-derived from the payload's magic bytes rather than trusted
 * from the `data:` prefix, and the decoded size is measured rather than read
 * from a field.
 *
 * Previously the server stored the string verbatim and hardcoded the metadata
 * to `receipt.jpg` / `image/jpeg` / `102400`, which made the recorded
 * mimeType and fileSize meaningless.
 */

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

const EXTENSION: Record<AllowedMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ReceiptRefusal =
  | "MALFORMED"
  | "UNSUPPORTED_TYPE"
  | "TOO_LARGE"
  | "TYPE_MISMATCH";

export interface ValidReceipt {
  ok: true;
  dataUri: string;
  mimeType: AllowedMime;
  fileSize: number;
  /** Generated, never derived from a client-supplied filename. */
  fileName: string;
}

export interface InvalidReceipt {
  ok: false;
  reason: ReceiptRefusal;
}

/** Identifies an image from its leading bytes. Returns null if unrecognised. */
function sniffMime(bytes: Buffer): AllowedMime | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function validateReceiptDataUri(
  raw: string | undefined | null
): ValidReceipt | InvalidReceipt {
  if (!raw || typeof raw !== "string") return { ok: false, reason: "MALFORMED" };

  const match = /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(raw.trim());
  if (!match) return { ok: false, reason: "MALFORMED" };

  const declaredMime = match[1].toLowerCase();
  const payload = match[2];

  if (!ALLOWED_MIME.includes(declaredMime as AllowedMime)) {
    return { ok: false, reason: "UNSUPPORTED_TYPE" };
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(payload, "base64");
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }
  if (bytes.length === 0) return { ok: false, reason: "MALFORMED" };
  if (bytes.length > MAX_RECEIPT_BYTES) return { ok: false, reason: "TOO_LARGE" };

  // The real test: what the bytes actually are, not what the header claims.
  // This is what stops an executable or SVG being relabelled as image/png.
  const actualMime = sniffMime(bytes);
  if (!actualMime) return { ok: false, reason: "UNSUPPORTED_TYPE" };
  if (actualMime !== declaredMime) return { ok: false, reason: "TYPE_MISMATCH" };

  return {
    ok: true,
    dataUri: raw.trim(),
    mimeType: actualMime,
    fileSize: bytes.length,
    fileName: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${EXTENSION[actualMime]}`,
  };
}
