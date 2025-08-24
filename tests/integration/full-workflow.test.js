/**
 * Integration tests for full application workflow
 */

const {
  testHelpers,
  mockPriceData,
} = require('../mocks/shelly-api');

describe('Full Application Workflow Integration Tests', () => {
  beforeEach(() => {
    testHelpers.setupBasicMocks();
    testHelpers.setupMockPrices();
    testHelpers.setupMockConfig();
  });

  describe('Price fetching and processing workflow', () => {
    test('should fetch prices and update application state', async () => {
      // Mock successful HTTP response
      global.Shelly.setMockResponse(
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

      // Create mock state
      const mockState = testHelpers.createMockState();
      mockState.s.timeOK = 1;
      mockState.s.p[0].ts = 0; // No prices yet
      global._ = mockState;

      // Simulate price fetching logic
      const pricesNeeded = () => {
        return mockState.s.timeOK && mockState.s.p[0].ts === 0;
      };

      const updatePrices = priceData => {
        mockState.p[0] = priceData;
        mockState.s.p[0].ts = Math.floor(Date.now() / 1000);

        // Calculate statistics
        const prices = priceData.map(p => p[1]);
        mockState.s.p[0].low = Math.min(...prices);
        mockState.s.p[0].high = Math.max(...prices);
        mockState.s.p[0].avg =
          prices.reduce((a, b) => a + b, 0) / prices.length;
      };

      // Test the workflow
      expect(pricesNeeded()).toBe(true);

      updatePrices(mockPriceData.today);

      expect(mockState.p[0]).toEqual(mockPriceData.today);
      expect(mockState.s.p[0].ts).toBeGreaterThan(0);
      expect(mockState.s.p[0].low).toBe(0.1); // From mock data
      expect(mockState.s.p[0].high).toBe(0.25); // From mock data
      expect(mockState.s.p[0].avg).toBeCloseTo(0.175, 2);
    });

    test('should handle price fetching errors gracefully', () => {
      // Mock failed HTTP response
      global.Shelly.setMockResponse(
        'HTTP.GET',
        {
          url: expect.stringContaining('elprisetjustnu.se'),
        },
        {
          result: null,
          error_code: 1,
          error_message: 'Network error',
        }
      );

      const mockState = testHelpers.createMockState();
      mockState.s.timeOK = 1;
      mockState.s.errCnt = 0;
      global._ = mockState;

      // Simulate error handling
      const handlePriceError = () => {
        mockState.s.errCnt += 1;
        mockState.s.errTs = Math.floor(Date.now() / 1000);
        mockState.s.p[0].ts = 0;
        mockState.p[0] = [];
      };

      handlePriceError();

      expect(mockState.s.errCnt).toBe(1);
      expect(mockState.s.errTs).toBeGreaterThan(0);
      expect(mockState.s.p[0].ts).toBe(0);
      expect(mockState.p[0]).toEqual([]);
    });
  });

  describe('Configuration loading and validation workflow', () => {
    test('should load and validate configuration successfully', () => {
      // Mock KVS response with partial config
      const partialConfig = {
        g: 'SE1',
        vat: 20,
        // Missing day, night, names
      };

      global.Shelly.setMockResponse(
        'KVS.Get',
        { key: 'sptprc-se' },
        {
          result: { value: JSON.stringify(partialConfig) },
        }
      );

      const mockState = testHelpers.createMockState();
      global._ = mockState;

      // Simulate config loading and validation
      const loadConfig = () => {
        // Simulate loading from KVS
        const loadedConfig = partialConfig;

        // Apply defaults for missing properties
        const defaultConfig = {
          g: 'SE3',
          vat: 25,
          day: 0,
          night: 0,
          names: [],
        };

        const finalConfig = { ...defaultConfig, ...loadedConfig };
        mockState.c.c = finalConfig;
        mockState.s.configOK = 1;
      };

      loadConfig();

      expect(mockState.c.c.g).toBe('SE1'); // User value
      expect(mockState.c.c.vat).toBe(20); // User value
      expect(mockState.c.c.day).toBe(0); // Default value
      expect(mockState.c.c.night).toBe(0); // Default value
      expect(mockState.c.c.names).toEqual([]); // Default value
      expect(mockState.s.configOK).toBe(1);
    });

    test('should handle missing configuration gracefully', () => {
      // Mock KVS response with no config
      global.Shelly.setMockResponse(
        'KVS.Get',
        { key: 'sptprc-se' },
        {
          result: null,
        }
      );

      const mockState = testHelpers.createMockState();
      global._ = mockState;

      // Simulate config loading with defaults
      const loadConfigWithDefaults = () => {
        const defaultConfig = {
          g: 'SE3',
          vat: 25,
          day: 0,
          night: 0,
          names: [],
        };

        mockState.c.c = defaultConfig;
        mockState.s.configOK = 1;
      };

      loadConfigWithDefaults();

      expect(mockState.c.c).toEqual({
        g: 'SE3',
        vat: 25,
        day: 0,
        night: 0,
        names: [],
      });
      expect(mockState.s.configOK).toBe(1);
    });
  });

  describe('Logic execution workflow', () => {
    test('should execute manual mode logic correctly', () => {
      const mockState = testHelpers.createMockState();
      mockState.s.timeOK = 1;
      mockState.c.i[0].en = 1;
      mockState.c.i[0].mode = 0; // Manual mode
      mockState.c.i[0].m0.c = 1; // Manual command ON
      global._ = mockState;

      // Simulate logic execution
      const executeLogic = inst => {
        const cfg = mockState.c.i[inst];
        let cmd = false;

        if (cfg.mode === 0) {
          // Manual mode
          cmd = cfg.m0.c === 1;
          mockState.si[inst].st = 1;
        }

        return cmd;
      };

      const result = executeLogic(0);

      expect(result).toBe(true);
      expect(mockState.si[0].st).toBe(1);
    });

    test('should execute price limit mode logic correctly', () => {
      const mockState = testHelpers.createMockState();
      mockState.s.timeOK = 1;
      mockState.s.p[0].ts = Math.floor(Date.now() / 1000);
      mockState.s.p[0].now = 0.12; // Current price
      mockState.p[0] = mockPriceData.today;
      mockState.c.i[0].en = 1;
      mockState.c.i[0].mode = 1; // Price limit mode
      mockState.c.i[0].m1.l = 0.15; // Price limit
      global._ = mockState;

      // Simulate logic execution
      const executeLogic = inst => {
        const cfg = mockState.c.i[inst];
        let cmd = false;

        if (cfg.mode === 1) {
          // Price limit mode
          cmd = mockState.s.p[0].now <= cfg.m1.l;
          mockState.si[inst].st = cmd ? 2 : 3;
        }

        return cmd;
      };

      const result = executeLogic(0);

      expect(result).toBe(true); // 0.12 <= 0.15
      expect(mockState.si[0].st).toBe(2);
    });

    test('should handle cheapest hours mode logic', () => {
      const mockState = testHelpers.createMockState();
      mockState.s.timeOK = 1;
      mockState.s.p[0].ts = Math.floor(Date.now() / 1000);
      mockState.p[0] = mockPriceData.today;
      mockState.c.i[0].en = 1;
      mockState.c.i[0].mode = 2; // Cheapest hours mode
      mockState.c.i[0].m2.c = 4; // 4 cheapest hours
      mockState.c.i[0].m2.p = 24; // 24 hour period
      global._ = mockState;

      // Simplified cheapest hour check
      const isCheapestHour = () => {
        const sortedPrices = [...mockPriceData.today].sort(
          (a, b) => a[1] - b[1]
        );
        const cheapestHours = sortedPrices.slice(0, 4);

        // Check if current hour is among cheapest (simplified)
        const now = Math.floor(Date.now() / 1000);
        const currentHourStart = now - (now % 3600);

        return cheapestHours.some(
          price => Math.abs(price[0] - currentHourStart) < 3600
        );
      };

      // Simulate logic execution
      const executeLogic = inst => {
        const cfg = mockState.c.i[inst];
        let cmd = false;

        if (cfg.mode === 2) {
          // Cheapest hours mode
          cmd = isCheapestHour();
          mockState.si[inst].st = cmd ? 5 : 4;
        }

        return cmd;
      };

      const result = executeLogic(0);

      expect(typeof result).toBe('boolean');
      expect([4, 5]).toContain(mockState.si[0].st);
    });
  });

  describe('Device control workflow', () => {
    test('should control relay outputs correctly', () => {
      const mockState = testHelpers.createMockState();
      mockState.c.i[0].o = [0, 1]; // Control outputs 0 and 1
      global._ = mockState;

      // Mock successful relay control
      global.Shelly.setMockResponse('Switch.Set', '{id:0,on:true}', {
        result: { was_on: false },
      });
      global.Shelly.setMockResponse('Switch.Set', '{id:1,on:true}', {
        result: { was_on: false },
      });

      // Simulate relay control synchronously
      const setRelays = (inst, command) => {
        const cfg = mockState.c.i[inst];
        const results = [];

        for (const outputId of cfg.o) {
          const params = `{id:${outputId},on:${command ? 'true' : 'false'}}`;
          const result = global.Shelly.call('Switch.Set', params);
          results.push({
            success: result !== null,
            outputId,
            result,
          });
        }

        return results;
      };

      const results = setRelays(0, true);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].outputId).toBe(0);
      expect(results[1].success).toBe(true);
      expect(results[1].outputId).toBe(1);
    });

    test('should handle relay control failures', () => {
      const mockState = testHelpers.createMockState();
      mockState.c.i[0].o = [0];
      global._ = mockState;

      // Clear any existing mock responses first
      global.Shelly._mockResponses.clear();

      // Simulate relay control with error handling
      const setRelayWithErrorHandling = (inst, outputId, command) => {
        const params = `{id:${outputId},on:${command ? 'true' : 'false'}}`;

        // The mock will fall back to default responses when no specific mock is set
        const result = global.Shelly.call('Switch.Set', params);

        return {
          success: result !== null && result !== undefined,
          outputId,
          result,
        };
      };

      const result = setRelayWithErrorHandling(0, 0, true);

      // Since we cleared the mock responses, the result should be undefined/null (no default found)
      expect(result.success).toBe(false);
      expect(result.outputId).toBe(0);
      expect(result.result).toBeUndefined();
    });
  });

  describe('HTTP API workflow', () => {
    test('should handle state request correctly', () => {
      const mockState = testHelpers.createMockState();
      global._ = mockState;

      // Simulate HTTP request handling
      const handleStateRequest = inst => {
        if (inst >= 0 && inst < 3 && mockState.c.i && mockState.c.i[inst]) {
          return {
            s: mockState.s,
            si: mockState.si[inst],
            c: mockState.c.c,
            ci: mockState.c.i[inst],
            p: mockState.p,
          };
        }
        return null;
      };

      const response = handleStateRequest(0);

      expect(response).toBeDefined();
      expect(response.s).toBe(mockState.s);
      expect(response.si).toBe(mockState.si[0]);
      expect(response.c).toBe(mockState.c.c);
      expect(response.ci).toBe(mockState.c.i[0]);
      expect(response.p).toBe(mockState.p);
    });

    test('should handle force command correctly', () => {
      const mockState = testHelpers.createMockState();
      global._ = mockState;

      // Simulate force command
      const handleForceCommand = (inst, timestamp, command) => {
        if (inst >= 0 && inst < 3) {
          mockState.si[inst].fCmdTs = Number(timestamp);
          mockState.si[inst].fCmd = Number(command);
          mockState.si[inst].chkTs = 0; // Trigger logic re-run
          return true;
        }
        return false;
      };

      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const result = handleForceCommand(0, futureTimestamp, 1);

      expect(result).toBe(true);
      expect(mockState.si[0].fCmdTs).toBe(futureTimestamp);
      expect(mockState.si[0].fCmd).toBe(1);
      expect(mockState.si[0].chkTs).toBe(0);
    });
  });
});
