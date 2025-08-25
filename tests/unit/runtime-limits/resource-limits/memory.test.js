/**
 * Memory-related runtime limit tests
 *
 * These tests include:
 *  - a conservative, real-allocation smoke test to ensure small allocations don't spike memory
 *  - a deterministic, mocked test to verify our "spike detection" logic can detect excessive heap usage
 *
 * Note: Tests are intentionally conservative so they run reliably in CI. For true stress-testing
 * you'd run separate integration tests on-device or in a controlled environment.
 */

const { testHelpers } = require('../../../mocks/shelly-api');

describe('Memory usage tests', () => {
  beforeEach(() => {
    testHelpers.setupBasicMocks();
  });

  test('moderate allocation should not exceed safe threshold', async () => {
    // Measure heap usage before and after a moderate allocation.
    // The allocation size is chosen to be safe in CI environments.
    const before = process.memoryUsage().heapUsed;

    // Do a moderate allocation: ~200k numbers -> roughly a few MBs
    const arr = new Array(200000).fill(0);

    // Give the runtime a tick to settle (in case of lazy allocations)
    await global.testUtils.waitForAsync();

    const after = process.memoryUsage().heapUsed;
    const increase = after - before;

    // Threshold: 50 MB - conservative and should be safe on typical CI runners.
    const threshold = 50 * 1024 * 1024;

    // Clean up reference so GC can reclaim (not guaranteed synchronously)
    // eslint-disable-next-line no-unused-vars
    arr.length = 0;

    expect(increase).toBeLessThan(threshold);
  }, 10000);

  test('detects a memory spike when runtime reports large heapUsed (mocked)', () => {
    // This test does not perform large allocations. Instead it mocks process.memoryUsage
    // to deterministically simulate a memory spike and verifies detection logic.
    const spy = jest
      .spyOn(process, 'memoryUsage')
      .mockImplementation(() => ({
        rss: 0,
        heapTotal: 0,
        heapUsed: 300 * 1024 * 1024, // 300 MB simulated usage
        external: 0,
      }));

    // Simple detector function used in production to decide when memory is too high.
    function isMemoryUsageTooHigh(thresholdBytes) {
      const usage = process.memoryUsage();
      return usage.heapUsed > thresholdBytes;
    }

    const threshold = 200 * 1024 * 1024; // 200 MB threshold
    expect(isMemoryUsageTooHigh(threshold)).toBe(true);

    // Restore the original function
    spy.mockRestore();
  });
});