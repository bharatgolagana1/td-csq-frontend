/* organisations module — market shares (§6 "organisations"). */

export type MarketShareEntry = { acoId: string; code: string; name: string; sharePct: number };

/** GET /airports/:id/market-share?cycleId= */
export type MarketShare = {
  airportId: string;
  /** Null = the current default set (copied into a cycle snapshot at publish). */
  cycleId: string | null;
  entries: MarketShareEntry[];
  total: number;
  frozen: boolean;
};

/** PUT /airports/:id/market-share */
export type MarketShareInput = {
  cycleId?: string | null;
  entries: { acoId: string; sharePct: number }[];
  note?: string;
};

/** The slice of a GET /cycles row the market-share selectors need. */
export type MarketShareCycle = {
  id: string;
  code: string;
  name: string;
  status: string;
  type?: string;
};
