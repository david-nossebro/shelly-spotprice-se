# Development Guidelines for shelly-spotprice-se

This document provides comprehensive development guidelines for the shelly-spotprice-se project. These guidelines are designed to be AI-readable and ensure consistent, high-quality development practices for this embedded JavaScript application running on Shelly IoT devices.

## Table of Contents

- [Overview](#overview)
- [Core Development Principles](#core-development-principles)
- [Shelly/Espruino Constraints](#shellyespruino-constraints)
- [Code Structure and Quality](#code-structure-and-quality)
- [Memory Optimization Requirements](#memory-optimization-requirements)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)
- [Build and Deployment](#build-and-deployment)
- [Code Review Guidelines](#code-review-guidelines)
- [Release Management](#release-management)
- [AI Development Assistance](#ai-development-assistance)
- [Troubleshooting and Debugging](#troubleshooting-and-debugging)

## Overview

The shelly-spotprice-se project is an embedded JavaScript application that runs on Shelly IoT devices with severe memory and processing constraints. It controls electrical outputs based on Swedish electricity spot prices, implementing sophisticated logic while operating within ~50KB memory limits.

### Project Characteristics
- **Runtime Environment**: Espruino JavaScript engine on Shelly devices
- **Memory Constraints**: ~50KB available memory
- **Network Dependency**: Fetches real-time electricity prices via HTTP API
- **Real-time Operation**: Controls physical relays based on time-sensitive price data
- **Web Interface**: Embedded HTTP server with minified static assets
- **Extension System**: User script hooks for customization

## Core Development Principles

### 1. **Code Quality and Structure**
All code MUST be:
- **Well-structured**: Clear separation of concerns with logical organization
- **Easy to understand**: Self-documenting with meaningful variable names and comments
- **Simple**: Avoid unnecessary complexity; prefer straightforward solutions
- **Performant**: Optimized for embedded environment constraints

### 2. **Shelly Device Compatibility**
All code MUST:
- Run reliably on Shelly devices with Espruino JavaScript engine
- Account for CPU limitations (single-threaded, limited processing power)
- Respect memory constraints (see [Memory Optimization Requirements](#memory-optimization-requirements))
- Handle network interruptions gracefully
- Implement proper error recovery mechanisms

### 3. **Testing Coverage**
All new functionality MUST include:
- **Unit tests** for individual functions and logic components
- **Integration tests** for complete workflows
- **Mock implementations** for external dependencies (Shelly API, HTTP requests)
- **Edge case testing** for error conditions and boundary values

### 4. **Documentation Maintenance**
All changes MUST include:
- **Code documentation** updates (JSDoc comments)
- **API reference** updates for public interfaces
- **Architecture documentation** updates for structural changes
- **Configuration schema** updates for new settings
- **User documentation** updates for feature changes

### 5. **Quality Assurance**
Before any commit, ALL of the following MUST pass:
- **All tests pass** (`npm test`)
- **Linting passes** (`npm run lint`)
- **Code formatting** is correct (`npm run format:check`)
- **Build completes successfully** (`npm run build`)
- **Generated files are valid** and within size limits

### 6. **Release Documentation**
All changes MUST be documented in:
- **Release notes** with user-facing functionality descriptions
- **Changelog** with technical change details
- **Migration guides** for breaking changes
- **Configuration updates** for new settings

## Shelly/Espruino Constraints

### Runtime Environment Limitations

#### JavaScript Engine Constraints
```javascript
// ✅ SUPPORTED: ES6 features that work on Espruino
const config = { mode: 1, enabled: true };
let result = array.map(item => item.value);
for (const item of array) { /* process */ }

// ❌ AVOID: Features not supported or unreliable
class MyClass { } // Classes may have issues
async/await // Not supported
import/export // Not supported
```

#### Memory Management Patterns
```javascript
// ✅ REQUIRED: Use global loop variables to prevent stack overflow
for (_i = 0; _i < array.length; _i++) {
  // Use global _i, _j, _k variables
}

// ✅ REQUIRED: Explicit memory cleanup
function processRequest(request, response) {
  // Process request
  request = null; // Explicit cleanup
  response.headers = null; // Free memory
  response.send();
}

// ✅ REQUIRED: Abbreviated variable names in memory-critical sections
let cfg = _.c.i[inst]; // config
let st = _.si[inst];    // state
let chkTs = Date.now(); // checkTimestamp
```

#### Network and Timing Constraints
```javascript
// ✅ REQUIRED: Implement proper timeouts
Shelly.call("HTTP.GET", {
  url: apiUrl,
  timeout: 5, // Always specify timeout
  ssl_ca: "*" // Handle SSL appropriately
}, callback);

// ✅ REQUIRED: Handle network failures gracefully
function handleNetworkError() {
  _.s.errCnt += 1;
  _.s.errTs = epoch();
  // Implement exponential backoff
}
```

## Memory Optimization Requirements

### Critical Memory Patterns

#### 1. Global Loop Variables
```javascript
// ✅ REQUIRED: Use these global variables for all loops
let _i = 0, _j = 0, _k = 0;
let _inc = 0, _cnt = 0, _start = 0, _end = 0;

// Prevents stack overflow in nested loops
for (_i = 0; _i < outerArray.length; _i++) {
  for (_j = 0; _j < innerArray.length; _j++) {
    // Loop body
  }
}
```

#### 2. State Management
```javascript
// ✅ REQUIRED: Central state object minimizes fragmentation
let _ = {
  s: {},    // System state
  si: [],   // Instance states
  c: {},    // Configuration
  p: [],    // Price data
  h: []     // History
};
```

#### 3. Memory Cleanup Patterns
```javascript
// ✅ REQUIRED: Explicit cleanup in HTTP handlers
function onServerRequest(request, response) {
  let params = parseParams(request.query);
  request = null; // Free immediately after use
  
  // Process request
  
  params = null; // Clean up before response
  response.send();
}
```

#### 4. Efficient Data Structures
```javascript
// ✅ REQUIRED: Use compact data representations
// Price data: [epoch, price] arrays instead of objects
_.p[0] = [[1640995200, 0.15], [1640998800, 0.12]];

// Binary flags for hour-based settings
cfg.b = 0b110000000000000000000000; // Hours 0,1 enabled

// History: [epoch, command, status] tuples
_.h[inst].push([epoch(), cmd ? 1 : 0, statusCode]);
```

### Memory Monitoring Guidelines

#### Size Limits
- **Main script**: Target <40KB minified
- **Static files**: Each file <8KB compressed
- **Total memory usage**: Monitor during development
- **History length**: Dynamically adjusted based on enabled instances

#### Memory Testing
```javascript
// ✅ RECOMMENDED: Add memory usage logging during development
function logMemoryUsage(context) {
  // Only in development builds
  if (typeof DEBUG !== 'undefined') {
    console.log(`Memory check: ${context}`);
  }
}
```

## Code Structure and Quality

### File Organization
```
src/
├── shelly-spotprice-se.js     # Main application (single file for deployment)
├── statics/                   # Web interface files
│   ├── index.html            # Main UI
│   ├── s.css                 # Styles
│   ├── s.js                  # Common JavaScript
│   └── tab-*.html/js         # Tab-specific files
└── after-build/              # Build variants and extensions
```

### Code Documentation Standards

#### Function Documentation
```javascript
/**
 * Determines if current hour is among the cheapest in the configured period
 *
 * @param {number} inst - Instance number (0-based index)
 * @returns {boolean} true if current hour is among the cheapest
 * @description Implements complex logic for cheapest hours calculation including:
 *   - Period-based analysis (fixed or custom periods)
 *   - Sequential vs. individual hour selection
 *   - Forced hours override handling
 *   - Safety limit validation
 *
 * @example
 * // Check if current hour is cheapest for instance 0
 * const isCheapest = isCheapestHour(0);
 *
 * @see {@link ../types/index.d.ts#CheapestHoursConfig}
 * @see {@link ../types/index.d.ts#PriceData}
 */
function isCheapestHour(inst) {
  // Implementation
}
```

#### Type Annotations
```javascript
/**
 * Main application state object
 * @type {import('../types/index.d.ts').AppState}
 * @see {@link ../types/index.d.ts#AppState}
 */
let _ = {
  // State definition
};
```

### Code Organization Patterns

#### Section Headers
```javascript
// ============================================================================
// SECTION NAME
// ============================================================================
// Brief description of what this section contains and its purpose
```

#### Function Grouping
- **Utility Functions**: General-purpose helpers
- **State Management**: Configuration and state handling
- **Price Data Handling**: API communication and data processing
- **Control Logic**: Core decision-making algorithms
- **Device Communication**: Shelly API interactions
- **HTTP Server**: Web interface and API endpoints

### Error Handling Standards

#### Network Errors
```javascript
function handleApiError(error, context) {
  log(`Error in ${context}: ${error}`);
  _.s.errCnt += 1;
  _.s.errTs = epoch();
  
  // Implement appropriate recovery strategy
  if (_.s.errCnt >= CNST.ERR_LIMIT) {
    // Enter error delay mode
  }
}
```

#### Configuration Errors
```javascript
function validateConfig(config) {
  // Apply safety limits
  config.m2.c = limit(0, config.m2.c, 24);
  config.m2.ps = limit(0, config.m2.ps, 23);
  
  // Provide defaults for missing values
  if (typeof config.vat === 'undefined') {
    config.vat = 25; // Default VAT
  }
}
```

## Testing Requirements

### Test Structure
```
tests/
├── setup.js                  # Test environment setup
├── mocks/
│   └── shelly-api.js         # Mock Shelly API implementations
├── unit/                     # Unit tests
│   ├── price-logic.test.js   # Core logic functions
│   ├── config-validation.test.js
│   └── utility-functions.test.js
└── integration/              # Integration tests
    └── full-workflow.test.js # End-to-end scenarios
```

### Unit Testing Standards

#### Test Coverage Requirements
- **Minimum 70% coverage** for all metrics (lines, functions, branches, statements)
- **100% coverage** for critical functions: `logic()`, `isCheapestHour()`, `getPrices()`
- **Edge case testing** for all boundary conditions
- **Error condition testing** for all failure modes

#### Test Implementation Patterns
```javascript
describe('Price Logic Functions', () => {
  let mockState;

  beforeEach(() => {
    // Setup clean test environment
    testHelpers.setupBasicMocks();
    mockState = testHelpers.createMockState();
    global._ = mockState;
    
    // Initialize global loop variables
    global._i = 0;
    global._j = 0;
    global._k = 0;
  });

  test('should handle cheapest hours calculation correctly', () => {
    // Arrange
    mockState.c.i[0].mode = 2;
    mockState.c.i[0].m2.c = 4;
    mockState.p[0] = mockPriceData.today;
    
    // Act
    const result = isCheapestHour(0);
    
    // Assert
    expect(typeof result).toBe('boolean');
    expect(mockState.si[0].st).toBeGreaterThan(0);
  });
});
```

### Integration Testing Standards

#### Workflow Testing
```javascript
describe('Full Application Workflow', () => {
  test('should handle complete price fetching and logic execution', async () => {
    // Setup mock responses
    global.Shelly.setMockResponse('HTTP.GET', {
      url: expect.stringContaining('elprisetjustnu.se')
    }, {
      result: { code: 200, body: JSON.stringify(mockPriceData.today) }
    });
    
    // Test complete workflow
    const workflow = new ApplicationWorkflow();
    await workflow.fetchPrices();
    await workflow.executeLogic();
    await workflow.controlDevices();
    
    // Verify end-to-end behavior
    expect(workflow.state.s.p[0].ts).toBeGreaterThan(0);
    expect(workflow.deviceCommands).toBeDefined();
  });
});
```

### Mock Implementation Standards

#### Shelly API Mocking
```javascript
// Mock must simulate real Shelly API behavior
global.Shelly = {
  call: jest.fn((method, params, callback) => {
    const mockResponse = getMockResponse(method, params);
    if (callback) {
      callback(mockResponse.result, mockResponse.error_code || 0, mockResponse.error_message || '');
    }
    return mockResponse.result;
  }),
  
  getComponentStatus: jest.fn((component) => {
    return mockComponentStatus[component] || {};
  })
};
```

## Documentation Standards

### Code Documentation Requirements

#### JSDoc Standards
```javascript
/**
 * Brief function description
 *
 * @param {type} paramName - Parameter description
 * @returns {type} Return value description
 * @throws {Error} When error conditions occur
 * @description Detailed description of complex logic
 * @example
 * // Usage example
 * const result = functionName(param);
 * 
 * @see {@link ../types/index.d.ts#TypeName}
 * @since 4.0.0
 */
```

#### Type Definitions
- **Complete TypeScript definitions** in [`types/`](../types/) directory
- **Interface documentation** for all public APIs
- **Configuration schema** documentation with examples
- **Status code documentation** with meanings

### API Documentation

#### HTTP Endpoints
```javascript
/**
 * Handles HTTP requests for web interface and API
 *
 * @param {import('../types/shelly-api.d.ts').IncomingHTTPRequest} request
 * @param {import('../types/shelly-api.d.ts').OutgoingHTTPResponse} response
 * 
 * @description Supported endpoints:
 * - `/?r=s&i={instance}` - Get system state
 * - `/?r=c&i={instance}` - Get configuration  
 * - `/?r=h&i={instance}` - Get command history
 * - `/?r=r&i={instance}` - Reload configuration
 * - `/?r=f&i={instance}&ts={timestamp}&c={command}` - Force manual override
 */
```

### Architecture Documentation

#### System Design Updates
When making structural changes, update:
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) - Component relationships
- [`docs/DATA_FLOW.md`](DATA_FLOW.md) - Data movement patterns
- [`docs/API_REFERENCE.md`](API_REFERENCE.md) - Function signatures
- [`docs/CONFIGURATION_SCHEMA.md`](CONFIGURATION_SCHEMA.md) - Settings structure

## Build and Deployment

### Build Process Requirements

#### Pre-build Validation
```bash
# Required checks before building
npm run lint          # ESLint validation
npm run format:check  # Prettier formatting
npm test             # All tests must pass
npm run build        # Build must complete successfully
```

#### Build Pipeline
1. **Source Processing**: Main script processed by [`shelly-builder.js`](../shelly-builder.js)
2. **Minification**: UglifyJS with memory-optimized settings
3. **Static File Processing**: HTML/CSS minification with gzip compression
4. **Variant Generation**: [`after-build.js`](../after-build.js) creates specialized versions
5. **Size Validation**: Verify generated files meet size constraints

#### Build Configuration
```javascript
// UglifyJS settings for Shelly compatibility
const minifyOptions = {
  toplevel: true,
  mangle: {
    toplevel: false,
    reserved: ['CNST', '_'] // Preserve critical identifiers
  },
  compress: {
    pure_funcs: ['DBG'], // Remove debug functions
    unsafe: true
  }
};
```

### Deployment Standards

#### Pre-deployment Checklist
- [ ] All tests pass (`npm test`)
- [ ] Code is properly linted (`npm run lint`)
- [ ] Code is formatted (`npm run format:check`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Generated files are within size limits
- [ ] Device testing completed on target hardware
- [ ] Documentation updated
- [ ] Release notes prepared

#### Deployment Process
```bash
# Standard deployment workflow
npm run dev          # Full development cycle
npm run build        # Generate distribution files
npm run upload       # Deploy to Shelly device (if configured)
```

## Code Review Guidelines

### Review Checklist

#### Code Quality
- [ ] **Readability**: Code is self-documenting with clear variable names
- [ ] **Simplicity**: Solution is as simple as possible but no simpler
- [ ] **Performance**: No unnecessary computations or memory allocations
- [ ] **Error Handling**: Appropriate error handling for all failure modes

#### Shelly Compatibility
- [ ] **Memory Patterns**: Uses global loop variables and memory cleanup
- [ ] **API Usage**: Proper Shelly API calls with timeouts and error handling
- [ ] **Size Constraints**: Generated code fits within device limitations
- [ ] **Runtime Testing**: Tested on actual Shelly hardware when possible

#### Testing and Documentation
- [ ] **Test Coverage**: New functionality has comprehensive tests
- [ ] **Documentation**: All public interfaces documented with JSDoc
- [ ] **Type Definitions**: TypeScript definitions updated for new interfaces
- [ ] **Examples**: Complex functionality includes usage examples

### Review Process

#### Pull Request Requirements
1. **Description**: Clear description of changes and rationale
2. **Testing**: Evidence of testing (test results, device testing)
3. **Documentation**: Updated documentation for any interface changes
4. **Size Impact**: Report on generated file size changes
5. **Breaking Changes**: Clear identification and migration guidance

#### Reviewer Responsibilities
- **Functional Review**: Verify logic correctness and edge case handling
- **Performance Review**: Check for memory leaks and optimization opportunities
- **Security Review**: Validate input handling and network security
- **Compatibility Review**: Ensure Shelly device compatibility maintained

## Release Management

### Version Control

#### Semantic Versioning
- **MAJOR**: Breaking changes requiring user intervention
- **MINOR**: New features with backward compatibility
- **PATCH**: Bug fixes and minor improvements

#### Release Preparation
```bash
# Release preparation workflow
npm run dev                    # Verify all checks pass
npm run test:coverage         # Ensure coverage targets met
npm run build                 # Generate final distribution files
# Update CHANGELOG.md
# Update version in package.json and source files
# Create release notes
```

### Release Documentation

#### Changelog Format
```markdown
## [4.1.0] - 2024-01-15

### Added
- New cheapest hours sequential mode
- Custom period configuration support
- Enhanced error recovery mechanisms

### Changed
- Improved memory optimization patterns
- Updated API response format for better efficiency

### Fixed
- Fixed timezone handling edge cases
- Resolved memory leak in HTTP request handling

### Technical
- Added comprehensive TypeScript definitions
- Improved test coverage to 85%
- Enhanced build process with size validation
```

#### Release Notes Format
```markdown
# Release 4.1.0 - Enhanced Cheapest Hours Control

## New Features
- **Sequential Hours Mode**: Select cheapest consecutive hours instead of individual hours
- **Custom Time Periods**: Define specific time ranges for cheapest hour selection
- **Improved Reliability**: Enhanced error recovery and network failure handling

## Configuration Changes
- Added `s` parameter to cheapest hours mode for sequential selection
- Added `ps`, `pe`, `ps2`, `pe2` parameters for custom period definitions

## Migration Guide
Existing configurations will continue to work without changes. To use new features:
1. Enable sequential mode: Set `m2.s = 1`
2. Configure custom periods: Set `m2.p = -1` and define `ps`/`pe` values
```

## AI Development Assistance

### AI-Friendly Code Patterns

#### Clear Function Signatures
```javascript
/**
 * @param {number} inst - Instance number (0-based)
 * @param {boolean} command - Desired output state
 * @param {function(boolean): void} callback - Completion callback
 */
function setRelay(inst, command, callback) {
  // Implementation with clear parameter usage
}
```

#### Comprehensive Type Definitions
```typescript
// Complete interface definitions enable accurate AI analysis
export interface InstanceConfig {
  en: 0 | 1;                    // Enabled status
  mode: 0 | 1 | 2;             // Operating mode
  m0: ManualModeConfig;        // Mode-specific configs
  m1: PriceLimitConfig;
  m2: CheapestHoursConfig;
  // ... complete definition
}
```

#### Self-Documenting Code Structure
```javascript
// ============================================================================
// CONTROL LOGIC
// ============================================================================
// This section contains the core control logic that determines when devices
// should be turned on/off based on price data, time, and configuration settings.

/**
 * Runs the main logic for a specific instance
 * @description Determines output command based on current mode:
 *   - Mode 0: Manual control
 *   - Mode 1: Price limit comparison  
 *   - Mode 2: Cheapest hours calculation
 */
function logic(inst) {
  // Clear implementation with documented decision points
}
```

### AI Analysis Support

#### Test-Driven Understanding
```javascript
// Tests serve as executable documentation for AI analysis
describe('Price Logic Functions', () => {
  test('should return true when current hour is among cheapest', () => {
    // Test setup demonstrates expected behavior
    const priceData = [[currentHour, 0.10], [nextHour, 0.15]];
    const config = { m2: { c: 1, p: 24 } };
    
    expect(isCheapestHour(0, priceData, config)).toBe(true);
  });
});
```

#### Configuration Schema Documentation
```javascript
/**
 * @see {@link ../types/config.d.ts#ConfigurationSchema}
 * @example
 * {
 *   "g": "SE3",           // Price region
 *   "vat": 25,            // VAT percentage
 *   "day": 4.0,           // Day transfer fee
 *   "night": 3.0          // Night transfer fee
 * }
 */
```

### AI Development Guidelines

#### When Using AI Tools
1. **Provide Context**: Include relevant type definitions and documentation
2. **Specify Constraints**: Mention Shelly/Espruino limitations explicitly
3. **Include Examples**: Reference existing patterns and test cases
4. **Validate Output**: Always test AI-generated code on actual hardware
5. **Memory Awareness**: Ensure AI understands memory optimization requirements

#### AI-Generated Code Review
- **Memory Patterns**: Verify global loop variables are used correctly
- **API Compatibility**: Check Shelly API usage matches existing patterns
- **Error Handling**: Ensure proper error recovery mechanisms
- **Testing**: Require comprehensive tests for AI-generated functionality

## Troubleshooting and Debugging

### Common Development Issues

#### Memory-Related Problems
```javascript
// ❌ PROBLEM: Stack overflow in nested loops
for (let i = 0; i < outer.length; i++) {
  for (let j = 0; j < inner.length; j++) {
    // Causes stack issues
  }
}

// ✅ SOLUTION: Use global loop variables
for (_i = 0; _i < outer.length; _i++) {
  for (_j = 0; _j < inner.length; _j++) {
    // Works reliably
  }
}
```

#### Build Issues
```javascript
// ❌ PROBLEM: Minification breaks code
const config = {
  mode: 1,
  settings: { /* complex object */ }
};

// ✅ SOLUTION: Use reserved names in build config
const minifyOptions = {
  mangle: {
    reserved: ['CNST', '_', 'USER_CONFIG'] // Preserve critical names
  }
};
```

#### Network Reliability
```javascript
// ✅ REQUIRED: Always implement proper error handling
Shelly.call("HTTP.GET", {
  url: apiUrl,
  timeout: 5,
  ssl_ca: "*"
}, function(res, err, msg) {
  if (err !== 0) {
    handleNetworkError(err, msg);
    return;
  }
  // Process successful response
});
```

### Debugging Tools

#### Development Logging
```javascript
// Use consistent logging format
function log(message) {
  console.log("shelly-spotprice-se: " + message);
}

// Include context in error messages
function logError(context, error) {
  log(`Error in ${context}: ${JSON.stringify(error)}`);
}
```

#### State Inspection
```javascript
// Provide HTTP endpoints for state inspection
if (params.r === "debug") {
  response.body = JSON.stringify({
    memory: /* memory usage info */,
    state: _.s,
    instances: _.si,
    prices: _.p
  });
}
```

### Performance Monitoring

#### Size Monitoring
```bash
# Monitor generated file sizes
npm run build
ls -la dist/          # Check file sizes
npm run stats         # Detailed size analysis
```

#### Runtime Monitoring
```javascript
// Add performance markers in development
function performanceCheck(label) {
  if (typeof DEBUG !== 'undefined') {
    log(`Performance: ${label} at ${Date.now()}`);
  }
}
```

---

## Compliance Checklist

Before submitting any code changes, verify compliance with ALL guidelines:

### Code Quality ✓
- [ ] Code is well-structured and easy to understand
- [ ] Solution is simple and performant
- [ ] Follows established patterns and conventions
- [ ] Includes comprehensive error handling

### Shelly Compatibility ✓
- [ ] Uses global loop variables for memory optimization
- [ ] Implements proper memory cleanup patterns
- [ ] Respects CPU and memory constraints
- [ ] Handles network failures gracefully

### Testing ✓
- [ ] Unit tests added for new functionality
- [ ] Integration tests cover complete workflows
- [ ] All tests pass (`npm test`)
- [ ] Coverage meets minimum requirements (70%)

### Documentation ✓
- [ ] JSDoc comments for all public functions
- [ ] TypeScript definitions updated
- [ ] Architecture documentation updated
- [ ] Configuration schema updated
- [ ] Release notes prepared

### Quality Assurance ✓
- [ ] ESLint validation passes (`npm run lint`)
- [ ] Code formatting correct (`npm run format:check`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Generated files within size limits
- [ ] Device testing completed (when possible)

### Release Management ✓
- [ ] Version numbers updated appropriately
- [ ] Changelog updated with changes
- [ ] Breaking changes documented
- [ ] Migration guide provided (if needed)

---

*This document is maintained as part of the shelly-spotprice-se project and should be updated whenever development practices evolve or new constraints are identified.*