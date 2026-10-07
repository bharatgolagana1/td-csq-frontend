import Papa from 'papaparse';
import { z } from 'zod';

import { type AirportImportError, type Region, REGIONS } from '@/api/airports.types';

/*
 * Client-side mirror of the server's CSV contract (airports.csv.ts) so the
 * import drawer can preview rows and errors before `POST /airports/import`.
 * The server re-validates; this only decides what the preview shows.
 */

export const CSV_COLUMNS: { key: string; required: boolean; help: string }[] = [
  { key: 'iata', required: true, help: '3-letter code; the key on re-import' },
  { key: 'icao', required: false, help: '4-character code' },
  { key: 'name', required: true, help: 'Airport name' },
  { key: 'city', required: true, help: '' },
  { key: 'state', required: true, help: 'State or union territory' },
  { key: 'region', required: false, help: 'North, South, East, West or North-East; derived from the state when blank' },
  { key: 'lat', required: true, help: 'Decimal degrees' },
  { key: 'lng', required: true, help: 'Decimal degrees' },
  { key: 'active', required: false, help: 'true / false (default false)' },
];

export const TEMPLATE_FILE_NAME = 'airports-template.csv';

export const TEMPLATE_CSV = `${CSV_COLUMNS.map((c) => c.key).join(',')}\nDEL,VIDP,Indira Gandhi International Airport,New Delhi,Delhi,North,28.5562,77.1000,true\n`;

const STATE_REGION: Record<string, Region> = {
  'Andaman and Nicobar Islands': 'East',
  'Andhra Pradesh': 'South',
  'Arunachal Pradesh': 'North-East',
  Assam: 'North-East',
  Bihar: 'East',
  Chandigarh: 'North',
  Chhattisgarh: 'West',
  'Dadra and Nagar Haveli and Daman and Diu': 'West',
  Delhi: 'North',
  Goa: 'West',
  Gujarat: 'West',
  Haryana: 'North',
  'Himachal Pradesh': 'North',
  'Jammu and Kashmir': 'North',
  Jharkhand: 'East',
  Karnataka: 'South',
  Kerala: 'South',
  Ladakh: 'North',
  Lakshadweep: 'South',
  'Madhya Pradesh': 'West',
  Maharashtra: 'West',
  Manipur: 'North-East',
  Meghalaya: 'North-East',
  Mizoram: 'North-East',
  Nagaland: 'North-East',
  Odisha: 'East',
  Puducherry: 'South',
  Punjab: 'North',
  Rajasthan: 'North',
  Sikkim: 'North-East',
  'Tamil Nadu': 'South',
  Telangana: 'South',
  Tripura: 'North-East',
  'Uttar Pradesh': 'North',
  Uttarakhand: 'North',
  'West Bengal': 'East',
};

export function regionForState(state: string): Region | null {
  return STATE_REGION[state.trim()] ?? null;
}

/** Absent column, empty cell and whitespace all mean "not given". */
const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed === undefined || trimmed === '' ? undefined : trimmed;
  });

const boolText = optionalText
  .transform((value) => value?.toLowerCase())
  .pipe(z.enum(['true', 'false', '1', '0', 'yes', 'no']).optional())
  .transform((value) => (value === undefined ? undefined : value === 'true' || value === '1' || value === 'yes'));

const requiredText = (max: number) => z.string({ error: 'is required' }).trim().min(1, 'is required').max(max, `is longer than ${max} characters`);

const rowSchema = z
  .object({
    iata: z.string({ error: 'is required' }).trim().toUpperCase().regex(/^[A-Z]{3}$/, 'must be a 3-letter IATA code'),
    icao: optionalText.pipe(z.string().regex(/^[A-Z0-9]{4}$/i, 'must be a 4-character ICAO code').toUpperCase().optional()),
    name: requiredText(200),
    city: requiredText(120),
    state: requiredText(120),
    region: optionalText.pipe(z.enum(REGIONS, { error: `must be one of ${REGIONS.join(', ')}` }).optional()),
    lat: z.coerce.number({ error: 'must be a number' }).min(-90, 'must be between -90 and 90').max(90, 'must be between -90 and 90'),
    lng: z.coerce.number({ error: 'must be a number' }).min(-180, 'must be between -180 and 180').max(180, 'must be between -180 and 180'),
    active: boolText,
  })
  .transform((row, ctx) => {
    const region = row.region ?? regionForState(row.state);
    if (region === null) {
      ctx.addIssue({ code: 'custom', path: ['region'], message: `no region known for state "${row.state}"; supply one` });
      return z.NEVER;
    }
    return { ...row, region };
  });

export type AirportCsvRow = z.infer<typeof rowSchema>;

export type ParsedAirportsCsv = {
  rows: AirportCsvRow[];
  errors: AirportImportError[];
  /** Data lines seen (excluding the header and `#` comments). */
  total: number;
};

/** Parses and validates the file the way the server will; row numbers count data lines from 1. */
export function parseAirportsCsv(text: string): ParsedAirportsCsv {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    comments: '#',
    transformHeader: (header) => header.trim().toLowerCase(),
  });
  const rows: AirportCsvRow[] = [];
  const errors: AirportImportError[] = [];
  const seen = new Set<string>();
  parsed.data.forEach((raw, index) => {
    const row = index + 1;
    const result = rowSchema.safeParse(raw);
    if (!result.success) {
      result.error.issues.forEach((issue) => errors.push({ row, field: issue.path.map(String).join('.') || '(row)', message: issue.message }));
      return;
    }
    if (seen.has(result.data.iata)) {
      errors.push({ row, field: 'iata', message: `duplicate IATA code ${result.data.iata} in file` });
      return;
    }
    seen.add(result.data.iata);
    rows.push(result.data);
  });
  parsed.errors.forEach((error) => {
    if (error.row !== undefined) errors.push({ row: error.row + 1, field: '(csv)', message: error.message });
  });
  return { rows, errors, total: parsed.data.length };
}

export function isCsvFile(file: File): boolean {
  return /\.csv$/i.test(file.name) || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === 'text/plain';
}

/** Saves text as a file through a temporary object URL (no-op without a DOM). */
export function saveTextFile(name: string, text: string, type = 'text/csv;charset=utf-8'): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return;
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
