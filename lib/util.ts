/** Shared utility functions. */

/** Generates a compact unique session ID (16 random bytes, base64url-encoded, 22 chars). */
export function generateId(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString(
    "base64url",
  );
}

/**
 * Returns the UTF-8 byte length of string or Buffer data.
 * For strings, uses Buffer.byteLength so non-ASCII characters (Cyrillic, emoji)
 * are counted accurately rather than as UTF-16 code units.
 */
export function byteSize(data: string | Buffer): number {
  return typeof data === "string" ? Buffer.byteLength(data) : data.byteLength;
}
