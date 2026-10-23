import { expect } from 'vitest';
import type { Breakeven } from '../../src/model';

/** Tolleranze della SPEC par. 4.7: 0,01 € sui capitali, 1e-6 sui differenziali di pareggio. */
export const EUR_TOL = 0.01 + 1e-9;
export const DELTA_TOL = 1e-6;

export function expectEuro(actual: number, expected: number, label = ''): void {
  expect(Math.abs(actual - expected), `${label}: ${actual} invece di ${expected}`).toBeLessThanOrEqual(EUR_TOL);
}

export function expectBreakeven(actual: Breakeven, expected: number | string, label = ''): void {
  if (typeof expected === 'string') {
    expect(actual, label).toBe(expected);
    return;
  }
  expect(typeof actual, label).toBe('number');
  expect(Math.abs((actual as number) - expected), `${label}: ${actual} invece di ${expected}`).toBeLessThanOrEqual(DELTA_TOL);
}
