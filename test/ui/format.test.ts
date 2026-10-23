import { describe, expect, it } from 'vitest';
import { euro, euro2, euroK, pct, pctShort } from '../../src/ui/format';

describe('formati it-IT', () => {
  it('euro con il punto delle migliaia anche sotto 10.000', () => {
    expect(euro(4390)).toBe('4.390 €');
    expect(euro(521784.98)).toBe('521.785 €');
    expect(euro2(18751.6056)).toBe('18.751,61 €');
    expect(euro(-36325)).toBe('−36.325 €');
  });
  it('percentuali e abbreviazioni', () => {
    expect(pct(-0.05808, 1, true)).toBe('−5,8%');
    expect(pct(0.03, 0, true)).toBe('+3%');
    expect(pctShort(0.0014)).toBe('0,14%');
    expect(pctShort(0.07)).toBe('7%');
    expect(euroK(521784.98)).toBe('522k €');
    expect(euroK(1250000)).toBe('1,25 mln €');
  });
});
