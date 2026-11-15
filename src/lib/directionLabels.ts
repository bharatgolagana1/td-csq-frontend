/* The words for the two sides of an IMPORT_EXPORT cycle, in one place. Every
   screen takes "Import" / "Export" — and the answer mode's "Import & Export" —
   from here, so renaming them (to "Inbound" / "Outbound", say) is a change to
   DIRECTION_LABELS alone. */

export const DIRECTION_LABELS: Readonly<Record<'IMPORT' | 'EXPORT', string>> = { IMPORT: 'Import', EXPORT: 'Export' };

/** The IMPORT_EXPORT answer mode's name ("Import & Export"). */
export const IMPORT_EXPORT_LABEL = `${DIRECTION_LABELS.IMPORT} & ${DIRECTION_LABELS.EXPORT}`;

/** A direction's word inside a sentence ("rated for import"). */
export function directionWord(direction: 'IMPORT' | 'EXPORT'): string {
  return DIRECTION_LABELS[direction].toLowerCase();
}
