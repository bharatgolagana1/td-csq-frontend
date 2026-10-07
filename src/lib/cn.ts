/** Join class names; anything that is not a non-empty string is dropped (so `error && styles.x` is safe). */
export function cn(...parts: unknown[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
}
