import { describe, it, expect } from "vitest";
import { validateReceiptDataUri, MAX_RECEIPT_BYTES } from "@/lib/receipt";

/** Builds a data URI whose payload starts with the given magic bytes. */
function dataUri(mime: string, magic: number[], padTo = 32): string {
  const bytes = Buffer.concat([
    Buffer.from(magic),
    Buffer.alloc(Math.max(0, padTo - magic.length), 0x00),
  ]);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "ascii"),
  Buffer.alloc(4, 0x00),
  Buffer.from("WEBP", "ascii"),
  Buffer.alloc(16, 0x00),
]);

describe("validateReceiptDataUri — accepts real images", () => {
  it("accepts a JPEG", () => {
    const result = validateReceiptDataUri(dataUri("image/jpeg", JPEG_MAGIC));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.fileSize).toBe(32);
      expect(result.fileName).toMatch(/^receipt-\d+-[a-z0-9]+\.jpg$/);
    }
  });

  it("accepts a PNG", () => {
    const result = validateReceiptDataUri(dataUri("image/png", PNG_MAGIC));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mimeType).toBe("image/png");
  });

  it("accepts a WEBP", () => {
    const result = validateReceiptDataUri(
      `data:image/webp;base64,${WEBP.toString("base64")}`
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mimeType).toBe("image/webp");
  });

  it("generates a filename rather than trusting the client", () => {
    const a = validateReceiptDataUri(dataUri("image/png", PNG_MAGIC));
    const b = validateReceiptDataUri(dataUri("image/png", PNG_MAGIC));
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      // No path separators or traversal sequences can reach the filename.
      expect(a.fileName).not.toMatch(/[/\\]|\.\./);
      expect(a.fileName).not.toBe(b.fileName);
    }
  });

  it("records the measured size, not a hardcoded one", () => {
    // The old code always stored 102400 regardless of the real payload.
    const small = validateReceiptDataUri(dataUri("image/jpeg", JPEG_MAGIC, 16));
    const large = validateReceiptDataUri(dataUri("image/jpeg", JPEG_MAGIC, 512));
    expect(small.ok && small.fileSize).toBe(16);
    expect(large.ok && large.fileSize).toBe(512);
  });
});

describe("validateReceiptDataUri — refusals", () => {
  it("refuses a missing or empty value", () => {
    expect(validateReceiptDataUri(undefined)).toMatchObject({ reason: "MALFORMED" });
    expect(validateReceiptDataUri(null)).toMatchObject({ reason: "MALFORMED" });
    expect(validateReceiptDataUri("")).toMatchObject({ reason: "MALFORMED" });
  });

  it("refuses anything that is not a base64 data URI", () => {
    expect(validateReceiptDataUri("https://example.com/a.png")).toMatchObject({
      reason: "MALFORMED",
    });
    expect(validateReceiptDataUri("data:image/png,notbase64")).toMatchObject({
      reason: "MALFORMED",
    });
  });

  it("refuses a disallowed declared type", () => {
    // SVG can carry script, so it must never be accepted as a receipt.
    expect(
      validateReceiptDataUri(`data:image/svg+xml;base64,${Buffer.from("<svg/>").toString("base64")}`)
    ).toMatchObject({ reason: "UNSUPPORTED_TYPE" });

    expect(
      validateReceiptDataUri(`data:application/pdf;base64,${Buffer.from("%PDF-").toString("base64")}`)
    ).toMatchObject({ reason: "UNSUPPORTED_TYPE" });
  });

  it("refuses a file whose bytes do not match its declared type", () => {
    // The central attack: a script or executable relabelled as an image.
    const disguised = `data:image/png;base64,${Buffer.from(
      "MZ\u0090\u0000\u0003"
    ).toString("base64")}`;
    expect(validateReceiptDataUri(disguised)).toMatchObject({
      reason: "UNSUPPORTED_TYPE",
    });

    // A genuine JPEG dressed up as a PNG is also refused.
    const mislabelled = dataUri("image/png", JPEG_MAGIC);
    expect(validateReceiptDataUri(mislabelled)).toMatchObject({
      reason: "TYPE_MISMATCH",
    });
  });

  it("refuses a payload over the size limit", () => {
    const huge = Buffer.concat([
      Buffer.from(JPEG_MAGIC),
      Buffer.alloc(MAX_RECEIPT_BYTES + 1, 0x00),
    ]);
    expect(
      validateReceiptDataUri(`data:image/jpeg;base64,${huge.toString("base64")}`)
    ).toMatchObject({ reason: "TOO_LARGE" });
  });

  it("refuses an empty payload", () => {
    expect(validateReceiptDataUri("data:image/png;base64,")).toMatchObject({
      reason: "MALFORMED",
    });
  });
});
