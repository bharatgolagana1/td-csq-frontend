/**
 * CSV for people who will open the file in Excel, which is everyone here.
 *
 * Two things are handled rather than trusted: Excel on Windows guesses the
 * encoding unless the file opens with a byte order mark, and it runs a cell
 * beginning =, +, - or @ as a formula. Assessor free text lands in these files,
 * so both are dealt with at the point the cell is written.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number | null>>,
): string {
  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // revoking in the same tick cancels the download in some browsers
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
