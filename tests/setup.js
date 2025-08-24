/**
 * Jest setup file
 * This file is run before each test file is executed
 */

// Global test setup
beforeAll(() => {
  // Suppress console.log during tests unless explicitly needed
  if (!process.env.VERBOSE_TESTS) {
    global.console = {
      ...console,
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    };
  }
});

// Global test cleanup
afterAll(() => {
  // Restore console if it was mocked
  if (global.console.log.mockRestore) {
    global.console.log.mockRestore();
  }
  if (global.console.warn.mockRestore) {
    global.console.warn.mockRestore();
  }
  if (global.console.error.mockRestore) {
    global.console.error.mockRestore();
  }
  if (global.console.info.mockRestore) {
    global.console.info.mockRestore();
  }
});

// Clean up global variables after each test
afterEach(() => {
  // Clean up global variables that might be set by tests
  delete global._;
  delete global._i;
  delete global._j;
  delete global._k;
  delete global._inc;
  delete global._cnt;
  delete global._start;
  delete global._end;
  delete global._avg;
  delete global._startIndex;
  delete global._sum;
  delete global.loopRunning;
  delete global.cmd;
  delete global.prevEpoch;
  delete global.Shelly;
  delete global.Timer;
  delete global.HTTPServer;

  // Clear all mocks
  jest.clearAllMocks();
});

// Custom matchers for better test assertions
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toBeValidTimestamp(received) {
    const pass =
      typeof received === 'number' && received > 0 && received < 9999999999; // Valid Unix timestamp range
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid timestamp`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid timestamp`,
        pass: false,
      };
    }
  },

  toBeValidPriceData(received) {
    const pass =
      Array.isArray(received) &&
      received.every(
        item =>
          Array.isArray(item) &&
          item.length === 2 &&
          typeof item[0] === 'number' && // timestamp
          typeof item[1] === 'number' // price
      );
    if (pass) {
      return {
        message: () => `expected ${received} not to be valid price data`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be valid price data format [[timestamp, price], ...]`,
        pass: false,
      };
    }
  },

  toBeValidShellyResponse(received) {
    const pass =
      typeof received === 'object' &&
      received !== null &&
      (received.result !== undefined || received.error_code !== undefined);
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be a valid Shelly API response`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid Shelly API response with result or error_code`,
        pass: false,
      };
    }
  },
});

// Helper functions available in all tests
global.testUtils = {
  /**
   * Create a mock date that can be controlled in tests
   */
  createMockDate: (year, month, day, hour = 0, minute = 0, second = 0) => {
    return new Date(year, month - 1, day, hour, minute, second);
  },

  /**
   * Create a timestamp for a specific hour today
   */
  createHourTimestamp: hour => {
    const today = new Date();
    today.setHours(hour, 0, 0, 0);
    return Math.floor(today.getTime() / 1000);
  },

  /**
   * Create mock price data for testing
   */
  createMockPriceData: (hours = 24, basePrice = 0.15) => {
    const data = [];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (let i = 0; i < hours; i++) {
      const timestamp = Math.floor(startOfDay.getTime() / 1000) + i * 3600;
      const price = basePrice + (Math.random() - 0.5) * 0.1; // ±5 öre variation
      data.push([timestamp, Math.round(price * 100) / 100]);
    }

    return data;
  },

  /**
   * Wait for async operations to complete
   */
  waitForAsync: () => new Promise(resolve => setImmediate(resolve)),

  /**
   * Create a mock configuration object
   */
  createMockConfig: (overrides = {}) => {
    const defaultConfig = {
      common: {
        g: 'SE3',
        vat: 25,
        day: 4.0,
        night: 3.0,
        names: [],
      },
      instances: [
        {
          en: 1,
          mode: 0,
          m0: { c: 0 },
          m1: { l: 0.15 },
          m2: { p: 24, c: 4, l: -999, s: 0, m: 999 },
          o: [0],
          i: 0,
          m: 60,
        },
      ],
    };

    return {
      ...defaultConfig,
      ...overrides,
      common: { ...defaultConfig.common, ...overrides.common },
      instances: overrides.instances || defaultConfig.instances,
    };
  },
};

// Environment-specific setup
if (process.env.NODE_ENV === 'test') {
  // Disable network requests during testing
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('Network requests are disabled in tests'))
  );
}

// Mock timers setup for tests that need it
global.setupMockTimers = () => {
  jest.useFakeTimers();
  return {
    advanceTime: ms => jest.advanceTimersByTime(ms),
    runAllTimers: () => jest.runAllTimers(),
    runOnlyPendingTimers: () => jest.runOnlyPendingTimers(),
    cleanup: () => jest.useRealTimers(),
  };
};

// Debug helpers
global.debugTest = {
  logState: state => {
    if (process.env.DEBUG_TESTS) {
      console.log('Current state:', JSON.stringify(state, null, 2));
    }
  },

  logMockCalls: (mockFn, name = 'Mock') => {
    if (process.env.DEBUG_TESTS) {
      console.log(`${name} calls:`, mockFn.mock.calls);
    }
  },
};
