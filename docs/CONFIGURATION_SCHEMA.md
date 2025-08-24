# Configuration Schema Documentation

This document provides comprehensive documentation for all configuration properties used in the shelly-spotprice-se application. The configuration is stored in Shelly's Key-Value Store (KVS) and consists of common settings shared across all instances and individual instance-specific settings.

## Overview

The configuration system uses a hierarchical structure:
- **Common Settings** (`_.c.c`): Shared settings that apply to all instances
- **Instance Settings** (`_.c.i[n]`): Individual settings for each instance (n = 0, 1, 2...)

## Common Settings (`_.c.c`)

These settings are shared across all instances and stored with KVS key `"sptprc-se"`.

### Price and Location Settings

| Property | Type | Description | Default | Example | Validation |
|----------|------|-------------|---------|---------|------------|
| `g` | `string` | Price region/zone for Swedish electricity market | `"SE3"` | `"SE1"`, `"SE2"`, `"SE3"`, `"SE4"` | Must be one of SE1, SE2, SE3, SE4 |
| `vat` | `number` | VAT percentage added to spot price | `25` | `25`, `12`, `6` | 0-100 |
| `day` | `number` | Day transfer fee in c/kWh (06:00-22:00) | `0` | `4.0`, `3.5` | ≥ 0 |
| `night` | `number` | Night transfer fee in c/kWh (22:00-06:00) | `0` | `3.0`, `2.5` | ≥ 0 |

### Instance Management

| Property | Type | Description | Default | Example |
|----------|------|-------------|---------|---------|
| `names` | `string[]` | Display names for each instance | `["-", "-", "-"]` | `["Heater", "Car Charger", "Pool Pump"]` |

## Instance Settings (`_.c.i[n]`)

Each instance has its own configuration stored with KVS key `"sptprc-se-{n+1}"` where n is the instance index.

### Basic Instance Settings

| Property | Type | Description | Default | Example | Validation |
|----------|------|-------------|---------|---------|------------|
| `en` | `0\|1` | Instance enabled flag | `0` | `1` | Must be 0 or 1 |
| `mode` | `0\|1\|2` | Control mode | `0` | `2` | 0=manual, 1=price limit, 2=cheapest hours |
| `o` | `number[]` | Output/relay IDs to control | `[0]` | `[0, 1]`, `[2]` | Array of valid relay IDs |
| `i` | `0\|1` | Invert output (0=normal, 1=inverted) | `0` | `1` | Must be 0 or 1 |

### Mode-Specific Settings

#### Mode 0: Manual Control (`m0`)

| Property | Type | Description | Default | Example |
|----------|------|-------------|---------|---------|
| `m0.c` | `0\|1` | Manual relay command (0=off, 1=on) | `0` | `1` |

#### Mode 1: Price Limit (`m1`)

| Property | Type | Description | Default | Example | Notes |
|----------|------|-------------|---------|---------|-------|
| `m1.l` | `number\|"avg"` | Price limit in c/kWh | `0` | `50`, `"avg"` | If price ≤ limit, relay turns on |

#### Mode 2: Cheapest Hours (`m2`)

| Property | Type | Description | Default | Example | Validation |
|----------|------|-------------|---------|---------|------------|
| `m2.p` | `number` | Period length in hours (-1=custom, -2=dual custom) | `24` | `12`, `-1` | -2 to 24 |
| `m2.c` | `number` | Number of cheapest hours to select | `0` | `4`, `8` | 0 to period length |
| `m2.l` | `number\|"avg"` | Always-on price limit in c/kWh | `-999` | `30`, `"avg"` | Forces on regardless of cheapest hours |
| `m2.s` | `0\|1` | Sequential hours required (0=any, 1=consecutive) | `0` | `1` | Must be 0 or 1 |
| `m2.m` | `number\|"avg"` | Maximum price limit in c/kWh | `999` | `100`, `"avg"` | Forces off even during cheapest hours |

##### Custom Period Settings (when `m2.p = -1` or `-2`)

| Property | Type | Description | Default | Example | Validation |
|----------|------|-------------|---------|---------|------------|
| `m2.ps` | `number` | Custom period 1 start hour | `0` | `6` | 0-23 |
| `m2.pe` | `number` | Custom period 1 end hour | `23` | `22` | ps to 24 |
| `m2.ps2` | `number` | Custom period 2 start hour (dual custom only) | `0` | `0` | 0-23 |
| `m2.pe2` | `number` | Custom period 2 end hour (dual custom only) | `23` | `5` | ps2 to 24 |
| `m2.c2` | `number` | Cheapest hours for period 2 (dual custom only) | `0` | `2` | 0 to period 2 length |

### Advanced Settings

| Property | Type | Description | Default | Example | Notes |
|----------|------|-------------|---------|---------|-------|
| `b` | `number` | Backup hours (binary mask) | `0b0` | `0b111111` | Hours 0-5 as backup when no price data |
| `e` | `0\|1` | Emergency command when time unknown | `0` | `1` | Fallback when NTP not synced |
| `f` | `number` | Forced hours (binary mask) | `0b0` | `0b110000000000001100001` | Override cheapest hours logic |
| `fc` | `number` | Forced hours commands (binary mask) | `0b0` | `0b110000000000001100000` | Commands for forced hours |
| `m` | `number` | Minutes per hour to run (1-60) | `60` | `30` | Limits operation to first N minutes |
| `oc` | `0\|1` | Output control mode | `0` | `1` | 0=always set, 1=only on change |

## Binary Hour Masks

Several settings use binary masks to represent 24-hour periods where each bit represents one hour:

```
Bit:  23 22 21 20 19 18 17 16 15 14 13 12 11 10  9  8  7  6  5  4  3  2  1  0
Hour: 23 22 21 20 19 18 17 16 15 14 13 12 11 10  9  8  7  6  5  4  3  2  1  0
```

### Examples

- `0b111111` = Hours 0, 1, 2, 3, 4, 5 (first 6 hours of day)
- `0b110000000000001100001` = Hours 0, 5, 6, 19, 20
- `0b111111110000000000000000` = Hours 17-23 (evening hours)

## Configuration Examples

### Example 1: Simple Price Limit Setup

```json
{
  "common": {
    "g": "SE3",
    "vat": 25,
    "day": 4.0,
    "night": 3.0,
    "names": ["Water Heater", "Car Charger", "Pool Pump"]
  },
  "instance_0": {
    "en": 1,
    "mode": 1,
    "m1": { "l": 50 },
    "o": [0],
    "i": 0
  }
}
```

### Example 2: Cheapest Hours with Custom Period

```json
{
  "instance_1": {
    "en": 1,
    "mode": 2,
    "m2": {
      "p": -1,
      "c": 4,
      "ps": 22,
      "pe": 6,
      "l": 30,
      "m": 100,
      "s": 0
    },
    "o": [1],
    "i": 0
  }
}
```

### Example 3: Sequential Cheapest Hours

```json
{
  "instance_2": {
    "en": 1,
    "mode": 2,
    "m2": {
      "p": 24,
      "c": 6,
      "s": 1,
      "l": -999,
      "m": "avg"
    },
    "o": [0, 1],
    "i": 0,
    "m": 30
  }
}
```

### Example 4: Forced Hours Override

```json
{
  "instance_0": {
    "en": 1,
    "mode": 2,
    "m2": {
      "p": 24,
      "c": 8
    },
    "f": 0b110000000000000000000,
    "fc": 0b100000000000000000000,
    "o": [0]
  }
}
```

## Validation Rules

### Common Validation
- All numeric values must be finite numbers
- Boolean values (0/1) must be exactly 0 or 1
- Array values must contain valid elements

### Specific Validations
- `g`: Must be one of "SE1", "SE2", "SE3", "SE4"
- `vat`: 0 ≤ vat ≤ 100
- `day`, `night`: Must be ≥ 0
- `mode`: Must be 0, 1, or 2
- `m2.p`: -2 ≤ p ≤ 24
- `m2.c`: 0 ≤ c ≤ period_length
- `m2.ps`, `m2.pe`: 0 ≤ ps < pe ≤ 24
- `m`: 1 ≤ m ≤ 60
- Binary masks: 0 ≤ value ≤ 0b111111111111111111111111

## TypeScript Integration

This configuration schema is fully integrated with the TypeScript definitions in [`types/config.d.ts`](../types/config.d.ts). The type definitions provide:

- **Type Safety**: Compile-time validation of configuration structure
- **IntelliSense**: Auto-completion in development environments  
- **Documentation**: Inline documentation for all properties
- **Validation**: Runtime type checking capabilities

### Key Types

- [`Configuration`](../types/config.d.ts): Root configuration interface
- [`CommonConfig`](../types/config.d.ts): Common settings interface
- [`InstanceConfig`](../types/config.d.ts): Instance settings interface
- [`ModeConfigs`](../types/config.d.ts): Mode-specific configuration interfaces

## Storage and Persistence

Configuration data is stored in Shelly's Key-Value Store (KVS) with the following keys:

- **Common settings**: `"sptprc-se"`
- **Instance N settings**: `"sptprc-se-{N+1}"` (e.g., "sptprc-se-1", "sptprc-se-2", "sptprc-se-3")

The configuration is automatically validated and missing properties are populated with default values when the application starts.

## Migration and Compatibility

When upgrading the application:

1. **Backward Compatibility**: New properties are added with sensible defaults
2. **Validation**: Invalid configurations are corrected automatically
3. **Migration**: Old configuration formats are migrated transparently
4. **Preservation**: Existing user settings are preserved during updates

## Troubleshooting

### Common Configuration Issues

1. **Instance not responding**: Check `en` flag is set to 1
2. **Unexpected behavior**: Verify `mode` matches intended control method
3. **Price limits not working**: Ensure price data is available and `g` region is correct
4. **Forced hours not working**: Check binary mask format and time synchronization
5. **Output not switching**: Verify `o` array contains correct relay IDs

### Debug Information

The application provides configuration status through the HTTP API:
- **GET** `/?r=c&i=-1`: Get common configuration
- **GET** `/?r=c&i=N`: Get instance N configuration
- **GET** `/?r=s&i=N`: Get full state including configuration status

## See Also

- [Architecture Documentation](ARCHITECTURE.md)
- [API Reference](API_REFERENCE.md)
- [Data Flow Documentation](DATA_FLOW.md)
- [TypeScript Definitions](../types/)