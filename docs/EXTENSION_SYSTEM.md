# Extension System Guide

The shelly-spotprice-se script provides a powerful extension system through user script hooks that allow customization of behavior without modifying the main script. This system enables integration with external sensors, APIs, and custom logic while maintaining the core functionality.

## Overview

The extension system is based on three optional JavaScript functions that you can define in your script:

- **[`USER_CONFIG`](#user_config)** - Called when configuration changes or logic runs
- **[`USER_OVERRIDE`](#user_override)** - Called after logic execution to override output commands
- **[`USER_LOOP`](#user_loop)** - Called every 10 seconds during idle periods

These hooks are checked using [`typeof`](src/shelly-spotprice-se.js:493) and only executed if defined, making them completely optional.

## Hook Reference

### USER_CONFIG

Called when configuration changes or when logic runs for an instance.

```javascript
function USER_CONFIG(inst, initialized) {
    // Your custom configuration logic here
}
```

**Parameters:**
- `inst` (number): Instance index (0-2) or -1 for common configuration
- `initialized` (boolean): `true` if settings were just loaded from KVS, `false` during normal logic execution

**Use Cases:**
- Dynamic configuration adjustment based on external conditions
- Saving original settings before modification
- Integration with external data sources
- Temperature-based parameter adjustment

**Example - Temperature-based Hours Adjustment:**
```javascript
// Original unmodified settings
let originalConfig = {
    hours: 0,
    minutes: 60
};

function USER_CONFIG(inst, initialized) {
    if (inst != 0) return; // Only modify instance #1
    
    const state = _;
    const config = state.c.i[inst];
    
    // Save original settings on initialization
    if (initialized) {
        originalConfig.hours = config.m2.c;
        originalConfig.minutes = config.m;
    }
    
    // Get temperature from Shelly Add-on
    let temp = Shelly.getComponentStatus("temperature:100");
    if (temp && temp.tC !== null) {
        let hours = originalConfig.hours;
        let minutes = originalConfig.minutes;
        
        // Adjust based on temperature
        if (temp.tC <= -15) {
            hours = 8;
            minutes = 60;
        } else if (temp.tC <= -10) {
            hours = 7;
            minutes = 45;
        }
        
        // Apply changes
        config.m2.c = hours;
        config.m = minutes;
        
        state.si[inst].str = `Temperature ${temp.tC.toFixed(1)}°C -> ${hours}h, ${minutes}min`;
    }
}
```

### USER_OVERRIDE

Called after the main logic execution to override the final output command.

```javascript
function USER_OVERRIDE(inst, cmd, callback) {
    // Your override logic here
    callback(finalCommand); // Must call callback with final command
}
```

**Parameters:**
- `inst` (number): Instance index (0-2)
- `cmd` (boolean): Original command from main logic (`true` = ON, `false` = OFF)
- `callback` (function): **Must be called** with final command or `null`

**Callback Values:**
- `true` - Force output ON
- `false` - Force output OFF  
- `cmd` - Keep original command
- `null` - Re-run logic (useful after configuration changes)

**Use Cases:**
- Temperature-based overrides
- Safety limits and emergency shutoffs
- Integration with external sensors
- Complex conditional logic
- API-based decision making

**Example - Temperature Override:**
```javascript
function USER_OVERRIDE(inst, cmd, callback) {
    if (inst != 0) {
        callback(cmd); // Only override instance #1
        return;
    }
    
    try {
        let temp = Shelly.getComponentStatus("temperature:100");
        
        if (!temp || temp.tC === null) {
            _.si[inst].str = "Temperature sensor error";
            callback(cmd);
            return;
        }
        
        // Override logic based on temperature
        if (cmd && temp.tC > 15) {
            _.si[inst].str = `Temperature ${temp.tC}°C > 15°C -> OFF`;
            callback(false); // Force OFF
        } else if (!cmd && temp.tC < 5) {
            _.si[inst].str = `Temperature ${temp.tC}°C < 5°C -> ON`;
            callback(true); // Force ON
        } else {
            _.si[inst].str = `Temperature ${temp.tC}°C -> following logic`;
            callback(cmd); // Keep original
        }
        
    } catch (err) {
        console.log("USER_OVERRIDE error:", err);
        _.si[inst].str = "Override error: " + err;
        callback(cmd);
    }
}
```

**Example - API Integration with Re-run:**
```javascript
function USER_OVERRIDE(inst, cmd, callback) {
    if (inst != 0) {
        callback(cmd);
        return;
    }
    
    // Check if we need to fetch weather data
    if (activeDay !== new Date().getDate()) {
        let req = {
            url: "https://api.open-meteo.com/v1/forecast?latitude=59.5342&longitude=13.6246&daily=apparent_temperature_mean&timezone=auto&forecast_days=1",
            timeout: 5,
            ssl_ca: "*"
        };
        
        Shelly.call("HTTP.GET", req, function (res, err, msg) {
            if (err === 0 && res && res.code === 200) {
                let data = JSON.parse(res.body);
                let avgTemp = data.daily.apparent_temperature_mean[0];
                
                // Adjust configuration based on temperature
                if (avgTemp <= -10) {
                    _.c.i[inst].m2.c = 8; // 8 cheapest hours
                } else if (avgTemp <= 0) {
                    _.c.i[inst].m2.c = 4; // 4 cheapest hours
                }
                
                activeDay = new Date().getDate();
                _.si[inst].str = `Avg temp: ${avgTemp.toFixed(1)}°C`;
                
                // Re-run logic with new configuration
                callback(null);
            } else {
                callback(cmd);
            }
        });
    } else {
        callback(cmd);
    }
}
```

### USER_LOOP

Called every 10 seconds when the system is idle (no other operations running).

```javascript
function USER_LOOP() {
    // Your background task logic here
    loopRunning = false; // MUST set this when finished
}
```

**Requirements:**
- **MUST** set `loopRunning = false` when finished
- Should be non-blocking or complete quickly
- Used for background tasks and maintenance

**Use Cases:**
- Periodic external API calls
- Background data collection
- System maintenance tasks
- External sensor polling

**Example - Periodic Status Update:**
```javascript
let lastStatusUpdate = 0;

function USER_LOOP() {
    try {
        const now = Date.now();
        
        // Update status every 5 minutes
        if (now - lastStatusUpdate > 300000) {
            console.log("System status:", {
                uptime: _.s.upTs,
                errors: _.s.errCnt,
                instances: _.s.enCnt
            });
            
            lastStatusUpdate = now;
        }
        
    } catch (err) {
        console.log("USER_LOOP error:", err);
    } finally {
        loopRunning = false; // Always required
    }
}
```

## State Access

All hooks have access to the global application state through the [`_`](src/shelly-spotprice-se.js:146) object:

### System State (`_.s`)
```javascript
_.s.v          // Version
_.s.timeOK     // Time synchronization status
_.s.errCnt     // Error count
_.s.upTs       // Uptime timestamp
_.s.p[0].now   // Current price
_.s.p[0].avg   // Average price today
```

### Instance State (`_.si[inst]`)
```javascript
_.si[inst].chkTs    // Last check timestamp
_.si[inst].cmd      // Current command (0/1)
_.si[inst].st       // Status code
_.si[inst].str      // Custom status string (for user scripts)
_.si[inst].fCmdTs   // Forced command timestamp
```

### Configuration (`_.c`)
```javascript
_.c.c              // Common configuration
_.c.i[inst]        // Instance configuration
_.c.i[inst].mode   // Control mode (0=manual, 1=price limit, 2=cheapest hours)
_.c.i[inst].m2.c   // Number of cheapest hours
_.c.i[inst].m      // Minutes per hour to control
```

### Price Data (`_.p`)
```javascript
_.p[0]    // Today's prices [[timestamp, price], ...]
_.p[1]    // Tomorrow's prices [[timestamp, price], ...]
```

## Best Practices

### Error Handling
Always wrap your code in try-catch blocks:

```javascript
function USER_OVERRIDE(inst, cmd, callback) {
    try {
        // Your logic here
        callback(cmd);
    } catch (err) {
        console.log("Error in USER_OVERRIDE:", err);
        _.si[inst].str = "Error: " + err;
        callback(cmd); // Always call callback
    }
}
```

### Status Messages
Use the `str` field to provide user feedback:

```javascript
_.si[inst].str = "Temperature 12.5°C -> following logic";
```

### Memory Management
Clear large objects when done:

```javascript
Shelly.call("HTTP.GET", req, function (res, err, msg) {
    req = null;        // Clear request
    res.body = null;   // Clear response body
    // Process data...
});
```

### Configuration Preservation
Save original settings before modification:

```javascript
let originalConfig = {};

function USER_CONFIG(inst, initialized) {
    if (initialized) {
        originalConfig.hours = _.c.i[inst].m2.c;
        originalConfig.minutes = _.c.i[inst].m;
    }
    // Use originalConfig as baseline for modifications
}
```

## Common Patterns

### Temperature-Based Control
See examples in:
- [`shelly-spotprice-se-addon-temp.js`](src/after-build/shelly-spotprice-se-addon-temp.js) - Simple temperature override
- [`shelly-spotprice-se-addon-temp-hours.js`](src/after-build/shelly-spotprice-se-addon-temp-hours.js) - Temperature-based hour adjustment
- [`shelly-spotprice-se-ht-sensor-temp.js`](src/after-build/shelly-spotprice-se-ht-sensor-temp.js) - External H&T sensor integration

### API Integration
See [`shelly-spotprice-se-open-meteo-api.js`](src/after-build/shelly-spotprice-se-open-meteo-api.js) for weather API integration.

### Configuration Management
See [`shelly-spotprice-se-config.js`](src/after-build/shelly-spotprice-se-config.js) for programmatic configuration updates.

### Build-Time Customization
See [`shelly-spotprice-se-1-instance-no-history.js`](src/after-build/shelly-spotprice-se-1-instance-no-history.js) for compile-time constants.

## HTTP Endpoint Registration

User scripts can register custom HTTP endpoints:

```javascript
function onHttpRequest(request, response) {
    let params = parseParams(request.query);
    
    if (params.temp !== undefined) {
        // Process temperature data
        response.code = 200;
    } else {
        response.code = 400;
    }
    
    response.send();
}

// Register endpoint: /script/X/update-temp
HTTPServer.registerEndpoint('update-temp', onHttpRequest);
```

## Debugging

### Console Logging
```javascript
console.log("Debug info:", data);
```

### Status Display
```javascript
_.si[inst].str = "Debug: " + JSON.stringify(data);
```

### Logic Re-execution
```javascript
_.si[inst].chkTs = 0; // Force logic to run again
```

## Integration Examples

### Shelly Add-on Temperature Sensor
```javascript
let temp = Shelly.getComponentStatus("temperature:100");
if (temp && temp.tC !== null) {
    // Use temp.tC for temperature in Celsius
}
```

### External H&T Sensor
Register HTTP endpoint and configure H&T to send data:
```
http://device-ip/script/1/update-temp?temp=$temperature
```

### Weather API Integration
Fetch weather data and adjust configuration dynamically.

### KVS Configuration Updates
Programmatically update stored configuration values.

## Troubleshooting

### Common Issues

1. **Callback not called in USER_OVERRIDE**
   - Always call `callback()` even in error cases
   - Use try-catch to ensure callback is called

2. **loopRunning not reset in USER_LOOP**
   - Always set `loopRunning = false` when finished
   - Use try-finally to ensure it's always set

3. **Configuration changes not applied**
   - Ensure you're modifying the correct instance
   - Check that configuration exists before modifying

4. **Memory issues**
   - Clear large objects after use
   - Avoid storing large amounts of data in global variables

### Debug Techniques

1. **Check hook execution:**
   ```javascript
   console.log("USER_OVERRIDE called for instance", inst, "with command", cmd);
   ```

2. **Verify state access:**
   ```javascript
   console.log("Current state:", JSON.stringify(_.si[inst]));
   ```

3. **Test configuration changes:**
   ```javascript
   console.log("Config before:", _.c.i[inst].m2.c);
   _.c.i[inst].m2.c = 5;
   console.log("Config after:", _.c.i[inst].m2.c);
   ```

The extension system provides powerful customization capabilities while maintaining the stability and performance of the core script. Use these hooks to integrate external data sources, implement custom logic, and adapt the system to your specific needs.