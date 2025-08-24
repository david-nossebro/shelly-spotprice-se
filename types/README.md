# TypeScript Type Definitions for shelly-spotprice-se

This directory contains comprehensive TypeScript type definitions for the shelly-spotprice-se project, enabling better IntelliSense support, AI tool compatibility, and development experience.

## Files Overview

### [`index.d.ts`](./index.d.ts)
Main type definitions for core application objects and interfaces:
- `AppState` - The global `_` object structure
- `SystemState`, `InstanceState` - System and instance state interfaces
- `Configuration`, `CommonConfig`, `InstanceConfig` - Configuration schemas
- `PriceData`, `HistoryEntry` - Data structure types
- `UserScriptHooks` - Extension function interfaces
- `StatusCodes` - Enumeration of all status codes used in the application

### [`shelly-api.d.ts`](./shelly-api.d.ts)
Shelly device API type definitions:
- `ShellyAPI` - Main Shelly API interface
- `ShellySystemStatus`, `ShellyWiFiStatus` - Component status types
- `HTTPRequest`, `HTTPResponse` - HTTP client types
- `ShellyKVS` - Key-Value Store operations
- `ShellyTimer`, `ShellyHTTPServer` - Utility interfaces
- Global declarations for Shelly runtime environment

### [`config.d.ts`](./config.d.ts)
Configuration schema definitions with validation constraints:
- `ConfigurationSchema` - Complete schema with validation rules
- `DefaultConfigValues` - Default configuration values
- `ConfigValidationResult` - Validation result types
- `ConfigConstraints` - Validation constraints and limits
- Mode-specific configuration schemas (Manual, Price Limit, Cheapest Hours)

## Usage

### In VS Code
1. These type definitions will automatically provide IntelliSense when editing JavaScript files
2. JSDoc comments in the main source file reference these types for enhanced documentation
3. AI tools can understand the data structures and provide better assistance

### For Development
```javascript
/**
 * Example function with type annotations
 * @param {import('./types/index.d.ts').InstanceConfig} config
 * @returns {boolean}
 */
function validateInstanceConfig(config) {
  return config.en === 1 && config.mode >= 0 && config.mode <= 2;
}
```

### For AI Tools
The type definitions enable AI tools to:
- Understand complex nested object structures
- Provide accurate auto-completion suggestions
- Identify potential type mismatches
- Generate better code suggestions
- Understand the relationships between different parts of the system

## Key Features

### Comprehensive Coverage
- **Core Types**: All main application objects (`_`, `CNST`, configuration structures)
- **API Types**: Complete Shelly device API coverage
- **Configuration**: Detailed schema with validation constraints
- **Extension Points**: User script hook interfaces
- **Status Codes**: Enumerated status values with descriptions

### Validation Support
- Type constraints for all configuration values
- Validation error and warning structures
- Default value definitions
- Migration support interfaces

### Documentation Integration
- JSDoc references link code to type definitions
- Detailed descriptions for all interfaces
- Usage examples and cross-references
- Status code documentation

## Status Code Reference

The application uses the following status codes (defined in `StatusCodes` enum):

| Code | Name | Description |
|------|------|-------------|
| 0 | UNKNOWN | Initial/unknown state |
| 1 | MANUAL | Manual mode active |
| 2 | PRICE_LIMIT_ON | Price limit mode - output on |
| 3 | PRICE_LIMIT_OFF | Price limit mode - output off |
| 4 | CHEAPEST_OFF | Cheapest hours mode - output off |
| 5 | CHEAPEST_ON | Cheapest hours mode - output on |
| 6 | ALWAYS_ON_LIMIT | Always-on price limit triggered |
| 7 | NO_DATA_BACKUP | No price data, using backup hours |
| 8 | NO_TIME | No valid time available |
| 9 | MANUAL_FORCE | Manual force active |
| 10 | FORCED_HOURS | Forced hours active |
| 11 | MAX_PRICE_EXCEEDED | Maximum price limit exceeded |
| 12 | USER_OVERRIDE | User script override |
| 13 | MINUTES_LIMIT | Output limited by minutes setting |

## Configuration Schema

### Operating Modes
- **Mode 0**: Manual control (on/off toggle)
- **Mode 1**: Price limit (on when price ≤ threshold)
- **Mode 2**: Cheapest hours (on during cheapest hours of period)

### Price Regions
- **SE1**: Northern Sweden
- **SE2**: Central Sweden  
- **SE3**: Southern Sweden
- **SE4**: Malmö region

### Binary Hour Flags
Hours 0-23 can be represented as binary flags:
- `0b000000000000000000000001` = Hour 0
- `0b000000000000000000000010` = Hour 1
- `0b111111111111111111111111` = All hours

## Integration with AI Improvement Plan

These type definitions support Phase 1 of the AI Improvement Plan by:

1. **Enhancing AI Tool Compatibility**
   - Providing clear data structure definitions
   - Enabling better code analysis and suggestions
   - Supporting automated refactoring capabilities

2. **Improving Documentation**
   - Linking code to comprehensive type information
   - Providing validation constraints and defaults
   - Documenting extension points and APIs

3. **Supporting Development Workflow**
   - Enabling better IntelliSense in VS Code
   - Providing type checking capabilities
   - Supporting automated testing and validation

## Future Enhancements

These type definitions can be extended to support:
- Runtime type validation
- Configuration migration utilities
- Automated testing frameworks
- API documentation generation
- Code generation tools

## Contributing

When modifying the main application code:
1. Update corresponding type definitions
2. Add JSDoc references to new functions
3. Update validation constraints as needed
4. Test with AI tools to ensure compatibility

For questions or improvements, refer to the main project documentation and the AI Improvement Plan.