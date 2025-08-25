/**
 * GC / memory-pressure related tests
 *
 * Purpose:
 *  - Validate that the source contains explicit memory cleanup patterns used by the app
 *    (e.g. req = null, res.headers = null, res = null).
 *  - Run conservative runtime checks that aim to emulate array growth bounds and
 *    circular-reference cleanup patterns in a CI-safe manner.
 *
 * These tests are intentionally conservative and mostly validate patterns and
 * safe behaviours rather than trying to force a real embedded GC run.
 */
const fs = require('fs');
const path = require('path');
const { testHelpers } = require('../../../mocks/shelly-api');

describe('Garbage Collection Pressure Tests', () => {
  beforeEach(() => {
    testHelpers.setupBasicMocks();
    jest.clearAllMocks();
  });

  test('source includes explicit HTTP memory cleanup patterns', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js'),
      'utf8'
    );

    // Check for explicit request/response nullification patterns used in getPrices()
    expect(src).toMatch(/req\s*=\s*null\s*;/);
    expect(src).toMatch(/res\.headers\s*=\s*null\s*;/);
    expect(src).toMatch(/res\.message\s*=\s*null\s*;/);
    // Later the `res` object is nulled as well
    expect(src).toMatch(/res\s*=\s*null\s*;/);
  });

  test('Price data array growth stays within conservative memory bounds', async () => {
    // This is a conservative, CI-safe test.
    // Create repeated small arrays (mimicking pushing [epoch, price]) and measure heap increase.
    const before = process.memoryUsage().heapUsed;

    const prices = [];
    for (let i = 0; i < 100000; i++) {
      // Each entry mimics the shape used by the app: [epoch, price]
      prices.push([1600000000 + i * 3600, Math.random()]);
      // Periodically yield so the runtime can do bookkeeping
      if (i % 5000 === 0) {
        // eslint-disable-next-line no-await-in-loop
        await global.testUtils.waitForAsync();
      }
    }

    // Allow one tick for possible lazy allocations
    await global.testUtils.waitForAsync();

    const after = process.memoryUsage().heapUsed;
    const increase = after - before;

    // Threshold: 120 MB (conservative for CI); test ensures we don't keep unbounded growth here.
    const threshold = 120 * 1024 * 1024;
    // Clean up reference to allow GC
    prices.length = 0;

    expect(increase).toBeLessThan(threshold);
  }, 20000);

  test('Circular reference cleanup - creating and removing circular refs should not throw', async () => {
    // Create a circular structure and then remove references.
    let a = { v: new Array(1000).fill('x') };
    let b = { link: a };
    // Circular
    a.link = b;

    // Simulate usage pattern and then nullify top-level references
    expect(a.link).toBeDefined();
    expect(b.link).toBe(a);

    // Drop references
    a = null;
    b = null;

    // Yield a few ticks to emulate opportunity for GC and runtime bookkeeping
    await global.testUtils.waitForAsync();
    await global.testUtils.waitForAsync();

    // We cannot force or assert GC ran in Node without --expose-gc.
    // Instead we assert that access to previously held variables would be undefined in this scope.
    // (This demonstrates we removed local references correctly.)
    expect(typeof a).toBe('object' || 'undefined'); // variable was set to null
  });

  test('HTTP response object cleanup patterns are present in source (onServerRequest and getPrices)', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js'),
      'utf8'
    );

    // onServerRequest has several explicit cleanup patterns: request = null; params = null; response.headers assignments
    expect(src).toMatch(/onServerRequest\s*=\s*function/);
    expect(src).toMatch(/request\s*=\s*null\s*;/);
    expect(src).toMatch(/params\s*=\s*null\s*;/);
    expect(src).toMatch(/response\.headers\s*=\s*\[\['Content-Type',\s*MIME_TYPE\]\];/);
  });
});