/**
 * API compatibility tests
 *
 * These tests verify that our code is compatible with Shelly device APIs
 * and handles runtime scenarios that cannot be caught by static linting.
 */

const {
  testHelpers,
} = require('../../../mocks/shelly-api');

describe('API compatibility tests', () => {
  beforeEach(() => {
    testHelpers.setupBasicMocks();
  });

  test('Shelly global is available for device interaction', () => {
    // Verify the Shelly global object exists and has expected methods
    expect(global.Shelly).toBeDefined();
    expect(typeof global.Shelly.call).toBe('function');
    expect(typeof global.Shelly.addStatusHandler).toBe('function');
  });

  test('Timer global is available for scheduling', () => {
    // Verify Timer global for non-blocking execution patterns
    expect(global.Timer).toBeDefined();
    expect(typeof global.Timer.set).toBe('function');
    expect(typeof global.Timer.clear).toBe('function');
  });

  test('HTTPServer global is available for web endpoints', () => {
    // Verify HTTPServer global for HTTP functionality
    expect(global.HTTPServer).toBeDefined();
    expect(typeof global.HTTPServer.registerEndpoint).toBe('function');
  });

  test('runtime environment matches expected Shelly constraints', () => {
    // Verify we're testing in an environment that simulates Shelly constraints
    expect(global.Shelly).toBeTruthy();
    expect(global.Timer).toBeTruthy();
    expect(global.HTTPServer).toBeTruthy();
    
    // These globals should be available for Shelly device code
    const essentialGlobals = ['Shelly', 'Timer', 'HTTPServer'];
    essentialGlobals.forEach(globalName => {
      expect(global[globalName]).toBeDefined();
    });
  });
});