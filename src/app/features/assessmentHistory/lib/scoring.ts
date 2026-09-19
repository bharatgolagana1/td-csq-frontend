import type { RatingChoice, RatingValue, ScoreBand, Sentiment } from '../api/history.types';

/**
 * The rating ramp lives in tokens.css. This module is the one place that
 * decides which end of it a number falls on.
 *
 * The band thresholds are deliberately the same as the dashboard's. They are
 * repeated here rather than imported, because the dashboard keeps them inside
 * its mock module and a mock is the wrong thing for another feature to depend
 * on. When the real scoring API lands, both should read it from there.
 */
export const SCORE_BANDS: Array<{ key: ScoreBand; label: string; min: number; colour: string }> = [
  { key: 'R5', label: 'Excellent', min: 4.5, colour: 'var(--csq-r5)' },
  { key: 'R4', label: 'Very Good', min: 3.5, colour: 'var(--csq-r4)' },
  { key: 'R3', label: 'Good', min: 2.5, colour: 'var(--csq-r3)' },
  { key: 'R2', label: 'Fair', min: 1.5, colour: 'var(--csq-r2)' },
  { key: 'R1', label: 'Poor', min: 0, colour: 'var(--csq-r1)' },
];

export function bandOf(score: number | null): ScoreBand | null {
  if (score === null) return null;
  const band = SCORE_BANDS.find((b) => score >= b.min);
  return band ? band.key : 'R1';
}

export function bandLabel(score: number | null): string {
  const key = bandOf(score);
  return SCORE_BANDS.find((b) => b.key === key)?.label ?? 'Not scored';
}

export function scoreColour(score: number | null): string {
  const key = bandOf(score);
  return SCORE_BANDS.find((b) => b.key === key)?.colour ?? 'var(--csq-na)';
}

export const RATING_LABEL: Record<RatingChoice, string> = {
  5: 'Excellent',
  4: 'Very Good',
  3: 'Good',
  2: 'Fair',
  1: 'Poor',
  NA: 'Not applicable',
};

export const RATING_COLOUR: Record<RatingChoice, string> = {
  5: 'var(--csq-r5)',
  4: 'var(--csq-r4)',
  3: 'var(--csq-r3)',
  2: 'var(--csq-r2)',
  1: 'var(--csq-r1)',
  NA: 'var(--csq-na)',
};

/** Sentiment is read off the rating, never off the words: the rating is the fact. */
export function sentimentOf(rating: RatingChoice): Sentiment {
  if (rating === 'NA') return 'UNRATED';
  if (rating >= 4) return 'POSITIVE';
  if (rating === 3) return 'NEUTRAL';
  return 'CRITICAL';
}

export const SENTIMENT_LABEL: Record<Sentiment, string> = {
  POSITIVE: 'Positive',
  NEUTRAL: 'Mixed',
  CRITICAL: 'Critical',
  UNRATED: 'Not rated',
};

export const SENTIMENT_COLOUR: Record<Sentiment, string> = {
  POSITIVE: 'var(--csq-r5)',
  NEUTRAL: 'var(--csq-r3)',
  CRITICAL: 'var(--csq-r1)',
  UNRATED: 'var(--csq-na)',
};

export const SENTIMENT_ORDER: Sentiment[] = ['CRITICAL', 'NEUTRAL', 'POSITIVE', 'UNRATED'];

/** Mean of the answered ratings. NA is dropped from the set, not counted as zero. */
export function meanRating(ratings: RatingChoice[]): number | null {
  const answered = ratings.filter((r): r is RatingValue => r !== 'NA');
  if (answered.length === 0) return null;
  const sum = answered.reduce((total, r) => total + r, 0);
  return Math.round((sum / answered.length) * 10) / 10;
}

export function formatScore(score: number | null): string {
  return score === null ? 'Not scored' : score.toFixed(1);
}

/**
 * Mean of scores that are already per respondent averages. Each respondent
 * counts once, which is the right weighting for a response summary: someone who
 * answered every parameter should not outweigh someone who left ten as NA.
 */
export function meanOfScores(scores: Array<number | null>): number | null {
  const values = scores.filter((s): s is number => s !== null);
  if (values.length === 0) return null;
  const sum = values.reduce((total, v) => total + v, 0);
  return Math.round((sum / values.length) * 10) / 10;
}
