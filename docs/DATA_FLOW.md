# Data Flow and State Management

## Overview

The shelly-spotprice-se system implements a centralized state management pattern with the global `_` object serving as the single source of truth. Data flows through the system in predictable patterns, with clear separation between configuration, runtime state, and external data sources.

## State Management Architecture

### Central State Object (`_`)

The entire application state is managed through a single global object located at [`src/shelly-spotprice-se.js:124-187`](../src/shelly-spotprice-se.js:124):

```javascript
let _ = {
  s: {},      // System state
  si: [],     // Instance states  
  p: [[], []], // Price data [today, tomorrow]
  h: [],      // Command history
  c: {}       // Configuration
};
```

### State Categories

#### 1. System State (`_.s`)
**Immutable during runtime, updated by system events**

```javascript
_.s = {
  v: "4.0.0",           // Version (constant)
  dn: '',               // Device name (from Shelly API)
  configOK: 0,          // Configuration load status
  timeOK: 0,            // NTP synchronization status
  errCnt: 0,            // Consecutive error count
  errTs: 0,             // Last error timestamp
  upTs: 0,              // System uptime start
  tz: "+02:00",         // Current timezone
  tzh: 0,               // Timezone hour offset
  enCnt: 0,             // Count of enabled instances
  p: [                  // Price summary data
    { ts: 0, now: 0, low: 0, high: 0, avg: 0 },  // Today
    { ts: 0, now: 0, low: 0, high: 0, avg: 0 }   // Tomorrow
  ]
};
```

#### 2. Instance States (`_.si[n]`)
**Mutable, updated by logic execution**

```javascript
_.si[n] = {
  chkTs: 0,             // Last logic execution timestamp
  st: 0,                // Current status code
  str: '',              // Status string (user scripts)
  cmd: -1,              // Current command (-1=unknown, 0=off, 1=on)
  configOK: 0,          // Instance configuration loaded
  fCmdTs: 0,            // Forced command expiry
  fCmd: 0               // Forced command value
};
```

#### 3. Price Data (`_.p`)
**External data, updated from API**

```javascript
_.p = [
  [                     // Today's prices
    [epoch, price],     // Hour 0
    [epoch, price],     // Hour 1
    // ... up to 24 hours
  ],
  [                     // Tomorrow's prices
    [epoch, price],     // Hour 0
    [epoch, price],     // Hour 1
    // ... up to 24 hours
  ]
];
```

#### 4. Configuration (`_.c`)
**Persistent, loaded from KVS storage**

```javascript
_.c = {
  c: {                  // Common configuration
    g: 'SE3',           // Price region
    vat: 25,            // VAT percentage
    day: 0,             // Day transfer fee
    night: 0,           // Night transfer fee
    names: []           // Instance names
  },
  i: [                  // Instance configurations
    {
      en: 0,            // Enabled flag
      mode: 0,          // Control mode
      m0: {},           // Manual mode settings
      m1: {},           // Price limit settings
      m2: {},           // Cheapest hours settings
      // ... other instance settings
    }
  ]
};
```

## Data Flow Patterns

### 1. Price Fetching → State Update → Logic Execution → Device Control

This is the primary data flow pattern that drives the system's core functionality:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Price Fetcher  │───►│  State Update   │───►│ Logic Execution │───►│ Device Control  │
│                 │    │                 │    │                 │    │                 │
│ getPrices()     │    │ updateState()   │    │ logic()         │    │ setRelay()      │
│ - API call      │    │ - Update _.s    │    │ - Calculate cmd │    │ - Set outputs   │
│ - Parse data    │    │ - Update _.p    │    │ - Update _.si   │    │ - Add history   │
│ - Calculate     │    │ - Time sync     │    │ - Apply modes   │    │ - Call Shelly   │
│   statistics    │    │ - Error state   │    │ - User hooks    │    │   API           │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Detailed Flow**:

1. **Price Fetching** ([`getPrices()`](../src/shelly-spotprice-se.js:632))
   ```javascript
   // Triggered when pricesNeeded() returns true
   getPrices(dayIndex) → HTTP.GET → Parse JSON → Apply VAT/fees → Update _.p[dayIndex]
   ```

2. **State Update** ([`updateState()`](../src/shelly-spotprice-se.js:343))
   ```javascript
   // Called every loop iteration
   updateState() → Check NTP → Update _.s.timeOK → Count enabled instances → Update _.s.enCnt
   ```

3. **Logic Execution** ([`logic()`](../src/shelly-spotprice-se.js:789))
   ```javascript
   // Triggered when logicRunNeeded() returns true
   logic(inst) → Determine mode → Calculate command → Apply overrides → Update _.si[inst]
   ```

4. **Device Control** ([`setRelay()`](../src/shelly-spotprice-se.js:774))
   ```javascript
   // Called after logic determines command
   setRelay(inst, output) → Shelly.call("Switch.Set") → Update history → Complete cycle
   ```

### 2. Web Interface → Configuration → State Persistence (KVS)

Configuration changes flow from the web interface through validation to persistent storage:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Web Interface  │───►│  HTTP Handler   │───►│  Configuration  │───►│  KVS Storage    │
│                 │    │                 │    │   Validation    │    │                 │
│ User input      │    │ onServerRequest │    │ chkConfig()     │    │ KVS.Set         │
│ Form data       │    │ - Parse params  │    │ - Add defaults  │    │ - Persist data  │
│ AJAX requests   │    │ - Route request │    │ - Validate      │    │ - Trigger       │
│                 │    │ - Send response │    │ - Update _.c    │    │   reload        │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Configuration Loading Flow**:

1. **Initial Load** ([`getConfig()`](../src/shelly-spotprice-se.js:441))
   ```javascript
   getConfig(inst) → KVS.Get → JSON.parse → chkConfig() → Update _.c → Trigger logic
   ```

2. **Validation** ([`chkConfig()`](../src/shelly-spotprice-se.js:384))
   ```javascript
   chkConfig(inst) → Compare with defaults → Add missing keys → KVS.Set if changed
   ```

3. **Reload Trigger** (HTTP endpoint `/?r=r`)
   ```javascript
   HTTP request → Set configOK = false → Trigger getConfig() → Reload all instances
   ```

### 3. User Scripts → Logic Override → Final Command

User extension scripts can intercept and modify the control flow:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Logic Result   │───►│  USER_OVERRIDE  │───►│ Final Command   │───►│ Device Output   │
│                 │    │                 │    │                 │    │                 │
│ cmd[inst] = X   │    │ User function   │    │ finalCmd = Y    │    │ Relay state     │
│ Based on mode   │    │ - Custom logic  │    │ - May differ    │    │ - Physical      │
│ - Manual        │    │ - External data │    │   from original │    │   output        │
│ - Price limit   │    │ - Conditions    │    │ - User decided  │    │ - Multiple      │
│ - Cheapest hrs  │    │ - Override      │    │ - Final result  │    │   outputs       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

**User Script Integration Points**:

1. **Configuration Hook** ([`USER_CONFIG`](../src/shelly-spotprice-se.js:451))
   ```javascript
   if (typeof USER_CONFIG == 'function') {
     USER_CONFIG(inst, initialized);  // Called on config load and logic run
   }
   ```

2. **Command Override** ([`USER_OVERRIDE`](../src/shelly-spotprice-se.js:939))
   ```javascript
   if (typeof USER_OVERRIDE == 'function') {
     USER_OVERRIDE(inst, cmd[inst], logicFinalize);  // Can modify final command
   }
   ```

3. **Background Processing** ([`USER_LOOP`](../src/shelly-spotprice-se.js:518))
   ```javascript
   if (typeof USER_LOOP == 'function') {
     USER_LOOP();  // Called during idle time
   }
   ```

## State Transitions

### System State Transitions

```
┌─────────────┐    Time Sync     ┌─────────────┐    Config Load   ┌─────────────┐
│   STARTUP   │─────────────────►│  TIME_OK    │─────────────────►│ CONFIG_OK   │
│             │                  │             │                  │             │
│ timeOK = 0  │                  │ timeOK = 1  │                  │ configOK = 1│
│ configOK = 0│                  │ configOK = 0│                  │ Ready for   │
└─────────────┘                  └─────────────┘                  │ operation   │
                                                                  └─────────────┘
                                                                         │
                                                                         ▼
                                                                  ┌─────────────┐
                                                                  │ OPERATIONAL │
                                                                  │             │
                                                                  │ All systems │
                                                                  │ running     │
                                                                  └─────────────┘
```

### Instance State Transitions

```
┌─────────────┐    Config Load   ┌─────────────┐    Logic Run     ┌─────────────┐
│  DISABLED   │─────────────────►│   ENABLED   │─────────────────►│   ACTIVE    │
│             │                  │             │                  │             │
│ en = 0      │                  │ en = 1      │                  │ cmd != -1   │
│ cmd = -1    │                  │ configOK = 1│                  │ chkTs > 0   │
└─────────────┘                  └─────────────┘                  └─────────────┘
                                                                         │
                                                                         ▼
                                                                  ┌─────────────┐
                                                                  │ CONTROLLED  │
                                                                  │             │
                                                                  │ Output set  │
                                                                  │ History     │
                                                                  │ updated     │
                                                                  └─────────────┘
```

### Price Data State Transitions

```
┌─────────────┐    API Success   ┌─────────────┐    Time Change   ┌─────────────┐
│   STALE     │─────────────────►│   FRESH     │─────────────────►│   STALE     │
│             │                  │             │                  │             │
│ ts = 0      │                  │ ts > 0      │                  │ Date !=     │
│ p = []      │                  │ p = [data]  │                  │ current     │
└─────────────┘                  └─────────────┘                  └─────────────┘
       ▲                                                                  │
       │                         ┌─────────────┐    API Failure          │
       └─────────────────────────│   ERROR     │◄────────────────────────┘
                                 │             │
                                 │ errCnt++    │
                                 │ errTs = now │
                                 └─────────────┘
```

## Data Persistence

### KVS (Key-Value Store) Usage

The system uses Shelly's built-in KVS for persistent storage:

**Key Naming Convention**:
```javascript
function getKvsKey(inst) {
  return inst >= 0 ? `sptprc-se-${inst + 1}` : 'sptprc-se';
}
```

**Storage Pattern**:
- Common config: `sptprc-se`
- Instance 1 config: `sptprc-se-1`
- Instance 2 config: `sptprc-se-2`
- Instance 3 config: `sptprc-se-3`

**Data Format**:
```javascript
// Stored as JSON strings
KVS.Set({
  key: "sptprc-se",
  value: JSON.stringify(_.c.c)  // Common configuration
});

KVS.Set({
  key: "sptprc-se-1", 
  value: JSON.stringify(_.c.i[0])  // Instance 1 configuration
});
```

### Memory Management

**Volatile Data** (Lost on restart):
- Price data (`_.p`)
- System state (`_.s`)
- Instance states (`_.si`)
- Command history (`_.h`)

**Persistent Data** (Survives restart):
- Common configuration (`_.c.c`)
- Instance configurations (`_.c.i`)

## Error Handling and Recovery

### Error State Management

```javascript
// Error tracking in system state
_.s.errCnt = 0;     // Consecutive error count
_.s.errTs = 0;      // Last error timestamp

// Error handling pattern
try {
  // Operation that might fail
} catch (err) {
  log("error: " + err);
  _.s.errCnt += 1;
  _.s.errTs = epoch();
  
  // Clear invalid data
  _.s.p[dayIndex].ts = 0;
  _.p[dayIndex] = [];
}
```

### Recovery Mechanisms

1. **Price Fetch Errors**:
   - Increment error counter
   - Wait `CNST.ERR_DELAY` (120s) after `CNST.ERR_LIMIT` (3) failures
   - Clear error counter on successful fetch

2. **Configuration Errors**:
   - Auto-populate missing keys with defaults
   - Validate and constrain values to safe ranges
   - Continue with partial configuration if possible

3. **Device Communication Errors**:
   - Log errors but continue operation
   - Retry on next logic cycle
   - Maintain last known state

## Performance Optimizations

### Memory Efficiency

**Global Loop Variables** (prevent stack overflow):
```javascript
let _i = 0, _j = 0, _k = 0;  // Reused in all loops
let _inc = 0, _cnt = 0, _start = 0, _end = 0;  // Algorithm variables
```

**Explicit Memory Cleanup**:
```javascript
// Clear references to free memory
req = null;
res.headers = null;
params = null;
```

**Efficient Data Structures**:
```javascript
// Binary flags for 24-hour periods
cfg.b = 0b110000000000001100001;  // Hours 0, 5, 6, 19, 20

// Compact price storage
_.p[0] = [[epoch, price], [epoch, price], ...];  // No object overhead
```

### Execution Efficiency

**Lazy Evaluation**:
```javascript
// Only run logic when needed
function logicRunNeeded(inst) {
  return st.chkTs == 0 || hourChanged || yearChanged || forceExpired;
}
```

**Batched Operations**:
```javascript
// Process all instances in sequence
for (let inst = 0; inst < CNST.INST_COUNT; inst++) {
  if (logicRunNeeded(inst)) {
    Timer.set(500, false, logic, inst);  // Async execution
    return;  // Process one at a time
  }
}
```

**Conditional Processing**:
```javascript
// Skip expensive operations when not needed
if (!_.s.timeOK) return;  // No time, no logic
if (!_.c.i[inst].en) return;  // Disabled instance
if (_.s.p[0].ts == 0) return;  // No price data
```

## Data Validation and Constraints

### Configuration Validation

```javascript
// Safety limits applied in isCheapestHour()
cfg.m2.ps = limit(0, cfg.m2.ps, 23);      // Period start: 0-23
cfg.m2.pe = limit(cfg.m2.ps, cfg.m2.pe, 24);  // Period end: start-24
cfg.m2.c = limit(0, cfg.m2.c, maxHours);  // Count: 0-max
```

### Data Integrity Checks

```javascript
// Price data validation
if (_.p[dayIndex].length < 23) {
  throw new Error("invalid data received");  // Need at least 23 hours
}

// Time synchronization check
_.s.timeOK = Shelly.getComponentStatus("sys").unixtime != null 
             && now.getFullYear() > 2000;
```

### State Consistency

```javascript
// Ensure instance arrays match INST_COUNT
for (let inst = 0; inst < CNST.INST_COUNT; inst++) {
  _.si.push(Object.assign({}, CNST.DEF_INST_ST));
  _.c.i.push(Object.assign({}, CNST.DEF_CFG.INST));
  _.h.push([]);
  cmd.push(false);
}
```

This data flow architecture ensures predictable behavior, efficient resource usage, and robust error handling while maintaining the flexibility needed for IoT device control based on dynamic pricing data.