/**
 * Mock Shelly API for testing
 * Provides mock implementations of Shelly device globals and APIs
 */

// Mock Shelly device object
const mockShelly = {
  call: jest.fn(),
  addStatusHandler: jest.fn(),
  addEventHandler: jest.fn(),
  getComponentStatus: jest.fn(),
  getComponentConfig: jest.fn(),

  // Mock responses for common calls
  _mockResponses: new Map(),

  // Helper to set up mock responses
  setMockResponse: function (method, params, response) {
    const key = JSON.stringify({ method, params });
    this._mockResponses.set(key, response);
  },

  // Reset all mocks
  resetMocks: function () {
    this.call.mockReset();
    this.addStatusHandler.mockReset();
    this.addEventHandler.mockReset();
    this.getComponentStatus.mockReset();
    this.getComponentConfig.mockReset();
    this._mockResponses.clear();
  },
};

// Configure default mock behavior
mockShelly.call.mockImplementation((method, params, callback) => {
  const key = JSON.stringify({ method, params });
  const response = mockShelly._mockResponses.get(key);

  if (response) {
    if (callback) {
      // Simulate async callback
      setTimeout(
        () =>
          callback(
            response.result,
            response.error_code,
            response.error_message
          ),
        0
      );
    }
    return response.result;
  }

  // Default responses for common methods
  const defaultResponses = {
    'Switch.GetStatus': { id: 0, output: false, source: 'init' },
    'Switch.Set': { was_on: false },
    'Sys.GetStatus': {
      mac: 'test-mac',
      restart_required: false,
      time: '12:00',
      unixtime: Math.floor(Date.now() / 1000),
      uptime: 3600,
      ram_size: 262144,
      ram_free: 200000,
      fs_size: 458752,
      fs_free: 400000,
      cfg_rev: 1,
      kvs_rev: 1,
      schedule_rev: 0,
      webhook_rev: 0,
      available_updates: {},
    },
    'KVS.Get': { value: null },
    'KVS.Set': { rev: 1 },
    'HTTP.GET': { code: 200, message: 'OK', body: '{}' },
    'HTTP.POST': { code: 200, message: 'OK', body: '{}' },
  };

  const defaultResponse = defaultResponses[method];
  if (defaultResponse && callback) {
    setTimeout(() => callback(defaultResponse, 0, null), 0);
  }

  return defaultResponse || null;
});

// Mock Timer object
const mockTimer = {
  set: jest.fn(),
  clear: jest.fn(),

  // Helper to simulate timer execution
  _timers: new Map(),
  _nextId: 1,

  // Mock timer behavior
  mockImplementation: function () {
    this.set.mockImplementation((interval, repeat, callback, userdata) => {
      const id = this._nextId++;
      const timer = {
        id,
        interval,
        repeat,
        callback,
        userdata,
        active: true,
      };
      this._timers.set(id, timer);
      return id;
    });

    this.clear.mockImplementation(id => {
      const timer = this._timers.get(id);
      if (timer) {
        timer.active = false;
        this._timers.delete(id);
        return true;
      }
      return false;
    });
  },

  // Helper to trigger timer callbacks
  trigger: function (id) {
    const timer = this._timers.get(id);
    if (timer && timer.active) {
      timer.callback(timer.userdata);
      if (!timer.repeat) {
        this._timers.delete(id);
      }
    }
  },

  // Reset all timers
  reset: function () {
    this.set.mockReset();
    this.clear.mockReset();
    this._timers.clear();
    this._nextId = 1;
  },
};

// Initialize timer mock
mockTimer.mockImplementation();

// Mock HTTPServer object
const mockHTTPServer = {
  registerEndpoint: jest.fn(),

  // Helper to simulate HTTP requests
  _endpoints: new Map(),

  mockImplementation: function () {
    this.registerEndpoint.mockImplementation((path, callback) => {
      this._endpoints.set(path, callback);
    });
  },

  // Helper to simulate incoming requests
  simulateRequest: function (path, request, response) {
    const callback = this._endpoints.get(path);
    if (callback) {
      callback(request, response);
    }
  },

  reset: function () {
    this.registerEndpoint.mockReset();
    this._endpoints.clear();
  },
};

// Initialize HTTPServer mock
mockHTTPServer.mockImplementation();

// Mock console object (if needed)
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Mock price data for testing
const mockPriceData = {
  // Sample price data for SE3 region
  today: [
    [1640995200, 0.15], // 00:00 - 15 öre/kWh
    [1640998800, 0.12], // 01:00 - 12 öre/kWh
    [1641002400, 0.1], // 02:00 - 10 öre/kWh (cheapest)
    [1641006000, 0.11], // 03:00 - 11 öre/kWh
    [1641009600, 0.13], // 04:00 - 13 öre/kWh
    [1641013200, 0.16], // 05:00 - 16 öre/kWh
    [1641016800, 0.18], // 06:00 - 18 öre/kWh
    [1641020400, 0.2], // 07:00 - 20 öre/kWh
    [1641024000, 0.22], // 08:00 - 22 öre/kWh
    [1641027600, 0.25], // 09:00 - 25 öre/kWh
    [1641031200, 0.23], // 10:00 - 23 öre/kWh
    [1641034800, 0.21], // 11:00 - 21 öre/kWh
    [1641038400, 0.19], // 12:00 - 19 öre/kWh
    [1641042000, 0.17], // 13:00 - 17 öre/kWh
    [1641045600, 0.15], // 14:00 - 15 öre/kWh
    [1641049200, 0.14], // 15:00 - 14 öre/kWh
    [1641052800, 0.16], // 16:00 - 16 öre/kWh
    [1641056400, 0.18], // 17:00 - 18 öre/kWh
    [1641060000, 0.2], // 18:00 - 20 öre/kWh
    [1641063600, 0.22], // 19:00 - 22 öre/kWh
    [1641067200, 0.2], // 20:00 - 20 öre/kWh
    [1641070800, 0.18], // 21:00 - 18 öre/kWh
    [1641074400, 0.16], // 22:00 - 16 öre/kWh
    [1641078000, 0.14], // 23:00 - 14 öre/kWh
  ],

  tomorrow: [
    [1641081600, 0.13], // 00:00 - 13 öre/kWh
    [1641085200, 0.11], // 01:00 - 11 öre/kWh
    [1641088800, 0.09], // 02:00 - 9 öre/kWh (cheapest tomorrow)
    [1641092400, 0.1], // 03:00 - 10 öre/kWh
    // ... more hours
  ],
};

// Mock configuration data
const mockConfig = {
  common: {
    g: 'SE3', // Price region
    vat: 25, // VAT percentage
    day: 4.0, // Day transfer fee
    night: 3.0, // Night transfer fee
    tz: 'Europe/Stockholm',
    names: [],
  },

  instances: [
    {
      en: 1, // Enabled
      mode: 2, // Cheapest hours mode
      o: [0], // Output IDs
      m0: {
        c: 0, // Manual command
      },
      m1: {
        l: 0, // Price limit
      },
      m2: {
        p: 24, // Period length
        c: 4, // Number of cheapest hours
        l: -999, // Always on price limit
        s: 0, // Sequential mode off
        m: 999, // Maximum price limit
        ps: 0, // Custom period start
        pe: 23, // Custom period end
        ps2: 0, // Custom period 2 start
        pe2: 23, // Custom period 2 end
        c2: 0, // Cheapest hours for period 2
      },
      b: 0, // Backup hours
      e: 0, // Emergency command
      f: 0, // Forced hours
      fc: 0, // Forced commands
      i: 0, // Invert output
      m: 60, // Minutes per hour
      oc: 0, // Output config
    },
  ],
};

// Helper functions for test setup
const testHelpers = {
  /**
   * Set up basic mocks for a test
   */
  setupBasicMocks: function () {
    global.Shelly = mockShelly;
    global.Timer = mockTimer;
    global.HTTPServer = mockHTTPServer;
    global.console = mockConsole;

    // Reset all mocks
    mockShelly.resetMocks();
    mockTimer.reset();
    mockHTTPServer.reset();
  },

  /**
   * Set up mock price data
   */
  setupMockPrices: function () {
    mockShelly.setMockResponse(
      'HTTP.GET',
      {
        url: expect.stringContaining('elprisetjustnu.se'),
      },
      {
        result: {
          code: 200,
          body: JSON.stringify(mockPriceData.today),
        },
      }
    );
  },

  /**
   * Set up mock configuration
   */
  setupMockConfig: function () {
    mockShelly.setMockResponse(
      'KVS.Get',
      { key: 'config' },
      {
        result: { value: JSON.stringify(mockConfig) },
      }
    );
  },

  /**
   * Create mock application state
   */
  createMockState: function () {
    const now = new Date().getTime(); // Use getTime() instead of Date.now()
    return {
      s: {
        v: '4.0.0',
        dn: 'Test Device',
        configOK: 1,
        timeOK: 1,
        errCnt: 0,
        errTs: 0,
        upTs: Math.floor(now / 1000),
        tz: '+02:00',
        tzh: 2,
        enCnt: 1,
        p: [
          {
            ts: Math.floor(now / 1000),
            now: 0.15,
            low: 0.1,
            high: 0.25,
            avg: 0.175,
          },
          {
            ts: 0,
            now: 0,
            low: 0,
            high: 0,
            avg: 0,
          },
        ],
      },
      si: [
        {
          chkTs: Math.floor(now / 1000),
          st: 0,
          str: '',
          cmd: -1,
          configOK: 1,
          fCmdTs: 0,
          fCmd: 0,
        },
      ],
      c: {
        c: mockConfig.common,
        i: [mockConfig.instances[0]],
      },
      p: [mockPriceData.today, mockPriceData.tomorrow],
      h: [[]],
    };
  },
};

module.exports = {
  mockShelly,
  mockTimer,
  mockHTTPServer,
  mockConsole,
  mockPriceData,
  mockConfig,
  testHelpers,
};
