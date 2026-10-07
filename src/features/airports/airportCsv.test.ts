import { describe, expect, it } from 'vitest';

import { parseAirportsCsv, regionForState, TEMPLATE_CSV } from './airportCsv';

describe('parseAirportsCsv', () => {
  it('accepts the template and derives a missing region from the state', () => {
    const csv = `${TEMPLATE_CSV}bom,,Chhatrapati Shivaji Maharaj International Airport,Mumbai,Maharashtra,,19.0896,72.8656,yes\n`;
    const parsed = parseAirportsCsv(csv);
    expect(parsed.total).toBe(2);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows.map((r) => [r.iata, r.region, r.active])).toEqual([
      ['DEL', 'North', true],
      ['BOM', 'West', true],
    ]);
    expect(parsed.rows[1]?.icao).toBeUndefined();
  });

  it('reports row-numbered problems and skips duplicates and comments', () => {
    const csv = ['iata,icao,name,city,state,region,lat,lng,active', '# comment', 'DEL,VIDP,Delhi,New Delhi,Delhi,,28.5,77.1,true', 'DE,,Bad,City,Delhi,,28.5,77.1,', 'DEL,,Again,New Delhi,Delhi,,28.5,77.1,', 'XYZ,,Nowhere,Town,Atlantis,,1,1,'].join('\n');
    const parsed = parseAirportsCsv(csv);
    expect(parsed.total).toBe(4);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.errors).toEqual([
      { row: 2, field: 'iata', message: 'must be a 3-letter IATA code' },
      { row: 3, field: 'iata', message: 'duplicate IATA code DEL in file' },
      { row: 4, field: 'region', message: 'no region known for state "Atlantis"; supply one' },
    ]);
  });

  it('rejects out-of-range coordinates and bad regions', () => {
    const parsed = parseAirportsCsv('iata,name,city,state,region,lat,lng\nDEL,Delhi,New Delhi,Delhi,Central,95,77\n');
    expect(parsed.rows).toHaveLength(0);
    expect(parsed.errors.map((e) => e.field).sort()).toEqual(['lat', 'region']);
  });

  it('knows the state → region map', () => {
    expect(regionForState('Tamil Nadu')).toBe('South');
    expect(regionForState(' Assam ')).toBe('North-East');
    expect(regionForState('Narnia')).toBeNull();
  });
});
