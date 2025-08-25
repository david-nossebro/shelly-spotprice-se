/**
 * String manipulation efficiency tests
 *
 * Purpose:
 *  - Validate string-heavy operations like HTTP response generation and JSON processing
 *  - Test performance characteristics of string operations that are critical in Shelly environment
 */

describe('String Manipulation Tests', () => {
  test('Large JSON.stringify operations performance (CI-safe)', () => {
    // Create a moderately sized object to stringify
    const testData = {
      prices: Array.from({ length: 24 }, (_, i) => [Date.now() + i * 3600000, Math.random()]),
      config: {
        instances: Array.from({ length: 3 }, (_, i) => ({
          id: i,
          enabled: true,
          settings: { mode: 1, threshold: 0.15 }
        }))
      }
    };

    const start = Date.now();
    const result = JSON.stringify(testData);
    const elapsed = Date.now() - start;

    // Should complete quickly (under 50ms for CI safety)
    expect(elapsed).toBeLessThan(50);
    expect(result).toContain('"prices"');
    expect(result.length).toBeGreaterThan(100);
  });

  test('URL construction string concatenation efficiency', () => {
    const baseUrl = 'https://www.elprisetjustnu.se/api/v1/prices/';
    const year = 2023;
    const month = '12';
    const date = '25';
    const region = 'SE3';

    const start = Date.now();
    const url = baseUrl + year + '/' + month + '-' + date + '_' + region + '.json';
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(10);
    expect(url).toBe('https://www.elprisetjustnu.se/api/v1/prices/2023/12-25_SE3.json');
  });

  test('Timezone string parsing and manipulation (emulating updateTz)', () => {
    // Simulate timezone string manipulation from Date.toString()
    const testDateString = 'Fri Nov 10 2023 00:02:29 GMT+0200';
    
    const start = Date.now();
    
    // Extract timezone part: +0200
    let tz = testDateString.substring(testDateString.indexOf('GMT') + 3);
    
    // Convert to expected format
    if (tz === '+0000') {
      tz = 'Z';
    } else {
      // Add colon: +02:00
      tz = tz.substring(0, 3) + ':' + tz.substring(3);
    }
    
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(10);
    expect(tz).toBe('+02:00');
  });

  test('Query parameter parsing efficiency', () => {
    const queryString = 'r=s&i=0&mode=1&limit=0.15&force=true';
    
    const start = Date.now();
    
    const params = {};
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].split('=');
      params[pair[0]] = pair[1];
    }
    
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(10);
    expect(params).toEqual({
      r: 's',
      i: '0',
      mode: '1',
      limit: '0.15',
      force: 'true'
    });
  });
});