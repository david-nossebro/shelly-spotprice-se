/**
 * Unit tests for price logic functions
 */

const {
  testHelpers,
  mockPriceData,
  //mockConfig,
} = require('../mocks/shelly-api');

describe('Price Logic Functions', () => {
  let mockState;

  beforeEach(() => {
    testHelpers.setupBasicMocks();

    // Create mock application state
    mockState = testHelpers.createMockState();
    global._ = mockState;

    // Mock global loop variables
    global._i = 0;
    global._j = 0;
    global._k = 0;
    global._inc = 0;
    global._cnt = 0;
    global._start = 0;
    global._end = 0;
    global._avg = 999;
    global._startIndex = 0;
    global._sum = 0;
  });

  describe('pricesNeeded function', () => {
    // Copy the pricesNeeded function for testing
    function pricesNeeded(dayIndex) {
      const now = new Date();
      let res = false;

      if (dayIndex === 1) {
        /*
        Getting prices for tomorrow if
          - we have a valid time
          - clock is past 14:00 local time (NOTE: elprisetjustnu.se have prices after 13:00 most days, so 14:00 should be safe)
          - we don't have prices
        */
        res = _.s.timeOK && _.s.p[1].ts === 0 && now.getHours() >= 14;
      } else {
        /*
        Getting prices for today if
          - we have a valid time
          - we don't have prices OR prices aren't for this day
        */
        function getDate(dt) {
          return dt.getDate();
        }

        const dateChanged =
          getDate(new Date(_.s.p[0].ts * 1000)) !== getDate(now);

        //Clear tomorrow data
        if (dateChanged) {
          _.s.p[1].ts = 0;
          _.p[1] = [];
        }

        res = _.s.timeOK && (_.s.p[0].ts === 0 || dateChanged);
      }

      //If fetching prices has failed too many times -> wait until trying again
      const CNST_ERR_LIMIT = 3;
      const CNST_ERR_DELAY = 120;

      function epoch(date) {
        return Math.floor((date ? date.getTime() : Date.now()) / 1000.0);
      }

      if (
        _.s.errCnt >= CNST_ERR_LIMIT &&
        epoch(now) - _.s.errTs < CNST_ERR_DELAY
      ) {
        res = false;
      } else if (_.s.errCnt >= CNST_ERR_LIMIT) {
        //We can clear error counter (time has passed)
        _.s.errCnt = 0;
      }

      return res;
    }

    test('should return true for today when no prices exist and time is OK', () => {
      mockState.s.timeOK = 1;
      mockState.s.p[0].ts = 0;

      expect(pricesNeeded(0)).toBe(true);
    });

    test('should return false for today when time is not OK', () => {
      mockState.s.timeOK = 0;
      mockState.s.p[0].ts = 0;

      expect(pricesNeeded(0)).toBe(0);
    });

    test('should return true for today when date has changed', () => {
      mockState.s.timeOK = 1;
      // Set timestamp to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      mockState.s.p[0].ts = Math.floor(yesterday.getTime() / 1000);

      expect(pricesNeeded(0)).toBe(true);
    });

    test('should return false for today when prices are current', () => {
      mockState.s.timeOK = 1;
      // Set timestamp to today
      mockState.s.p[0].ts = Math.floor(Date.now() / 1000);

      expect(pricesNeeded(0)).toBe(false);
    });

    test('should return true for tomorrow when conditions are met', () => {
      // Mock current time to be after 14:00
      const mockDate = new Date();
      mockDate.setHours(15, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      mockState.s.timeOK = 1;
      mockState.s.p[1].ts = 0;

      expect(pricesNeeded(1)).toBe(true);

      global.Date.mockRestore();
    });

    test('should return false for tomorrow when before 14:00', () => {
      // Mock current time to be before 14:00
      const mockDate = new Date();
      mockDate.setHours(13, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      mockState.s.timeOK = 1;
      mockState.s.p[1].ts = 0;

      expect(pricesNeeded(1)).toBe(false);

      global.Date.mockRestore();
    });

    test('should return false when error limit reached and delay not passed', () => {
      mockState.s.timeOK = 1;
      mockState.s.p[0].ts = 0;
      mockState.s.errCnt = 3;
      mockState.s.errTs = Math.floor(Date.now() / 1000) - 60; // 60 seconds ago

      expect(pricesNeeded(0)).toBe(false);
    });

    test('should clear error count when delay has passed', () => {
      mockState.s.timeOK = 1;
      mockState.s.p[0].ts = 0;
      mockState.s.errCnt = 3;
      mockState.s.errTs = Math.floor(Date.now() / 1000) - 200; // 200 seconds ago

      pricesNeeded(0);

      expect(mockState.s.errCnt).toBe(0);
    });
  });

  describe('updateCurrentPrice function', () => {
    // Copy the updateCurrentPrice function for testing
    function updateCurrentPrice() {
      function epoch(date) {
        return Math.floor((date ? date.getTime() : Date.now()) / 1000.0);
      }

      function isCurrentHour(value, now) {
        const diff = now - value;
        return diff >= 0 && diff < 60 * 60;
      }

      if (!_.s.timeOK || _.s.p[0].ts === 0) {
        _.s.p[0].ts = 0;
        _.s.p[0].now = 0;
        return;
      }

      const now = epoch();

      for (let i = 0; i < _.p[0].length; i++) {
        if (isCurrentHour(_.p[0][i][0], now)) {
          //This hour is active
          _.s.p[0].now = _.p[0][i][1];
          return true;
        }
      }

      //If we are here the active hour wasn't found
      //This means that Shelly clock is wrong or we have prices for wrong date (Shelly clock _was_ wrong, but no longer)
      //All we can do is clear active prices and try again
      //Let's also increase error counter to prevent flooding Elering if things go terribly wrong
      _.s.timeOK = false;
      _.s.p[0].ts = 0;
      _.s.errCnt += 1;
      _.s.errTs = epoch();
    }

    test('should set current price when time is OK and prices exist', () => {
      mockState.s.timeOK = 1;
      mockState.s.p[0].ts = Math.floor(Date.now() / 1000);

      // Set up price data with current hour
      const now = Math.floor(Date.now() / 1000);
      const currentHourStart = now - (now % 3600); // Round down to hour start
      mockState.p[0] = [
        [currentHourStart, 0.15],
        [currentHourStart + 3600, 0.12],
      ];

      const result = updateCurrentPrice();

      expect(mockState.s.p[0].now).toBe(0.15);
      expect(result).toBe(true);
    });

    test('should return early when time is not OK', () => {
      mockState.s.timeOK = 0;
      mockState.s.p[0].ts = 100;
      mockState.s.p[0].now = 0.2;

      updateCurrentPrice();

      expect(mockState.s.p[0].now).toBe(0);
    });

    test('should return early when no price timestamp', () => {
      mockState.s.timeOK = 1;
      mockState.s.p[0].ts = 0;
      mockState.s.p[0].now = 0.2;

      updateCurrentPrice();

      expect(mockState.s.p[0].now).toBe(0);
    });

    test('should handle case when current hour not found in price data', () => {
      mockState.s.timeOK = 1;
      mockState.s.p[0].ts = Math.floor(Date.now() / 1000);
      mockState.s.errCnt = 0;

      // Set up price data without current hour
      const yesterday = Math.floor(Date.now() / 1000) - 86400;
      mockState.p[0] = [
        [yesterday, 0.15],
        [yesterday + 3600, 0.12],
      ];

      updateCurrentPrice();

      expect(mockState.s.timeOK).toBe(false);
      expect(mockState.s.p[0].ts).toBe(0);
      expect(mockState.s.errCnt).toBe(1);
    });
  });

  describe('isCheapestHour function (simplified)', () => {
    // This is a simplified version of the complex isCheapestHour function
    // Testing the full function would require extensive setup

    function isCurrentHour(value, now) {
      const diff = now - value;
      return diff >= 0 && diff < 60 * 60;
    }

    function epoch(date) {
      return Math.floor((date ? date.getTime() : Date.now()) / 1000.0);
    }

    function limit(min, value, max) {
      return Math.min(max, Math.max(min, value));
    }

    // Simplified version for testing core logic
    function isCheapestHourSimplified(inst, priceData, config) {
      const cfg = config;

      // Safety checks
      cfg.m2.c = limit(0, cfg.m2.c, 24);

      if (cfg.m2.c <= 0) return false;

      // Sort prices by value to find cheapest
      const sortedPrices = [...priceData].sort((a, b) => a[1] - b[1]);
      const cheapestHours = sortedPrices.slice(0, cfg.m2.c);

      // Check if current hour is among the cheapest
      const epochNow = epoch();

      for (let i = 0; i < cheapestHours.length; i++) {
        if (isCurrentHour(cheapestHours[i][0], epochNow)) {
          return true;
        }
      }

      return false;
    }

    test('should return true when current hour is among cheapest', () => {
      const now = Math.floor(Date.now() / 1000);
      const currentHourStart = now - (now % 3600);

      const priceData = [
        [currentHourStart, 0.1], // Current hour - cheapest
        [currentHourStart + 3600, 0.15],
        [currentHourStart + 7200, 0.2],
        [currentHourStart + 10800, 0.25],
      ];

      const config = {
        m2: {
          c: 2, // Want 2 cheapest hours
          p: 24, // 24 hour period
        },
      };

      expect(isCheapestHourSimplified(0, priceData, config)).toBe(true);
    });

    test('should return false when current hour is not among cheapest', () => {
      const now = Math.floor(Date.now() / 1000);
      const currentHourStart = now - (now % 3600);

      const priceData = [
        [currentHourStart - 3600, 0.1], // Previous hour - cheapest
        [currentHourStart, 0.25], // Current hour - expensive
        [currentHourStart + 3600, 0.15],
        [currentHourStart + 7200, 0.12],
      ];

      const config = {
        m2: {
          c: 2, // Want 2 cheapest hours
          p: 24, // 24 hour period
        },
      };

      expect(isCheapestHourSimplified(0, priceData, config)).toBe(false);
    });

    test('should handle zero cheapest hours config', () => {
      const priceData = mockPriceData.today;
      const config = {
        m2: {
          c: 0, // No cheapest hours
          p: 24,
        },
      };

      expect(isCheapestHourSimplified(0, priceData, config)).toBe(false);
    });

    test('should limit cheapest hours to available data', () => {
      const now = Math.floor(Date.now() / 1000);
      const currentHourStart = now - (now % 3600);

      const priceData = [
        [currentHourStart, 0.15], // Current hour
        [currentHourStart + 3600, 0.2],
      ];

      const config = {
        m2: {
          c: 5, // Want 5 cheapest hours but only have 2
          p: 24,
        },
      };

      // Should still work with available data
      expect(isCheapestHourSimplified(0, priceData, config)).toBe(true);
    });
  });

  describe('logicRunNeeded function', () => {
    // Copy the logicRunNeeded function for testing
    function logicRunNeeded(inst) {
      function epoch(date) {
        return Math.floor((date ? date.getTime() : Date.now()) / 1000.0);
      }

      //Shortcuts
      const st = _.si[inst];
      const cfg = _.c.i[inst];

      //If not enabled, do nothing
      if (cfg.en !== 1) {
        //clear history
        _.h[inst] = [];
        return false;
      }

      const now = new Date();
      const chk = new Date(st.chkTs * 1000);

      /*
        Logic should be run if
        - never run before
        - hour has changed
        - year has changed (= time has been received)
        - manually forced command is active and time has passed
        - user wants the output to be commanded only for x first minutes of the hour which has passed (and command is not yet reset)
      */
      return (
        st.chkTs === 0 ||
        chk.getHours() !== now.getHours() ||
        chk.getFullYear() !== now.getFullYear() ||
        (st.fCmdTs > 0 && st.fCmdTs - epoch(now) < 0) ||
        (st.fCmdTs === 0 &&
          cfg.m < 60 &&
          now.getMinutes() >= cfg.m &&
          st.cmd + cfg.i === 1)
      );
    }

    test('should return false when instance is disabled', () => {
      mockState.c.i[0].en = 0;
      mockState.si[0].chkTs = 0;

      expect(logicRunNeeded(0)).toBe(false);
      expect(mockState.h[0]).toEqual([]); // History should be cleared
    });

    test('should return true when never run before', () => {
      mockState.c.i[0].en = 1;
      mockState.si[0].chkTs = 0;

      expect(logicRunNeeded(0)).toBe(true);
    });

    test('should return true when hour has changed', () => {
      mockState.c.i[0].en = 1;

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      mockState.si[0].chkTs = Math.floor(oneHourAgo.getTime() / 1000);

      expect(logicRunNeeded(0)).toBe(true);
    });

    test('should return false when same hour and no other conditions', () => {
      mockState.c.i[0].en = 1;
      mockState.c.i[0].m = 60; // Full hour
      mockState.si[0].fCmdTs = 0;

      const now = new Date();
      mockState.si[0].chkTs = Math.floor(now.getTime() / 1000) - 60; // 1 minute ago, same hour

      expect(logicRunNeeded(0)).toBe(false);
    });

    test('should return true when forced command time has passed', () => {
      mockState.c.i[0].en = 1;

      const now = new Date();
      mockState.si[0].chkTs = Math.floor(now.getTime() / 1000) - 60;
      mockState.si[0].fCmdTs = Math.floor(now.getTime() / 1000) - 30; // Force expired 30 seconds ago

      expect(logicRunNeeded(0)).toBe(true);
    });

    test('should return false when forced command is still active', () => {
      mockState.c.i[0].en = 1;

      const now = new Date();
      mockState.si[0].chkTs = Math.floor(now.getTime() / 1000) - 60;
      mockState.si[0].fCmdTs = Math.floor(now.getTime() / 1000) + 300; // Force active for 5 more minutes

      expect(logicRunNeeded(0)).toBe(false);
    });

    test('should return true when minute limit reached and output should be reset', () => {
      mockState.c.i[0].en = 1;
      mockState.c.i[0].m = 30; // Output only for first 30 minutes
      mockState.c.i[0].i = 0; // Not inverted
      mockState.si[0].fCmdTs = 0;
      mockState.si[0].cmd = 1; // Currently on

      // Mock current time to be past 30 minutes
      const mockDate = new Date();
      mockDate.setMinutes(35);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const now = new Date();
      mockState.si[0].chkTs = Math.floor(now.getTime() / 1000) - 60;

      expect(logicRunNeeded(0)).toBe(true);

      global.Date.mockRestore();
    });
  });
});
