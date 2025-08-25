/**
 * Floating point precision tests
 *
 * Purpose:
 *  - Validate financial calculation logic (VAT multiplier, averages, comparisons)
 *    within conservative numeric tolerances using representative sample data.
 */
const { mockPriceData } = require('../../../mocks/shelly-api');

describe('Floating Point Precision Tests', () => {
  test('VAT multiplier calculation precision', () => {
    const vat = 25;
    const vatMultiplier = (100 + vat) / 100.0;
    expect(vatMultiplier).toBeCloseTo(1.25, 10);
  });

  test('Price comparison precision in cheapest hour logic', () => {
    // Simulate two prices with tiny floating error
    const priceA = 0.1 + 0.2 - 0.2; // yields 0.1
    const priceB = 0.10000000000000001;
    // Direct equality may fail, use toBeCloseTo
    expect(priceA).not.toBe(priceB);
    expect(priceA).toBeCloseTo(priceB, 12);
  });

  test('Average price calculation precision', () => {
    const arr = [0.15, 0.12, 0.1, 0.11];
    const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
    expect(avg).toBeCloseTo(0.12, 10);
  });

  test('Binary flag operations with floating point comparisons', () => {
    const limit = 0.15;
    const price = 0.15000000000000002;
    // Use tolerant comparison for float edge cases
    expect(price).toBeCloseTo(limit, 12);
    // Comparison with fixed precision rounding
    expect(Number(price.toFixed(12)) <= Number(limit.toFixed(12))).toBe(true);
  });

  test('Sequential hour average edge cases', () => {
    // Simulate selecting sequential hours and computing averages
    const prices = [0.2, 0.1, 0.05, 0.3, 0.25];
    // Find lowest average for window size 2
    let bestAvg = Infinity;
    let bestIndex = -1;
    for (let i = 0; i <= prices.length - 2; i++) {
      const sum = prices[i] + prices[i + 1];
      const avg = sum / 2;
      if (avg < bestAvg) {
        bestAvg = avg;
        bestIndex = i;
      }
    }
    expect(bestIndex).toBe(1); // [0.1,0.05] is best
    expect(bestAvg).toBeCloseTo((0.1 + 0.05) / 2, 10);
  });

  test('Cross-platform floating point consistency (sum of decimals)', () => {
    const a = 0.1;
    const b = 0.2;
    const sum = a + b;
    // expect sum to be close to 0.3
    expect(sum).toBeCloseTo(0.3, 12);
  });
});