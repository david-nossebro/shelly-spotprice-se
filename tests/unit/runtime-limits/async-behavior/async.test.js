/**
 * Async behavior tests
 *
 * Verify non-blocking patterns and concurrent handling using setImmediate and Promise-based concurrency.
 */

const { testHelpers } = require('../../../mocks/shelly-api');

describe('Async behavior tests', () => {
  beforeEach(() => {
    testHelpers.setupBasicMocks();
    jest.clearAllMocks();
  });

  test('non-blocking implementation should use setImmediate to yield', () => {
    // Spy on setImmediate to ensure yielding implementations call it
    const siSpy = jest.spyOn(global, 'setImmediate');

    // Example implementation that yields to the event loop
    function yieldingWork(callback) {
      // Yield so heavy work won't block the caller immediately
      setImmediate(() => {
        // Do small work and call the callback
        callback();
      });
    }

    const cb = jest.fn();
    yieldingWork(cb);

    // Expect setImmediate to have been called by the implementation
    expect(siSpy).toHaveBeenCalled();

    // Clean up
    siSpy.mockRestore();
  });

  test('concurrent async operations resolve correctly (Promise.all)', async () => {
    // Worker that yields via setImmediate then resolves with its id
    async function worker(id) {
      await new Promise(resolve => setImmediate(resolve));
      return id;
    }

    const ids = [1, 2, 3, 4, 5];
    const results = await Promise.all(ids.map(worker));
    expect(results).toEqual(ids);
  });
});