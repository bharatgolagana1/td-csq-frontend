/**
 * A short reference a person can read out: the prefix and the last six
 * characters of the record's id (an ObjectId's counter), "REG-3F9A2C". The
 * confirmation screen and ACFI's view of the record show the same one, so the
 * two can be matched without a raw 24-character id in the copy.
 */
export function shortReference(prefix: string, id: string): string {
  return `${prefix}-${id.slice(-6).toUpperCase()}`;
}

/** "REG-3F9A2C" for a registration request. */
export function registrationReference(id: string): string {
  return shortReference('REG', id);
}
