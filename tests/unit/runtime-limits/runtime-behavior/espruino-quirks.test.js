/**
 * Espruino / runtime behavior tests
 *
 * Validate behavior of mocked Espruino-like Timer and related quirks.
 */

const { testHelpers, mockTimer } = require('../../../mocks/shelly-api');

describe('Espruino runtime quirks (Timer behavior)', () => {
  beforeEach(() => {
    testHelpers.setupBasicMocks();
    // mockTimer.reset(); // This is now done within testHelpers.setupBasicMocks()
  });

  test('non-repeating timer is removed after trigger', () => {
    const cb = jest.fn();
    const id = mockTimer.set(1000, false, cb, 'userdata');

    // Timer should be registered
    expect(mockTimer._timers.has(id)).toBe(true);

    // Trigger should call callback with userdata and remove non-repeating timer
    mockTimer.trigger(id);
    expect(cb).toHaveBeenCalledWith('userdata');
    expect(mockTimer._timers.has(id)).toBe(false);
  });

  test('repeating timer remains after trigger', () => {
    const cb = jest.fn();
    const id = mockTimer.set(1000, true, cb, null);

    expect(mockTimer._timers.has(id)).toBe(true);

    // Trigger repeating timer
    mockTimer.trigger(id);
    expect(cb).toHaveBeenCalled();
    // Repeating timer should still be present
    expect(mockTimer._timers.has(id)).toBe(true);
  });

  test('clear returns true for existing timer and false for unknown id', () => {
    const cb = jest.fn();
    const id = mockTimer.set(100, false, cb);

    // Clearing existing timer should succeed
    const cleared = mockTimer.clear(id);
    expect(cleared).toBe(true);
    expect(mockTimer._timers.has(id)).toBe(false);

    // Clearing again (or unknown id) should return false
    expect(mockTimer.clear(id)).toBe(false);
    expect(mockTimer.clear(9999)).toBe(false);
  });
});