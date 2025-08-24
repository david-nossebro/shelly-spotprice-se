# System Architecture Overview

## Introduction

The shelly-spotprice-se system is an IoT script designed to control Shelly devices based on Swedish electricity spot prices. It runs as an embedded JavaScript application on Shelly devices with resource constraints, implementing intelligent power management based on real-time electricity pricing.

## Core Components

### 1. State Manager (`_` object)
**Location**: [`src/shelly-spotprice-se.js:124-187`](../src/shelly-spotprice-se.js:124)

The central state object that maintains all application data:

```javascript
let _ = {
  s: {        // System state (version, time, errors, timezone)
    v: "4.0.0",
    timeOK: 0,
    errCnt: 0,
    // ... other system properties
  },
  si: [],     // Instance states (per-device status)
  p: [[], []], // Price data [today, tomorrow]
  h: [],      // Command history per instance
  c: {        // Active configuration
    c: {},    // Common settings
    i: []     // Instance settings
  }
};
```

**Key Responsibilities**:
- Maintains system-wide state and configuration
- Tracks individual instance states and commands
- Stores price data and historical information
- Manages timezone and time synchronization status

### 2. Price Fetcher
**Location**: [`getPrices()`](../src/shelly-spotprice-se.js:632)

Fetches electricity spot prices from elprisetjustnu.se API:

```javascript
function getPrices(dayIndex) {
  // Constructs API URL for specific date and region
  // Processes price data with VAT and transfer fees
  // Updates _.p[dayIndex] with [epoch, price] arrays
}
```

**Key Features**:
- Fetches prices for today (dayIndex=0) and tomorrow (dayIndex=1)
- Applies VAT percentage and day/night transfer fees
- Handles timezone conversion and date formatting
- Implements error handling with retry logic

### 3. Device Controller
**Location**: [`setRelay()`](../src/shelly-spotprice-se.js:774), [`logic()`](../src/shelly-spotprice-se.js:789)

Controls Shelly device outputs based on pricing logic:

```javascript
function setRelay(inst, output, callback) {
  // Sets relay state using Shelly.call("Switch.Set", ...)
}

function logic(inst) {
  // Main control logic for each instance
  // Determines output command based on mode and conditions
}
```

**Control Modes**:
- **Mode 0**: Manual control (on/off toggle)
- **Mode 1**: Price limit (on when price ≤ threshold)
- **Mode 2**: Cheapest hours (on during N cheapest hours in period)

### 4. Web Server
**Location**: [`onServerRequest()`](../src/shelly-spotprice-se.js:1161)

Embedded HTTP server providing web interface and API:

```javascript
function onServerRequest(request, response) {
  // Handles HTTP requests for web UI and API endpoints
  // Serves static content and dynamic data
}
```

**Endpoints**:
- `/?r=s&i={instance}` - Get system state
- `/?r=c&i={instance}` - Get configuration
- `/?r=h&i={instance}` - Get command history
- `/?r=r&i={instance}` - Reload configuration
- `/?r=f&i={instance}&ts={timestamp}&c={command}` - Force manual override

### 5. Extension System
**Location**: User script hooks throughout [`logic()`](../src/shelly-spotprice-se.js:789)

Provides extensibility through user-defined functions:

```javascript
// Configuration hook
if (typeof USER_CONFIG == 'function') {
  USER_CONFIG(inst, initialized);
}

// Command override hook
if (typeof USER_OVERRIDE == 'function') {
  USER_OVERRIDE(inst, cmd[inst], logicFinalize);
}

// Background processing hook
if (typeof USER_LOOP == 'function') {
  USER_LOOP();
}
```

**Extension Points**:
- `USER_CONFIG(inst, initialized)` - Dynamic configuration adjustment
- `USER_OVERRIDE(inst, cmd, callback)` - Command override logic
- `USER_LOOP()` - Background processing during idle time

## Component Relationships

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Server    │    │  State Manager  │    │ Price Fetcher   │
│                 │    │                 │    │                 │
│ - HTTP API      │◄──►│ - Global state  │◄──►│ - API calls     │
│ - Web UI        │    │ - Configuration │    │ - Price data    │
│ - Static files  │    │ - Instance data │    │ - Error handling│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │ Device Controller│              │
         │              │                 │              │
         └─────────────►│ - Logic engine  │◄─────────────┘
                        │ - Relay control │
                        │ - Mode handling │
                        └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │Extension System │
                        │                 │
                        │ - USER_CONFIG   │
                        │ - USER_OVERRIDE │
                        │ - USER_LOOP     │
                        └─────────────────┘
```

## Data Structures

### Configuration Schema

**Common Configuration** (`_.c.c`):
```javascript
{
  g: 'SE3',        // Price region (SE1-SE4)
  vat: 25,         // VAT percentage
  day: 0,          // Day transfer fee (c/kWh)
  night: 0,        // Night transfer fee (c/kWh)
  names: []        // Instance names
}
```

**Instance Configuration** (`_.c.i[n]`):
```javascript
{
  en: 0,           // Enabled (0/1)
  mode: 0,         // Control mode (0=manual, 1=price_limit, 2=cheapest_hours)
  m0: { c: 0 },    // Manual mode settings
  m1: { l: 0 },    // Price limit settings
  m2: {            // Cheapest hours settings
    p: 24,         // Period length (hours)
    c: 0,          // Number of cheapest hours
    l: -999,       // Always-on price limit
    s: 0,          // Sequential hours (0/1)
    m: 999         // Maximum price limit
  },
  o: [0],          // Output IDs array
  b: 0b0,          // Backup hours (binary)
  f: 0b0,          // Forced hours (binary)
  fc: 0b0,         // Forced hours commands (binary)
  i: 0,            // Invert output (0/1)
  m: 60,           // Minutes per hour to be on
  oc: 0            // Output config (0=always, 1=on_change)
}
```

### State Objects

**System State** (`_.s`):
```javascript
{
  v: "4.0.0",      // Version
  dn: '',          // Device name
  configOK: 0,     // Configuration status
  timeOK: 0,       // Time synchronization status
  errCnt: 0,       // Error counter
  errTs: 0,        // Last error timestamp
  upTs: 0,         // Uptime start timestamp
  tz: "+02:00",    // Timezone string
  tzh: 0,          // Timezone hour offset
  enCnt: 0,        // Enabled instance count
  p: [             // Price info [today, tomorrow]
    { ts: 0, now: 0, low: 0, high: 0, avg: 0 },
    { ts: 0, now: 0, low: 0, high: 0, avg: 0 }
  ]
}
```

**Instance State** (`_.si[n]`):
```javascript
{
  chkTs: 0,        // Last check timestamp
  st: 0,           // Status code
  str: '',         // Status string (for user scripts)
  cmd: -1,         // Active command (-1=undetermined, 0=off, 1=on)
  configOK: 0,     // Configuration loaded status
  fCmdTs: 0,       // Forced command expiry timestamp
  fCmd: 0          // Forced command value
}
```

## Memory Optimization Patterns

The system implements several memory optimization techniques for resource-constrained devices:

### Global Loop Variables
```javascript
let _i = 0, _j = 0, _k = 0;  // Prevent stack overflow in loops
let _inc = 0, _cnt = 0, _start = 0, _end = 0;
```

### Memory Cleanup
```javascript
// Explicit nullification to free memory
req = null;
res.headers = null;
res.message = null;
```

### Efficient Data Structures
- Price data stored as `[epoch, price]` arrays
- Binary flags for hour-based settings (`0b110000...`)
- Shared default configurations deleted after initialization

## Execution Flow

### Main Loop Cycle
1. **State Update**: Check time synchronization and system status
2. **Configuration**: Load missing configurations from KVS
3. **Price Fetching**: Get today's/tomorrow's prices if needed
4. **Logic Execution**: Run control logic for each enabled instance
5. **Device Control**: Set relay outputs based on logic results
6. **User Extensions**: Execute user-defined background tasks

### Logic Decision Tree
```
Instance Enabled?
├─ No: Clear history, skip
└─ Yes: Check mode
    ├─ Mode 0 (Manual): Use m0.c setting
    ├─ Mode 1 (Price Limit): Compare current price with m1.l
    └─ Mode 2 (Cheapest Hours): Calculate cheapest hours in period
        ├─ Apply always-on price limit (m2.l)
        ├─ Apply maximum price limit (m2.m)
        └─ Check forced hours override
```

## Error Handling

### Price Fetching Errors
- Error counter (`_.s.errCnt`) tracks consecutive failures
- After `CNST.ERR_LIMIT` (3) failures, wait `CNST.ERR_DELAY` (120s)
- Automatic retry with exponential backoff

### Configuration Errors
- Missing configuration keys auto-populated with defaults
- Configuration validation with safety limits
- Graceful degradation when configuration is invalid

### Device Communication Errors
- Relay setting failures logged but don't stop execution
- Multiple output support with individual error handling
- Fallback to previous known state on communication failure

## Performance Characteristics

### Memory Usage
- Optimized for devices with ~50KB available memory
- Global variables reused to prevent stack overflow
- Explicit memory cleanup in HTTP handlers

### Timing Constraints
- Main loop runs every 10 seconds
- Logic execution triggered by hour changes
- HTTP requests timeout after 5 seconds
- Background tasks yield control to prevent blocking

### Scalability
- Supports 1-3 instances per device (configurable)
- History limited by `CNST.HIST_LEN` (24 entries total)
- Price data cached for 24-48 hours