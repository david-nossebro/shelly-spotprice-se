/**
 * Unit tests for configuration validation functions
 */

const { testHelpers } = require('../mocks/shelly-api');

describe('Configuration Validation Functions', () => {
  let mockState;

  beforeEach(() => {
    testHelpers.setupBasicMocks();
    mockState = testHelpers.createMockState();
    global._ = mockState;
  });

  describe('chkConfig function (simplified)', () => {
    // Simplified version of chkConfig for testing core validation logic
    function chkConfigSimplified(inst, defaultConfig, targetConfig) {
      let count = 0;

      // Note: Hard-coded to max 2 levels (as in original)
      for (const prop in defaultConfig) {
        if (typeof targetConfig[prop] === 'undefined') {
          targetConfig[prop] = defaultConfig[prop];
          count++;
        } else if (typeof defaultConfig[prop] === 'object') {
          for (const innerProp in defaultConfig[prop]) {
            if (typeof targetConfig[prop][innerProp] === 'undefined') {
              targetConfig[prop][innerProp] = defaultConfig[prop][innerProp];
              count++;
            }
          }
        }
      }

      return count;
    }

    test('should add missing top-level properties', () => {
      const defaultConfig = {
        g: 'SE3',
        vat: 25,
        day: 0,
      };

      const targetConfig = {
        g: 'SE1',
      };

      const count = chkConfigSimplified(-1, defaultConfig, targetConfig);

      expect(count).toBe(2);
      expect(targetConfig.vat).toBe(25);
      expect(targetConfig.day).toBe(0);
      expect(targetConfig.g).toBe('SE1'); // Should not overwrite existing
    });

    test('should add missing nested properties', () => {
      const defaultConfig = {
        m0: {
          c: 0,
        },
        m1: {
          l: 0,
        },
        m2: {
          p: 24,
          c: 0,
          l: -999,
        },
      };

      const targetConfig = {
        m0: {
          c: 1,
        },
        m1: {},
        m2: {
          p: 12,
        },
      };

      const count = chkConfigSimplified(0, defaultConfig, targetConfig);

      expect(count).toBe(3); // m1.l, m2.c, m2.l
      expect(targetConfig.m0.c).toBe(1); // Should not overwrite existing
      expect(targetConfig.m1.l).toBe(0);
      expect(targetConfig.m2.p).toBe(12); // Should not overwrite existing
      expect(targetConfig.m2.c).toBe(0);
      expect(targetConfig.m2.l).toBe(-999);
    });

    test('should return 0 when no properties are missing', () => {
      const defaultConfig = {
        g: 'SE3',
        vat: 25,
      };

      const targetConfig = {
        g: 'SE1',
        vat: 20,
      };

      const count = chkConfigSimplified(-1, defaultConfig, targetConfig);

      expect(count).toBe(0);
      expect(targetConfig.g).toBe('SE1');
      expect(targetConfig.vat).toBe(20);
    });

    test('should handle empty target config', () => {
      const defaultConfig = {
        g: 'SE3',
        vat: 25,
        m0: {
          c: 0,
        },
      };

      const targetConfig = {};

      const count = chkConfigSimplified(-1, defaultConfig, targetConfig);

      expect(count).toBe(3); // g, vat, m0
      expect(targetConfig.g).toBe('SE3');
      expect(targetConfig.vat).toBe(25);
      expect(targetConfig.m0).toEqual({ c: 0 });
    });

    test('should handle nested objects with partial properties', () => {
      const defaultConfig = {
        m2: {
          p: 24,
          c: 0,
          l: -999,
          s: 0,
          m: 999,
        },
      };

      const targetConfig = {
        m2: {
          p: 12,
          c: 4,
        },
      };

      const count = chkConfigSimplified(0, defaultConfig, targetConfig);

      expect(count).toBe(3); // l, s, m
      expect(targetConfig.m2.p).toBe(12);
      expect(targetConfig.m2.c).toBe(4);
      expect(targetConfig.m2.l).toBe(-999);
      expect(targetConfig.m2.s).toBe(0);
      expect(targetConfig.m2.m).toBe(999);
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

    test('should generate correct keys for different instances', () => {
      expect(getKvsKey(-1)).toBe('sptprc-se');
      expect(getKvsKey(0)).toBe('sptprc-se-1');
      expect(getKvsKey(1)).toBe('sptprc-se-2');
      expect(getKvsKey(2)).toBe('sptprc-se-3');
    });
  });

  describe('Configuration validation helpers', () => {
    // Test helper functions for configuration validation

    function validatePriceRegion(region) {
      const validRegions = ['SE1', 'SE2', 'SE3', 'SE4'];
      return validRegions.includes(region);
    }

    function validateVAT(vat) {
      return typeof vat === 'number' && vat >= 0 && vat <= 100;
    }

    function validateTransferFee(fee) {
      return typeof fee === 'number' && fee >= 0;
    }

    function validateMode(mode) {
      return [0, 1, 2].includes(mode);
    }

    function validateOutputIds(outputs) {
      return (
        Array.isArray(outputs) &&
        outputs.length > 0 &&
        outputs.every(id => typeof id === 'number' && id >= 0)
      );
    }

    function validateCheapestHoursConfig(config) {
      return (
        typeof config.p === 'number' &&
        config.p >= -2 &&
        typeof config.c === 'number' &&
        config.c >= 0 &&
        typeof config.s === 'number' &&
        [0, 1].includes(config.s)
      );
    }

    test('should validate price regions correctly', () => {
      expect(validatePriceRegion('SE1')).toBe(true);
      expect(validatePriceRegion('SE2')).toBe(true);
      expect(validatePriceRegion('SE3')).toBe(true);
      expect(validatePriceRegion('SE4')).toBe(true);
      expect(validatePriceRegion('SE5')).toBe(false);
      expect(validatePriceRegion('NO1')).toBe(false);
      expect(validatePriceRegion('')).toBe(false);
    });

    test('should validate VAT percentage correctly', () => {
      expect(validateVAT(25)).toBe(true);
      expect(validateVAT(0)).toBe(true);
      expect(validateVAT(100)).toBe(true);
      expect(validateVAT(-1)).toBe(false);
      expect(validateVAT(101)).toBe(false);
      expect(validateVAT('25')).toBe(false);
    });

    test('should validate transfer fees correctly', () => {
      expect(validateTransferFee(0)).toBe(true);
      expect(validateTransferFee(4.5)).toBe(true);
      expect(validateTransferFee(10)).toBe(true);
      expect(validateTransferFee(-1)).toBe(false);
      expect(validateTransferFee('4.5')).toBe(false);
    });

    test('should validate mode correctly', () => {
      expect(validateMode(0)).toBe(true);
      expect(validateMode(1)).toBe(true);
      expect(validateMode(2)).toBe(true);
      expect(validateMode(3)).toBe(false);
      expect(validateMode(-1)).toBe(false);
      expect(validateMode('1')).toBe(false);
    });

    test('should validate output IDs correctly', () => {
      expect(validateOutputIds([0])).toBe(true);
      expect(validateOutputIds([0, 1])).toBe(true);
      expect(validateOutputIds([0, 1, 2, 3])).toBe(true);
      expect(validateOutputIds([])).toBe(false);
      expect(validateOutputIds([0, -1])).toBe(false);
      expect(validateOutputIds(['0'])).toBe(false);
      expect(validateOutputIds(0)).toBe(false);
    });

    test('should validate cheapest hours config correctly', () => {
      expect(validateCheapestHoursConfig({ p: 24, c: 4, s: 0 })).toBe(true);
      expect(validateCheapestHoursConfig({ p: -1, c: 2, s: 1 })).toBe(true);
      expect(validateCheapestHoursConfig({ p: -2, c: 3, s: 0 })).toBe(true);
      expect(validateCheapestHoursConfig({ p: -3, c: 4, s: 0 })).toBe(false);
      expect(validateCheapestHoursConfig({ p: 24, c: -1, s: 0 })).toBe(false);
      expect(validateCheapestHoursConfig({ p: 24, c: 4, s: 2 })).toBe(false);
    });
  });

  describe('Configuration merging and defaults', () => {
    test('should merge common configuration with defaults', () => {
      const defaultCommon = {
        g: 'SE3',
        vat: 25,
        day: 0,
        night: 0,
        names: [],
      };

      const userCommon = {
        g: 'SE1',
        vat: 20,
        day: 4.5,
      };

      const merged = { ...defaultCommon, ...userCommon };

      expect(merged.g).toBe('SE1');
      expect(merged.vat).toBe(20);
      expect(merged.day).toBe(4.5);
      expect(merged.night).toBe(0); // From default
      expect(merged.names).toEqual([]); // From default
    });

    test('should merge instance configuration with defaults', () => {
      const defaultInstance = {
        en: 0,
        mode: 0,
        m0: { c: 0 },
        m1: { l: 0 },
        m2: { p: 24, c: 0, l: -999, s: 0, m: 999 },
        o: [0],
        i: 0,
      };

      const userInstance = {
        en: 1,
        mode: 2,
        m2: { p: 12, c: 4 },
        o: [0, 1],
      };

      const merged = {
        ...defaultInstance,
        ...userInstance,
        m2: { ...defaultInstance.m2, ...userInstance.m2 },
      };

      expect(merged.en).toBe(1);
      expect(merged.mode).toBe(2);
      expect(merged.m2.p).toBe(12);
      expect(merged.m2.c).toBe(4);
      expect(merged.m2.l).toBe(-999); // From default
      expect(merged.m2.s).toBe(0); // From default
      expect(merged.o).toEqual([0, 1]);
    });

    test('should handle deep nested configuration merging', () => {
      const defaultConfig = {
        level1: {
          level2: {
            prop1: 'default1',
            prop2: 'default2',
            prop3: 'default3',
          },
        },
      };

      const userConfig = {
        level1: {
          level2: {
            prop1: 'user1',
            prop3: 'user3',
          },
        },
      };

      // Simulate the 2-level deep merging from chkConfig
      // The actual chkConfig function only merges 2 levels deep, so level2 gets completely replaced
      const merged = { ...defaultConfig };
      for (const prop in userConfig) {
        if (
          typeof userConfig[prop] === 'object' &&
          typeof merged[prop] === 'object'
        ) {
          merged[prop] = { ...merged[prop], ...userConfig[prop] };
        } else {
          merged[prop] = userConfig[prop];
        }
      }

      expect(merged.level1.level2.prop1).toBe('user1');
      expect(merged.level1.level2.prop2).toBeUndefined(); // This gets overwritten in shallow merge
      expect(merged.level1.level2.prop3).toBe('user3');
    });
  });
});
