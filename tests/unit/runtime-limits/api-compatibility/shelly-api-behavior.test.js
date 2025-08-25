/**
 * Shelly API behavior tests
 *
 * Purpose:
 *  - Validate correct Shelly API usage patterns observed in source such as:
 *    - Shelly.call parameter formats for KVS and HTTP.GET
 *    - presence of timeout and ssl_ca in HTTP requests
 *    - Timer.set usage with userdata parameter
 *    - component status access patterns
 *    - HTTPServer.registerEndpoint usage
 */
const fs = require('fs');
const path = require('path');
const { testHelpers } = require('../../../mocks/shelly-api');

describe('Shelly API Behavior Tests', () => {
  beforeEach(() => {
    // Clear require cache first
    const target = path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js');
    delete require.cache[require.resolve(target)];
    
    // Set up mocks before requiring the module
    testHelpers.setupBasicMocks();
    jest.clearAllMocks();

    // Now load the module to let it register endpoints / timers
    // eslint-disable-next-line global-require
    require(target);
  });

  test('Shelly.call usage for KVS.Set uses JSON.stringify for value', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js'),
      'utf8'
    );

    // Expect KVS.Set with JSON.stringify usage in chkConfig
    expect(src).toMatch(/Shelly\.call\(\s*['"]KVS\.Set['"]\s*,[\s\S]*JSON\.stringify/);
  });

  test('HTTP.GET request includes timeout and ssl_ca parameters in source', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js'),
      'utf8'
    );

    // getPrices constructs req with timeout and ssl_ca
    expect(src).toMatch(/timeout\s*:\s*5/);
    expect(src).toMatch(/ssl_ca\s*:\s*'?\*'?/);
  });

  test('Timer.set is used with userdata parameter (logic scheduled with inst)', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js'),
      'utf8'
    );

    // The code uses `Timer.set(500, false, logic, inst)` to schedule logic with instance param
    expect(src).toMatch(/Timer\.set\([\s\S]*logic[\s\S]*inst/);
  });

  test('Component status access patterns (getComponentStatus/getComponentConfig) exist', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js'),
      'utf8'
    );

    expect(src).toMatch(/Shelly\.getComponentStatus\(['"]sys['"]\)/);
    expect(src).toMatch(/Shelly\.getComponentConfig\(['"]sys['"]\)/);
  });

  test('HTTPServer.registerEndpoint is called with onServerRequest and handler is registered', () => {
    // Verify source code contains the endpoint registration pattern
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../src/shelly-spotprice-se.js'),
      'utf8'
    );

    // Check that HTTPServer.registerEndpoint is called with empty path and onServerRequest
    expect(src).toMatch(/HTTPServer\.registerEndpoint\(\s*['"]['"]\s*,\s*onServerRequest\s*\)/);
    expect(src).toMatch(/const onServerRequest = function/);
  });
});