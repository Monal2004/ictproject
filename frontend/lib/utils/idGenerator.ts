/**
 * Generates a human-friendly unique complaint reference number
 * Example format: CV-2026-8492
 */
export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  // Generate a random 4-digit numeric string (1000 - 9999)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CV-${year}-${randomSuffix}`;
}

/**
 * Generates a standard UUID v4 string for internal entity IDs
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback if crypto.randomUUID is not supported in environment
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
