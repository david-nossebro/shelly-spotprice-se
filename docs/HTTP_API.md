# HTTP API Reference

The shelly-spotprice-se script provides a comprehensive HTTP API for web interface communication and external integration. The API serves both the embedded web interface and allows external systems to interact with the script.

## Base URL

The script is accessible at:
```
http://<device-ip>/script/<script-id>/
```

Where:
- `<device-ip>` is your Shelly device's IP address
- `<script-id>` is the script number (usually 1)

Example: `http://192.168.1.100/script/1/`

## API Endpoints

All API endpoints use GET requests with query parameters. The main parameter `r` specifies the request type.

### System State

#### Get System State
**Endpoint:** `GET /?r=s&i={instance}`

Returns complete system state for a specific instance.

**Parameters:**
- `r=s` - Request type (state)
- `i` - Instance number (0-2)

**Response:**
```json
{
  "s": {
    "v": "4.0.0",
    "dn": "Device Name",
    "configOK": 1,
    "timeOK": 1,
    "errCnt": 0,
    "errTs": 0,
    "upTs": 1640995200,
    "tz": "+02:00",
    "tzh": 2,
    "enCnt": 1,
    "p": [
      {
        "ts": 1640995200,
        "now": 0.15,
        "low": 0.10,
        "high": 0.25,
        "avg": 0.18
      },
      {
        "ts": 1640995200,
        "now": 0,
        "low": 0.12,
        "high": 0.28,
        "avg": 0.20
      }
    ]
  },
  "si": {
    "chkTs": 1640995200,
    "st": 2,
    "str": "Custom status message",
    "cmd": 1,
    "configOK": 1,
    "fCmdTs": 0,
    "fCmd": 0
  },
  "c": {
    "g": "SE3",
    "vat": 25,
    "day": 4.0,
    "night": 3.0,
    "names": ["Instance 1", "Instance 2", "Instance 3"]
  },
  "ci": {
    "en": 1,
    "mode": 2,
    "m0": { "c": 0 },
    "m1": { "l": 0.15 },
    "m2": {
      "p": 24,
      "c": 8,
      "l": -999,
      "s": 0,
      "m": 999,
      "ps": 0,
      "pe": 23,
      "ps2": 0,
      "pe2": 23,
      "c2": 0
    },
    "b": 0,
    "e": 0,
    "o": [0],
    "f": 0,
    "fc": 0,
    "i": 0,
    "m": 60,
    "oc": 0
  },
  "p": [
    [
      [1640995200, 0.15],
      [1640998800, 0.12],
      [1641002400, 0.18]
    ],
    [
      [1641081600, 0.16],
      [1641085200, 0.14]
    ]
  ]
}
```

**Response Fields:**

**System State (`s`):**
- `v` - Script version
- `dn` - Device name
- `configOK` - Configuration status (0/1)
- `timeOK` - Time synchronization status (0/1)
- `errCnt` - Current error count
- `errTs` - Last error timestamp
- `upTs` - System uptime timestamp
- `tz` - Timezone string (URL encoded)
- `tzh` - Timezone hour offset
- `enCnt` - Number of enabled instances
- `p[0]` - Today's price info
- `p[1]` - Tomorrow's price info

**Instance State (`si`):**
- `chkTs` - Last logic check timestamp
- `st` - Status code (see [Status Codes](#status-codes))
- `str` - Custom status string (used by extensions)
- `cmd` - Current command (0=OFF, 1=ON, -1=undetermined)
- `configOK` - Instance configuration status (0/1)
- `fCmdTs` - Forced command expiry timestamp
- `fCmd` - Forced command value (0/1)

**Common Config (`c`):**
- `g` - Price region (SE1-SE4)
- `vat` - VAT percentage
- `day` - Day transfer fee (c/kWh)
- `night` - Night transfer fee (c/kWh)
- `names` - Instance names array

**Instance Config (`ci`):**
- `en` - Enabled (0/1)
- `mode` - Control mode (0=manual, 1=price limit, 2=cheapest hours)
- `m0` - Manual mode settings
- `m1` - Price limit settings
- `m2` - Cheapest hours settings
- `b` - Backup hours (binary)
- `e` - Emergency command when time unknown (0/1)
- `o` - Output IDs array
- `f` - Forced hours (binary)
- `fc` - Forced hours commands (binary)
- `i` - Invert output (0/1)
- `m` - Minutes per hour to control
- `oc` - Output control mode (0=always, 1=on change)

**Price Data (`p`):**
- `p[0]` - Today's hourly prices `[[timestamp, price], ...]`
- `p[1]` - Tomorrow's hourly prices `[[timestamp, price], ...]`

### Configuration

#### Get Configuration
**Endpoint:** `GET /?r=c&i={instance}`

Returns configuration for specific instance or common settings.

**Parameters:**
- `r=c` - Request type (configuration)
- `i` - Instance number (0-2) or omit for common settings

**Response for Instance:**
```json
{
  "en": 1,
  "mode": 2,
  "m0": { "c": 0 },
  "m1": { "l": 0.15 },
  "m2": {
    "p": 24,
    "c": 8,
    "l": -999,
    "s": 0,
    "m": 999,
    "ps": 0,
    "pe": 23,
    "ps2": 0,
    "pe2": 23,
    "c2": 0
  },
  "b": 0,
  "e": 0,
  "o": [0],
  "f": 0,
  "fc": 0,
  "i": 0,
  "m": 60,
  "oc": 0
}
```

**Response for Common Settings:**
```json
{
  "g": "SE3",
  "vat": 25,
  "day": 4.0,
  "night": 3.0,
  "names": ["Instance 1", "Instance 2", "Instance 3"]
}
```

### History

#### Get Command History
**Endpoint:** `GET /?r=h&i={instance}`

Returns command history for a specific instance.

**Parameters:**
- `r=h` - Request type (history)
- `i` - Instance number (0-2)

**Response:**
```json
[
  [1640995200, 1, 2],
  [1640998800, 0, 3],
  [1641002400, 1, 5]
]
```

**History Entry Format:**
Each entry is an array: `[timestamp, command, status]`
- `timestamp` - Unix timestamp when command was executed
- `command` - Command value (0=OFF, 1=ON)
- `status` - Status code when command was executed

### Control Operations

#### Reload Configuration
**Endpoint:** `GET /?r=r&i={instance}`

Reloads configuration from KVS storage.

**Parameters:**
- `r=r` - Request type (reload)
- `i` - Instance number (0-2) or omit for all instances

**Response:**
- HTTP 204 No Content

**Effect:**
- Marks configuration as needing reload
- Triggers price data refresh
- Restarts main loop

#### Force Manual Override
**Endpoint:** `GET /?r=f&i={instance}&ts={timestamp}&c={command}`

Forces manual override for specified duration.

**Parameters:**
- `r=f` - Request type (force)
- `i` - Instance number (0-2)
- `ts` - Expiry timestamp (Unix timestamp)
- `c` - Command to force (0=OFF, 1=ON)

**Response:**
- HTTP 204 No Content

**Example:**
```
GET /?r=f&i=0&ts=1641002400&c=1
```
Forces instance 0 to ON until timestamp 1641002400.

### Web Interface Assets

The API serves the embedded web interface files:

#### Main Interface
**Endpoint:** `GET /`

Returns the main HTML interface.

**Response:**
- Content-Type: `text/html`
- Gzipped HTML content

#### JavaScript Assets
**Endpoint:** `GET /?r=s.js`

Returns main JavaScript file.

**Response:**
- Content-Type: `text/javascript`
- Gzipped JavaScript content

#### CSS Assets
**Endpoint:** `GET /?r=s.css`

Returns main CSS file.

**Response:**
- Content-Type: `text/css`
- Gzipped CSS content

#### Tab Components
**Endpoints:**
- `GET /?r=status` - Status tab HTML
- `GET /?r=status.js` - Status tab JavaScript
- `GET /?r=history` - History tab HTML
- `GET /?r=history.js` - History tab JavaScript
- `GET /?r=config` - Configuration tab HTML
- `GET /?r=config.js` - Configuration tab JavaScript

## Status Codes

The system uses numeric status codes to indicate the current state:

| Code | Description |
|------|-------------|
| 0 | Initial state |
| 1 | Manual mode |
| 2 | Price limit - ON (price below limit) |
| 3 | Price limit - OFF (price above limit) |
| 4 | Cheapest hours - OFF (not cheapest hour) |
| 5 | Cheapest hours - ON (cheapest hour) |
| 6 | Always-on price limit active |
| 7 | No price data available |
| 8 | Time not synchronized |
| 9 | Manual force active |
| 10 | Forced hours active |
| 11 | Maximum price limit exceeded |
| 12 | User script override |
| 13 | Minutes limit exceeded |

## Error Handling

### HTTP Status Codes

- **200 OK** - Successful request
- **204 No Content** - Successful operation with no response body
- **400 Bad Request** - Invalid parameters
- **404 Not Found** - Unknown endpoint
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - System busy (loop running)

### Error Responses

When the system is busy, API requests return:
```
HTTP/1.1 503 Service Unavailable
```

### Rate Limiting

The API automatically handles rate limiting by returning 503 when the main loop is running. This prevents conflicts and ensures system stability.

## CORS Support

For development and external API access, CORS can be enabled by uncommenting lines in the [`onServerRequest`](src/shelly-spotprice-se.js:1266) function:

```javascript
// Uncomment for CORS support
response.headers.push(["Access-Control-Allow-Origin", "*"]);
```

## Integration Examples

### JavaScript Fetch API
```javascript
// Get system state
const response = await fetch('http://192.168.1.100/script/1/?r=s&i=0');
const state = await response.json();
console.log('Current price:', state.s.p[0].now);

// Force manual override for 1 hour
const expiry = Math.floor(Date.now() / 1000) + 3600;
await fetch(`http://192.168.1.100/script/1/?r=f&i=0&ts=${expiry}&c=1`);
```

### Python Requests
```python
import requests
import time

# Get configuration
response = requests.get('http://192.168.1.100/script/1/?r=c&i=0')
config = response.json()
print(f"Current mode: {config['mode']}")

# Force override for 30 minutes
expiry = int(time.time()) + 1800
requests.get(f'http://192.168.1.100/script/1/?r=f&i=0&ts={expiry}&c=0')
```

### curl Commands
```bash
# Get system state
curl "http://192.168.1.100/script/1/?r=s&i=0"

# Reload configuration
curl "http://192.168.1.100/script/1/?r=r"

# Get history
curl "http://192.168.1.100/script/1/?r=h&i=0"
```

## WebSocket Alternative

The API does not provide WebSocket support. For real-time updates, use polling:

```javascript
// Poll every 30 seconds
setInterval(async () => {
    const response = await fetch('http://192.168.1.100/script/1/?r=s&i=0');
    const state = await response.json();
    updateUI(state);
}, 30000);
```

## Security Considerations

### Network Access
- The API is accessible to any device on the local network
- No authentication is required
- Consider network segmentation for security

### Input Validation
- All numeric parameters are validated
- Invalid instance numbers are ignored
- Malformed requests return appropriate error codes

### Resource Protection
- The 503 response prevents concurrent access during operations
- Automatic cleanup prevents memory leaks
- Error limits prevent API flooding

## Performance Notes

### Response Compression
- Most responses are gzipped to reduce bandwidth
- JSON responses are not compressed for small payloads
- Static assets are always compressed

### Caching
- No explicit caching headers are set
- Browsers may cache static assets
- API responses should not be cached due to real-time nature

### Memory Usage
- Large objects are cleared after use
- Response bodies are nullified to free memory
- Minimal memory footprint maintained

## Troubleshooting

### Common Issues

1. **503 Service Unavailable**
   - System is busy processing
   - Wait and retry after a few seconds

2. **Empty Response**
   - Check instance number is valid (0-2)
   - Ensure script is running

3. **Outdated Data**
   - Check `timeOK` status
   - Verify network connectivity
   - Check error count and timestamp

### Debug Information

Use the system state endpoint to check:
```javascript
const state = await fetch('/?r=s&i=0').then(r => r.json());
console.log({
    version: state.s.v,
    timeOK: state.s.timeOK,
    errors: state.s.errCnt,
    lastError: new Date(state.s.errTs * 1000),
    uptime: new Date(state.s.upTs * 1000)
});
```

The HTTP API provides comprehensive access to all system functionality while maintaining the performance and reliability required for embedded IoT applications.