# Internal API Reference

## Overview

This document provides comprehensive documentation for the internal APIs, functions, and interfaces within the shelly-spotprice-se system. It serves as a reference for understanding function signatures, parameters, return values, and usage patterns.

## Core Functions

### State Management

#### `updateState()`
**Location**: [`src/shelly-spotprice-se.js:343`](../src/shelly-spotprice-se.js:343)

Updates the global system state on each loop iteration.

```javascript
function updateState()
```

**Description**: 
- Checks NTP synchronization status via Shelly API
- Updates device name from system configuration
- Detects significant time changes (>5 minutes) and triggers price refresh
- Counts enabled instances
- Sets system uptime timestamp on first successful time sync

**Side Effects**:
- Modifies `_.s.timeOK`, `_.s.dn`, `_.s.enCnt`, `_.s.upTs`
- May clear price data if time change detected
- Updates `prevEpoch` global variable

**Dependencies**: 
- `Shelly.getComponentStatus("sys")`
- `Shelly.getComponentConfig("sys")`

---

#### `getConfig(inst)`
**Location**: [`src/shelly-spotprice-se.js:441`](../src/shelly-spotprice-se.js:441)

Loads configuration from KVS storage for specified instance or common settings.

```javascript
function getConfig(inst)
```

**Parameters**:
- `inst` (number): Instance index (0-based) or -1 for common configuration

**Description**:
- Retrieves configuration from KVS using generated key
- Parses JSON configuration data
- Calls `USER_CONFIG` hook if defined
- Validates configuration and adds missing defaults
- Updates configuration status flags
- Triggers new loop iteration

**Side Effects**:
- Modifies `_.c.c` (if inst < 0) or `_.c.i[inst]`
- Updates `_.s.configOK` or `_.si[inst].configOK`
- Resets `_.si[inst].chkTs` to trigger logic re-run
- Sets `loopRunning = false`

**Dependencies**:
- `Shelly.call('KVS.Get', ...)`
- `chkConfig()`
- `USER_CONFIG()` (optional)

---

#### `chkConfig(inst, callback)`
**Location**: [`src/shelly-spotprice-se.js:384`](../src/shelly-spotprice-se.js:384)

Validates configuration and adds missing keys with default values.

```javascript
function chkConfig(inst, callback)
```

**Parameters**:
- `inst` (number): Instance index or -1 for common configuration
- `callback` (function): Called with success status `callback(boolean)`

**Description**:
- Compares current configuration with default templates
- Adds missing properties up to 2 levels deep
- Saves updated configuration to KVS if changes made
- Cleans up default configuration templates to save memory

**Return Value**: Via callback - `true` if successful, `false` if KVS save failed

**Side Effects**:
- May modify configuration objects
- May trigger KVS.Set operation
- Deletes `CNST.DEF_CFG` after all instances processed

---

### Price Management

#### `getPrices(dayIndex)`
**Location**: [`src/shelly-spotprice-se.js:632`](../src/shelly-spotprice-se.js:632)

Fetches electricity spot prices from elprisetjustnu.se API.

```javascript
function getPrices(dayIndex)
```

**Parameters**:
- `dayIndex` (number): 0 for today, 1 for tomorrow

**Description**:
- Constructs API URL based on date and region (`_.c.c.g`)
- Makes HTTP GET request with 5-second timeout
- Processes price data applying VAT and transfer fees
- Calculates daily statistics (min, max, average)
- Validates data completeness (minimum 23 hours)
- Updates price arrays and metadata

**Side Effects**:
- Updates `_.p[dayIndex]` with price data arrays
- Updates `_.s.p[dayIndex]` with metadata and statistics
- May increment `_.s.errCnt` and set `_.s.errTs` on errors
- Triggers `reqLogic()` if fetching today's prices
- Sets `loopRunning = false` and schedules next loop

**Error Handling**:
- Catches HTTP errors and JSON parsing errors
- Validates minimum data requirements
- Implements error counting for rate limiting

**Dependencies**:
- `Shelly.call("HTTP.GET", ...)`
- `updateTz()`
- `reqLogic()`

---

#### `pricesNeeded(dayIndex)`
**Location**: [`src/shelly-spotprice-se.js:536`](../src/shelly-spotprice-se.js:536)

Determines if price data needs to be fetched for specified day.

```javascript
function pricesNeeded(dayIndex) → boolean
```

**Parameters**:
- `dayIndex` (number): 0 for today, 1 for tomorrow

**Return Value**: `true` if prices should be fetched, `false` otherwise

**Logic**:
- **Today (dayIndex=0)**: Fetch if no data or date changed
- **Tomorrow (dayIndex=1)**: Fetch if after 14:00 and no data
- **Error limiting**: Skip if too many recent errors

**Dependencies**:
- Requires `_.s.timeOK = 1`
- Checks `_.s.errCnt` against `CNST.ERR_LIMIT`
- Uses `CNST.ERR_DELAY` for error recovery timing

---

#### `updateCurrentPrice()`
**Location**: [`src/shelly-spotprice-se.js:1110`](../src/shelly-spotprice-se.js:1110)

Updates the current hour's price in system state.

```javascript
function updateCurrentPrice() → boolean
```

**Return Value**: `true` if current price found and updated, `false` otherwise

**Description**:
- Searches today's price data for current hour
- Updates `_.s.p[0].now` with current price
- Handles clock synchronization issues

**Error Handling**:
- If current hour not found, assumes clock issues
- Sets `_.s.timeOK = false` to trigger time resync
- Clears price data and increments error counter

**Dependencies**:
- `isCurrentHour()`
- `epoch()`

---

### Control Logic

#### `logic(inst)`
**Location**: [`src/shelly-spotprice-se.js:789`](../src/shelly-spotprice-se.js:789)

Main control logic function for each instance.

```javascript
function logic(inst)
```

**Parameters**:
- `inst` (number): Instance index (0-based)

**Description**:
Executes the complete control logic flow:

1. **Initialization**:
   - Calls `USER_CONFIG` hook
   - Updates timezone and current price
   - Initializes command to `false`

2. **Mode Processing**:
   - **Mode 0 (Manual)**: Uses `cfg.m0.c` setting
   - **Mode 1 (Price Limit)**: Compares current price with `cfg.m1.l`
   - **Mode 2 (Cheapest Hours)**: Calls `isCheapestHour(inst)`

3. **Override Processing**:
   - Applies backup hours if no price data
   - Handles forced hours configuration
   - Applies time-based output limiting
   - Processes manual force commands

4. **Finalization**:
   - Calls `USER_OVERRIDE` hook
   - Applies output inversion if configured
   - Sets relay outputs via `setRelay()`
   - Updates history and timestamps

**Side Effects**:
- Updates `cmd[inst]` with calculated command
- Modifies `_.si[inst]` state object
- May trigger relay output changes
- Adds entries to command history
- Sets `loopRunning = false` when complete

**Dependencies**:
- `updateTz()`, `updateCurrentPrice()`
- `isCheapestHour()` (for mode 2)
- `setRelay()` for output control
- `USER_CONFIG()`, `USER_OVERRIDE()` hooks

---

#### `isCheapestHour(inst)`
**Location**: [`src/shelly-spotprice-se.js:961`](../src/shelly-spotprice-se.js:961)

Determines if current hour is among the cheapest in configured period.

```javascript
function isCheapestHour(inst) → boolean
```

**Parameters**:
- `inst` (number): Instance index

**Return Value**: `true` if current hour should be active, `false` otherwise

**Algorithm**:
1. **Configuration Validation**: Applies safety limits to all parameters
2. **Period Selection**: Handles standard periods (24h) or custom ranges
3. **Hour Selection**: 
   - **Sequential mode**: Finds cheapest consecutive hours
   - **Non-sequential mode**: Finds individual cheapest hours
4. **Forced Hours Integration**: Excludes/includes forced hours from selection
5. **Current Hour Check**: Determines if current hour matches selection

**Memory Optimization**:
Uses global variables (`_i`, `_j`, `_k`, etc.) to prevent stack overflow in nested loops.

**Configuration Parameters**:
- `cfg.m2.p`: Period length (-1=custom, -2=dual custom, >0=hours)
- `cfg.m2.c`: Number of cheapest hours in period 1
- `cfg.m2.c2`: Number of cheapest hours in period 2
- `cfg.m2.s`: Sequential hours flag (0/1)
- `cfg.m2.ps/pe`: Custom period 1 start/end hours
- `cfg.m2.ps2/pe2`: Custom period 2 start/end hours

**Dependencies**:
- `limit()` for parameter validation
- `isCurrentHour()` for time matching
- `epoch()` for current time

---

#### `logicRunNeeded(inst)`
**Location**: [`src/shelly-spotprice-se.js:588`](../src/shelly-spotprice-se.js:588)

Determines if logic should be executed for specified instance.

```javascript
function logicRunNeeded(inst) → boolean
```

**Parameters**:
- `inst` (number): Instance index

**Return Value**: `true` if logic should run, `false` otherwise

**Trigger Conditions**:
- Never run before (`st.chkTs == 0`)
- Hour has changed since last run
- Year has changed (time sync received)
- Manual force command has expired
- Time-limited output period has ended

**Optimization**: 
- Returns `false` immediately if instance disabled
- Clears history for disabled instances

---

### Device Control

#### `setRelay(inst, output, callback)`
**Location**: [`src/shelly-spotprice-se.js:774`](../src/shelly-spotprice-se.js:774)

Controls Shelly device relay outputs.

```javascript
function setRelay(inst, output, callback)
```

**Parameters**:
- `inst` (number): Instance index (for command lookup)
- `output` (number): Physical output ID on device
- `callback` (function): Called with success status `callback(boolean)`

**Description**:
- Constructs Shelly API call parameters
- Uses `cmd[inst]` to determine on/off state
- Calls Shelly Switch.Set API
- Logs errors but continues operation

**API Call Format**:
```javascript
Shelly.call("Switch.Set", "{id:0,on:true}", callback);
```

**Error Handling**:
- Logs failures but doesn't stop execution
- Calls callback with success/failure status
- Allows logic to continue with other outputs

---

### HTTP Server

#### `onServerRequest(request, response)`
**Location**: [`src/shelly-spotprice-se.js:1161`](../src/shelly-spotprice-se.js:1161)

Handles all HTTP requests to the embedded web server.

```javascript
function onServerRequest(request, response)
```

**Parameters**:
- `request` (object): HTTP request object with `.query` property
- `response` (object): HTTP response object

**Request Processing**:
1. **Busy Check**: Returns 503 if `loopRunning = true`
2. **Parameter Parsing**: Extracts query parameters
3. **Route Handling**: Dispatches based on `r` parameter
4. **Response Generation**: Sets appropriate headers and content

**API Endpoints**:

| Endpoint | Description | Response Format |
|----------|-------------|-----------------|
| `/?r=s&i={inst}` | Get system state | JSON object with `s`, `si`, `c`, `ci`, `p` |
| `/?r=c&i={inst}` | Get configuration | JSON configuration object |
| `/?r=h&i={inst}` | Get command history | JSON array of history entries |
| `/?r=r&i={inst}` | Reload configuration | 204 No Content |
| `/?r=f&i={inst}&ts={ts}&c={cmd}` | Force manual override | 204 No Content |

**Static Content**:
- `/` → `index.html` (main interface)
- `/?r=s.js` → JavaScript code
- `/?r=s.css` → Stylesheet
- `/?r=status` → Status tab HTML
- `/?r=config` → Configuration tab HTML
- `/?r=history` → History tab HTML

**Content Encoding**:
- Static files served with gzip compression
- API responses served uncompressed
- Base64 decoding for embedded static content

**Error Handling**:
- Returns 404 for unknown routes
- Returns 500 for server errors
- Logs all errors for debugging

---

### Utility Functions

#### `epoch(date?)`
**Location**: [`src/shelly-spotprice-se.js:255`](../src/shelly-spotprice-se.js:255)

Converts Date object to Unix timestamp (seconds).

```javascript
function epoch(date?) → number
```

**Parameters**:
- `date` (Date, optional): Date object to convert, defaults to current time

**Return Value**: Unix timestamp in seconds (integer)

**Usage**:
```javascript
const now = epoch();                    // Current timestamp
const specific = epoch(new Date(...));  // Specific date timestamp
```

---

#### `limit(min, value, max)`
**Location**: [`src/shelly-spotprice-se.js:246`](../src/shelly-spotprice-se.js:246)

Constrains a value to specified range.

```javascript
function limit(min, value, max) → number
```

**Parameters**:
- `min` (number): Minimum allowed value
- `value` (number): Value to constrain
- `max` (number): Maximum allowed value

**Return Value**: Constrained value within [min, max] range

**Usage**:
```javascript
const hours = limit(0, userInput, 23);  // Ensure valid hour
const count = limit(1, cfg.count, 24);  // Ensure valid count
```

---

#### `isCurrentHour(value, now)`
**Location**: [`src/shelly-spotprice-se.js:235`](../src/shelly-spotprice-se.js:235)

Checks if epoch timestamp represents the current hour.

```javascript
function isCurrentHour(value, now) → boolean
```

**Parameters**:
- `value` (number): Epoch timestamp to check
- `now` (number): Current epoch timestamp

**Return Value**: `true` if timestamps are in same hour, `false` otherwise

**Logic**: Returns `true` if difference is between 0 and 3600 seconds (1 hour)

---

#### `updateTz(now)`
**Location**: [`src/shelly-spotprice-se.js:277`](../src/shelly-spotprice-se.js:277)

Updates timezone information in system state.

```javascript
function updateTz(now)
```

**Parameters**:
- `now` (Date): Current date object

**Description**:
- Extracts timezone from Date.toString() format
- Converts to ISO 8601 format (e.g., "+02:00" or "Z")
- Updates `_.s.tz` (string) and `_.s.tzh` (hour offset)
- Triggers price refresh if timezone changed

**Side Effects**:
- Updates `_.s.tz` and `_.s.tzh`
- May clear `_.s.p[0].ts` if timezone changed

---

#### `parseParams(params)`
**Location**: [`src/shelly-spotprice-se.js:1143`](../src/shelly-spotprice-se.js:1143)

Parses HTTP query string into object.

```javascript
function parseParams(params) → object
```

**Parameters**:
- `params` (string): Query string (e.g., "key=value&key2=value2")

**Return Value**: Object with key-value pairs

**Example**:
```javascript
parseParams("r=s&i=0") → { r: "s", i: "0" }
```

---

#### `getKvsKey(inst)`
**Location**: [`src/shelly-spotprice-se.js:219`](../src/shelly-spotprice-se.js:219)

Generates KVS storage key for configuration.

```javascript
function getKvsKey(inst) → string
```

**Parameters**:
- `inst` (number): Instance index or -1 for common config

**Return Value**: KVS key string

**Key Format**:
- Common config: `"sptprc-se"`
- Instance config: `"sptprc-se-{n}"` where n = inst + 1

---

### History Management

#### `addHistory(inst)`
**Location**: [`src/shelly-spotprice-se.js:317`](../src/shelly-spotprice-se.js:317)

Adds command change to instance history.

```javascript
function addHistory(inst)
```

**Parameters**:
- `inst` (number): Instance index

**Description**:
- Calculates maximum history length based on enabled instances
- Removes oldest entries if at capacity
- Adds new entry with timestamp, command, and status

**History Entry Format**:
```javascript
[epoch_timestamp, command_0_or_1, status_code]
```

**Memory Management**:
- Total history limited by `CNST.HIST_LEN` (24 entries)
- Distributed among enabled instances
- Automatic cleanup of old entries

---

#### `reqLogic()`
**Location**: [`src/shelly-spotprice-se.js:332`](../src/shelly-spotprice-se.js:332)

Requests logic re-execution for all instances.

```javascript
function reqLogic()
```

**Description**:
- Resets `chkTs` to 0 for all instances
- Forces logic to run on next loop iteration
- Used after price updates or configuration changes

**Side Effects**:
- Modifies `_.si[i].chkTs` for all instances

---

## Extension System APIs

### User Script Hooks

#### `USER_CONFIG(inst, initialized)`
**Called from**: [`getConfig()`](../src/shelly-spotprice-se.js:451), [`logic()`](../src/shelly-spotprice-se.js:792)

User-defined function for dynamic configuration adjustment.

```javascript
function USER_CONFIG(inst, initialized)
```

**Parameters**:
- `inst` (number): Instance index (-1 for common config)
- `initialized` (boolean): `true` if called during config load, `false` during logic execution

**Use Cases**:
- Modify configuration based on external conditions
- Integrate with external sensors or APIs
- Dynamic parameter adjustment

**Example**:
```javascript
function USER_CONFIG(inst, initialized) {
  if (inst === 0 && !initialized) {
    // Adjust price limit based on temperature
    const temp = getExternalTemperature();
    if (temp < 0) {
      _.c.i[0].m1.l = _.s.p[0].avg * 1.2;  // Higher limit when cold
    }
  }
}
```

---

#### `USER_OVERRIDE(inst, cmd, callback)`
**Called from**: [`logic()`](../src/shelly-spotprice-se.js:939)

User-defined function for command override logic.

```javascript
function USER_OVERRIDE(inst, cmd, callback)
```

**Parameters**:
- `inst` (number): Instance index
- `cmd` (boolean): Original command from logic
- `callback` (function): Must be called with final command `callback(boolean|null)`

**Callback Values**:
- `true`: Force output ON
- `false`: Force output OFF  
- `null`: Re-run logic (useful for async operations)

**Use Cases**:
- Safety overrides (temperature, occupancy)
- External system integration
- Complex conditional logic

**Example**:
```javascript
function USER_OVERRIDE(inst, cmd, callback) {
  if (inst === 0) {
    // Check external safety condition
    if (emergencyStop()) {
      callback(false);  // Force OFF for safety
    } else {
      callback(cmd);    // Keep original command
    }
  } else {
    callback(cmd);
  }
}
```

---

#### `USER_LOOP()`
**Called from**: [`loop()`](../src/shelly-spotprice-se.js:518)

User-defined function for background processing.

```javascript
function USER_LOOP()
```

**Requirements**:
- Must set `loopRunning = false` when finished
- Should not block for extended periods
- Used for background tasks during idle time

**Use Cases**:
- External API calls
- Sensor data collection
- Periodic maintenance tasks

**Example**:
```javascript
function USER_LOOP() {
  // Perform background task
  updateExternalSensors();
  
  // Must reset loop flag
  loopRunning = false;
}
```

---

## Data Structures

### Global State Object (`_`)

```typescript
interface AppState {
  s: SystemState;
  si: InstanceState[];
  p: PriceData[][];
  h: HistoryEntry[][];
  c: Configuration;
}

interface SystemState {
  v: string;           // Version
  dn: string;          // Device name
  configOK: number;    // Config loaded (0/1)
  timeOK: number;      // Time synced (0/1)
  errCnt: number;      // Error count
  errTs: number;       // Last error timestamp
  upTs: number;        // Uptime start
  tz: string;          // Timezone string
  tzh: number;         // Timezone hours
  enCnt: number;       // Enabled instance count
  p: PriceSummary[];   // [today, tomorrow]
}

interface InstanceState {
  chkTs: number;       // Last check timestamp
  st: number;          // Status code
  str: string;         // Status string
  cmd: number;         // Command (-1/0/1)
  configOK: number;    // Config loaded (0/1)
  fCmdTs: number;      // Force command expiry
  fCmd: number;        // Force command value
}

interface Configuration {
  c: CommonConfig;
  i: InstanceConfig[];
}

interface CommonConfig {
  g: string;           // Region (SE1-SE4)
  vat: number;         // VAT percentage
  day: number;         // Day transfer fee
  night: number;       // Night transfer fee
  names: string[];     // Instance names
}

interface InstanceConfig {
  en: number;          // Enabled (0/1)
  mode: number;        // Mode (0/1/2)
  m0: ManualConfig;
  m1: PriceLimitConfig;
  m2: CheapestHoursConfig;
  b: number;           // Backup hours (binary)
  e: number;           // Emergency command (0/1)
  o: number[];         // Output IDs
  f: number;           // Forced hours (binary)
  fc: number;          // Forced commands (binary)
  i: number;           // Invert output (0/1)
  m: number;           // Minutes per hour
  oc: number;          // Output config (0/1)
}
```

### Status Codes

| Code | Description | Context |
|------|-------------|---------|
| 0 | Unknown/Initial | Default state |
| 1 | Manual mode active | Mode 0 |
| 2 | Price limit - ON | Mode 1, price ≤ limit |
| 3 | Price limit - OFF | Mode 1, price > limit |
| 4 | Cheapest hours - OFF | Mode 2, not cheapest hour |
| 5 | Cheapest hours - ON | Mode 2, is cheapest hour |
| 6 | Always-on price limit | Mode 2, price ≤ always-on limit |
| 7 | Backup hours active | No price data, using backup |
| 8 | Emergency mode | No time sync, using emergency setting |
| 9 | Manual force active | Temporary manual override |
| 10 | Forced hours active | Binary forced hours setting |
| 11 | Maximum price limit | Mode 2, price > max limit |
| 12 | User override active | USER_OVERRIDE changed command |
| 13 | Time limit reached | Output limited by minutes setting |

## Error Codes and Handling

### HTTP Error Responses

| Code | Description | Cause |
|------|-------------|-------|
| 200 | OK | Successful request |
| 204 | No Content | Successful action (reload, force) |
| 404 | Not Found | Unknown endpoint |
| 500 | Internal Server Error | Exception in request handler |
| 503 | Service Unavailable | System busy (loopRunning = true) |

### Price Fetch Errors

**Error Counting**:
- `_.s.errCnt`: Consecutive error counter
- `_.s.errTs`: Last error timestamp
- `CNST.ERR_LIMIT`: Maximum errors before delay (3)
- `CNST.ERR_DELAY`: Delay after max errors (120s)

**Recovery Logic**:
```javascript
if (_.s.errCnt >= CNST.ERR_LIMIT && (epoch(now) - _.s.errTs) < CNST.ERR_DELAY) {
  // Skip price fetch, wait for delay period
  return false;
} else if (_.s.errCnt >= CNST.ERR_LIMIT) {
  // Reset error counter after delay
  _.s.errCnt = 0;
}
```

## Memory Management

### Global Variables for Stack Optimization

```javascript
// Reused in loops to prevent stack overflow
let _i = 0, _j = 0, _k = 0;
let _inc = 0, _cnt = 0, _start = 0, _end = 0;
let _avg = 999, _startIndex = 0, _sum = 0;
```

### Memory Cleanup Patterns

```javascript
// Explicit nullification
request = null;
response.headers = null;
params = null;

// Array cleanup
res.headers = null;
res.message = null;
msg = null;
```

### Configuration Memory Optimization

```javascript
// Delete default configs after initialization
if (inst >= CNST.INST_COUNT - 1) {
  CNST.DEF_CFG.COM = null;
  CNST.DEF_CFG.INST = null;
}

// Delete instance template after initialization
CNST.DEF_INST_ST = null;
```

This API reference provides comprehensive documentation for all internal functions, data structures, and interfaces within the shelly-spotprice-se system, enabling AI tools and developers to understand and work with the codebase effectively.