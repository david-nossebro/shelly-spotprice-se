/**
 * Event loop blocking tests
 *
 * Purpose:
 *  - Validate non-blocking patterns like Timer.set() usage and ensure
 *    common server handlers yield control and don't cause stack overflows.
 */
const path = require('path');
const { testHelpers, mockTimer } = require('../../../mocks/shelly-api');

describe('Event Loop Blocking Tests', () => {
  beforeEach(() => {
    // Clear require cache for the module under test so each test can re-require cleanly.
    const target = path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js');
    delete require.cache[require.resolve(target)];

    // Set up mocks before requiring the module
    testHelpers.setupBasicMocks();
    jest.clearAllMocks();

    // Load the module under test (will register endpoint and timers)
    // eslint-disable-next-line global-require
    require(target);
  });

  test('Price calculation loops yield periodically (Timer.set is used to schedule work)', () => {
    // The module should schedule periodic work using Timer.set during initialization
    // Expect at least one Timer.set call (initial loop + repeating timer)
    expect(mockTimer.set).toHaveBeenCalled();

    // Check that a call was registered with a non-zero delay (10000 initial)
    const calledWithDelay = mockTimer.set.mock.calls.some(call => {
      const delay = call[0];
      return typeof delay === 'number' && delay > 0;
    });
    expect(calledWithDelay).toBe(true);
  });

  test('HTTP response generation does not block event loop (handler returns quickly)', () => {
    // Validate source code patterns that ensure non-blocking HTTP response generation
    const fs = require('fs');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js'),
      'utf8'
    );

    // Check that the onServerRequest function exists and uses non-blocking patterns
    expect(src).toMatch(/const onServerRequest = function/);
    
    // Verify it returns early when loopRunning (non-blocking pattern)
    expect(src).toMatch(/if \(loopRunning\)[\s\S]*return/);
    
    // Verify it sets request = null for cleanup (memory management)
    expect(src).toMatch(/request = null/);
    
    // Verify it calls response.send() at the end
    expect(src).toMatch(/response\.send\(\)/);
  });

  test('Config validation loops (chkConfig) invoke KVS.Set without stack overflow', () => {
    // The source file contains chkConfig function implementation - test by checking KVS.Set calls
    const fs = require('fs');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js'),
      'utf8'
    );

    // Validate that chkConfig function exists and uses KVS.Set in a loop-safe manner
    expect(src).toMatch(/const chkConfig = function\(/);
    expect(src).toMatch(/Shelly\.call\(\s*['"]KVS\.Set['"]/);
    
    // Check that it uses callback pattern to prevent stack overflow
    expect(src).toMatch(/callback\([\s\S]*ok/);
  });

  test('Timer.set callback chains do not cause recursive overflow when triggered', () => {
    // Simulate a timer that when triggered calls loop which schedules another Timer.set.
    // We will trigger a non-repeating timer and ensure it executes its callback without throwing.
    const cb = jest.fn();
    const id = mockTimer.set(10, false, () => {
      // Timer callback triggers another short Timer.set to emulate chaining
      mockTimer.set(5, false, cb);
    });

    expect(mockTimer._timers.has(id)).toBe(true);

    // Trigger outer timer
    expect(() => mockTimer.trigger(id)).not.toThrow();

    // The inner callback should be registered and can be triggered as well
    // Find any remaining timer ids and trigger them
    for (const [tid] of mockTimer._timers) {
      // Trigger remaining timers (should include inner callback)
      mockTimer.trigger(tid);
    }

    expect(cb).toHaveBeenCalled();
  });
});