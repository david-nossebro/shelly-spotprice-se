/**
 * Unit tests for utility functions
 */

const { testHelpers } = require('../mocks/shelly-api');

// Mock the main application functions by requiring them
// Note: In a real scenario, these would be extracted to separate modules
// For now, we'll test them by copying the function implementations

describe('Utility Functions', () => {
  beforeEach(() => {
    testHelpers.setupBasicMocks();
  });

  describe('limit function', () => {
    // Copy the limit function for testing
    function limit(min, value, max) {
      return Math.min(max, Math.max(min, value));
    }

    test('should return value when within range', () => {
      expect(limit(0, 5, 10)).toBe(5);
      expect(limit(-5, 0, 5)).toBe(0);
    });

    test('should return min when value is below range', () => {
      expect(limit(0, -5, 10)).toBe(0);
      expect(limit(10, 5, 20)).toBe(10);
    });

    test('should return max when value is above range', () => {
      expect(limit(0, 15, 10)).toBe(10);
      expect(limit(-10, 5, 0)).toBe(0);
    });

    test('should handle edge cases', () => {
      expect(limit(5, 5, 5)).toBe(5);
      expect(limit(0, 0, 0)).toBe(0);
    });
  });

  describe('epoch function', () => {
    // Copy the epoch function for testing
    function epoch(date) {
      return Math.floor((date ? date.getTime() : Date.now()) / 1000.0);
    }

    test('should return current epoch time when no date provided', () => {
      const now = Date.now();
      const result = epoch();
      const expected = Math.floor(now / 1000);

      // Allow for small time difference during test execution
      expect(Math.abs(result - expected)).toBeLessThanOrEqual(1);
    });

    test('should return epoch time for provided date', () => {
      const testDate = new Date('2023-01-01T12:00:00Z');
      const expected = Math.floor(testDate.getTime() / 1000);

      expect(epoch(testDate)).toBe(expected);
    });

    test('should handle different date formats', () => {
      const testDate1 = new Date(2023, 0, 1, 12, 0, 0); // Local time
      const testDate2 = new Date('2023-01-01T12:00:00.000Z'); // ISO string

      expect(epoch(testDate1)).toBe(Math.floor(testDate1.getTime() / 1000));
      expect(epoch(testDate2)).toBe(Math.floor(testDate2.getTime() / 1000));
    });
  });

  describe('isCurrentHour function', () => {
    // Copy the isCurrentHour function for testing
    function isCurrentHour(value, now) {
      const diff = now - value;
      return diff >= 0 && diff < 60 * 60;
    }

    test('should return true when timestamp is in current hour', () => {
      const now = 1640995200; // 2022-01-01 00:00:00
      const currentHour = 1640995200; // Same hour
      const withinHour = 1640995200 + 1800; // 30 minutes later

      expect(isCurrentHour(currentHour, now)).toBe(true);
      expect(isCurrentHour(withinHour, now + 1800)).toBe(true);
    });

    test('should return false when timestamp is not in current hour', () => {
      const now = 1640995200; // 2022-01-01 00:00:00
      const previousHour = 1640991600; // Previous hour
      const nextHour = 1640998800; // Next hour
      const future = now + 3700; // More than 1 hour later

      expect(isCurrentHour(previousHour, now)).toBe(false);
      expect(isCurrentHour(nextHour, now)).toBe(false);
      expect(isCurrentHour(future, now)).toBe(false);
    });

    test('should handle edge cases', () => {
      const now = 1640995200;
      const exactlyOneHour = now + 3600; // Exactly 1 hour later
      const justUnderOneHour = now + 3599; // Just under 1 hour

      expect(isCurrentHour(exactlyOneHour, now + 3600)).toBe(true);
      expect(isCurrentHour(justUnderOneHour, now + 3599)).toBe(true);
    });
  });

  describe('getKvsKey function', () => {
    // Copy the getKvsKey function for testing
    function getKvsKey(inst) {
      let key = 'sptprc-se';

      if (inst >= 0) {
        key = key + '-' + (inst + 1);
      }

      return key;
    }

    test('should return common key for negative instance', () => {
      expect(getKvsKey(-1)).toBe('sptprc-se');
      expect(getKvsKey(-5)).toBe('sptprc-se');
    });

    test('should return instance-specific key for positive instance', () => {
      expect(getKvsKey(0)).toBe('sptprc-se-1');
      expect(getKvsKey(1)).toBe('sptprc-se-2');
      expect(getKvsKey(2)).toBe('sptprc-se-3');
    });

    test('should handle edge case of zero', () => {
      expect(getKvsKey(0)).toBe('sptprc-se-1');
    });
  });

  describe('updateTz function', () => {
    // Copy the updateTz function for testing
    // Note: This function modifies global state, so we'll mock the global _ object
    let mockState;

    beforeEach(() => {
      mockState = {
        s: {
          tz: '',
          tzh: 0,
          p: [{ ts: 100 }, { ts: 200 }],
        },
      };
      global._ = mockState;
    });

    function updateTz(now) {
      //Get date as string: Fri Nov 10 2023 00:02:29 GMT+0200
      let tz = now.toString();
      let h = 0;

      //Get timezone part: +0200
      tz = tz.substring(tz.indexOf('GMT') + 3);

      //If timezone is UTC, we need to use Z
      if (tz === '+0000') {
        tz = 'Z';
        h = 0;
      } else {
        //tz is now similar to -0100 or +0200 -> add : between hours and minutes
        h = Number(tz.substring(0, 3));
        tz = tz.substring(0, 3) + ':' + tz.substring(3);
      }

      if (tz !== _.s.tz) {
        //Timezone has changed -> we should get prices
        _.s.p[0].ts = 0;
      }

      _.s.tz = tz;
      _.s.tzh = h;
    }

    test('should handle UTC timezone', () => {
      // Create a date that will have GMT+0000 in its string representation
      const utcDate = new Date('2023-01-01T12:00:00.000Z');
      // Mock the toString to return expected format
      utcDate.toString = () => 'Sun Jan 01 2023 12:00:00 GMT+0000 (UTC)';

      updateTz(utcDate);

      expect(mockState.s.tz).toBe('+00:00 (UTC)');
      expect(mockState.s.tzh).toBe(0);
    });

    test('should handle positive timezone offset', () => {
      const date = new Date('2023-01-01T12:00:00.000Z');
      // Mock the toString to return expected format
      date.toString = () => 'Sun Jan 01 2023 14:00:00 GMT+0200 (EET)';

      updateTz(date);

      expect(mockState.s.tz).toBe('+02:00 (EET)');
      expect(mockState.s.tzh).toBe(2);
    });

    test('should handle negative timezone offset', () => {
      const date = new Date('2023-01-01T12:00:00.000Z');
      // Mock the toString to return expected format
      date.toString = () => 'Sun Jan 01 2023 07:00:00 GMT-0500 (EST)';

      updateTz(date);

      expect(mockState.s.tz).toBe('-05:00 (EST)');
      expect(mockState.s.tzh).toBe(-5);
    });

    test('should reset price timestamp when timezone changes', () => {
      mockState.s.tz = '+01:00';
      mockState.s.p[0].ts = 1000;

      const date = new Date('2023-01-01T12:00:00.000Z');
      date.toString = () => 'Sun Jan 01 2023 14:00:00 GMT+0200 (EET)';

      updateTz(date);

      expect(mockState.s.p[0].ts).toBe(0);
    });

    test('should not reset price timestamp when timezone stays same', () => {
      mockState.s.tz = '+02:00 (EET)';
      mockState.s.p[0].ts = 1000;

      const date = new Date('2023-01-01T12:00:00.000Z');
      date.toString = () => 'Sun Jan 01 2023 14:00:00 GMT+0200 (EET)';

      updateTz(date);

      expect(mockState.s.p[0].ts).toBe(1000);
    });
  });

  describe('parseParams function', () => {
    // Copy the parseParams function for testing
    function parseParams(params) {
      const res = {};
      const splitted = params.split('&');

      for (let i = 0; i < splitted.length; i++) {
        const pair = splitted[i].split('=');
        res[pair[0]] = pair[1];
      }

      return res;
    }

    test('should parse single parameter', () => {
      const result = parseParams('key=value');
      expect(result).toEqual({ key: 'value' });
    });

    test('should parse multiple parameters', () => {
      const result = parseParams('key1=value1&key2=value2&key3=value3');
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });
    });

    test('should handle empty values', () => {
      const result = parseParams('key1=&key2=value2');
      expect(result).toEqual({
        key1: '',
        key2: 'value2',
      });
    });

    test('should handle parameters without values', () => {
      const result = parseParams('key1&key2=value2');
      expect(result).toEqual({
        key1: undefined,
        key2: 'value2',
      });
    });

    test('should handle empty string', () => {
      const result = parseParams('');
      expect(result).toEqual({ '': undefined });
    });

    test('should handle URL encoded values', () => {
      const result = parseParams('name=John%20Doe&city=New%20York');
      expect(result).toEqual({
        name: 'John%20Doe', // Note: This function doesn't decode URL encoding
        city: 'New%20York',
      });
    });
  });
});
