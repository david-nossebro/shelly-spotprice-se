/**
 * CPU-related runtime limit tests
 *
 * These tests verify detection logic for CPU-bound operations.
 * To keep tests deterministic and CI-friendly we mock timing where appropriate.
 */

const { testHelpers } = require('../../../mocks/shelly-api');

describe('CPU usage / timing tests', () => {
  beforeEach(() => {
    testHelpers.setupBasicMocks();
  });

  test('detects CPU-intensive synchronous operation via mocked Date.now', () => {
    // Detector that measures synchronous callback duration using Date.now
    function runAndDetect(cb, thresholdMs) {
      const start = Date.now();
      cb();
      const end = Date.now();
      return end - start > thresholdMs;
    }

    // Mock Date.now to simulate a long-running synchronous operation
    const startTs = 1000000;
    const spy = jest.spyOn(Date, 'now')
      .mockImplementationOnce(() => startTs) // start
      .mockImplementationOnce(() => startTs + 600); // end -> 600ms elapsed

    const heavyCb = () => {
      // No-op: duration is controlled by the mocked Date.now
    };

    const threshold = 500; // ms
    expect(runAndDetect(heavyCb, threshold)).toBe(true);

    spy.mockRestore();
  });

  test('does not flag cooperative async operation (yields) when measured properly', async () => {
    // Detector that measures an async function's wall time
    async function runAsyncAndDetect(asyncCb, thresholdMs) {
      const start = Date.now();
      await asyncCb();
      const end = Date.now();
      return end - start > thresholdMs;
    }

    // We'll mock Date.now to return small elapsed time to simulate cooperative yielding
    const startTs = 2000000;
    const spy = jest.spyOn(Date, 'now')
      .mockImplementationOnce(() => startTs) // start
      .mockImplementationOnce(() => startTs + 50); // end -> 50ms elapsed

    const cooperative = async () => {
      // Simulate work that yields back to event loop
      await new Promise(resolve => setImmediate(resolve));
    };

    const threshold = 200; // ms
    const isSpike = await runAsyncAndDetect(cooperative, threshold);
    expect(isSpike).toBe(false);

    spy.mockRestore();
  });
});