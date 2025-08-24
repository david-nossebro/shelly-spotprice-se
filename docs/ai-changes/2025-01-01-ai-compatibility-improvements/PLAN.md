# AI Tool Compatibility Improvement Plan
## shelly-spotprice-se Codebase Enhancement

### Executive Summary

This document outlines a comprehensive plan to improve AI tool compatibility for the shelly-spotprice-se project. The improvements focus on enhancing code readability, documentation, development workflow, and maintainability to make the codebase more accessible to AI-powered development tools.

### Current State Analysis

#### Project Overview
- **Purpose**: IoT script for controlling Shelly devices based on Swedish electricity spot prices
- **Main Script**: 1,349 lines of JavaScript optimized for resource-constrained devices
- **Architecture**: Embedded web server with real-time price fetching and device control
- **Extensions**: User script system for customization

#### Key Challenges Identified

1. **Memory-Optimized Code Patterns**
   - Global variables (`_i`, `_j`, `_k`) used to prevent stack overflow
   - Abbreviated variable names for memory efficiency
   - Complex nested state management

2. **Limited Documentation**
   - Missing JSDoc annotations for most functions
   - No type definitions for complex objects
   - Unclear API contracts for extension points

3. **Development Environment**
   - No linting or code quality tools
   - Limited testing framework
   - Build process documentation gaps

4. **AI Tool Compatibility Issues**
   - Complex callback patterns
   - Implicit type contracts
   - Mixed concerns in single functions
   - Unclear data flow patterns

### Improvement Plan

## Phase 1: Foundation Documentation (Priority: High)

### 1.1 Architecture Documentation
**Files to Create:**
- `docs/ARCHITECTURE.md` - System overview and component relationships
- `docs/DATA_FLOW.md` - State management and data flow patterns
- `docs/API_REFERENCE.md` - Internal API documentation

**Content:**
```markdown
# Architecture Overview
## Core Components
- State Manager (`_` object)
- Price Fetcher (elprisetjustnu.se API)
- Device Controller (Shelly API)
- Web Server (HTTP endpoints)
- Extension System (USER_* hooks)

## Data Flow
1. Price Fetching → State Update → Logic Execution → Device Control
2. Web Interface → Configuration → State Persistence (KVS)
3. User Scripts → Logic Override → Final Command
```

### 1.2 Type Definitions
**Files to Create:**
- `types/index.d.ts` - TypeScript definitions for main objects
- `types/shelly-api.d.ts` - Shelly device API types
- `types/config.d.ts` - Configuration object schemas

**Key Types to Define:**
```typescript
interface AppState {
  s: SystemState;
  si: InstanceState[];
  c: Configuration;
  p: PriceData[][];
  h: HistoryEntry[][];
}

interface Configuration {
  c: CommonConfig;
  i: InstanceConfig[];
}

interface InstanceConfig {
  en: number; // enabled
  mode: 0 | 1 | 2; // manual | price_limit | cheapest_hours
  m0: ManualModeConfig;
  m1: PriceLimitConfig;
  m2: CheapestHoursConfig;
  // ... other properties
}
```

### 1.3 JSDoc Enhancement
**Target Functions (Priority Order):**
1. Core logic functions: `logic()`, `isCheapestHour()`, `getPrices()`
2. State management: `updateState()`, `chkConfig()`, `getConfig()`
3. HTTP handlers: `onServerRequest()`, `parseParams()`
4. Utility functions: `epoch()`, `limit()`, `updateTz()`

**JSDoc Template:**
```javascript
/**
 * Executes the main control logic for a specific instance
 * 
 * @param {number} inst - Instance number (0-based index)
 * @description Determines output command based on current mode:
 *   - Mode 0: Manual control
 *   - Mode 1: Price limit comparison
 *   - Mode 2: Cheapest hours calculation
 * 
 * @example
 * // Execute logic for first instance
 * logic(0);
 * 
 * @see {@link isCheapestHour} for cheapest hours calculation
 * @see {@link updateCurrentPrice} for price data updates
 */
function logic(inst) {
  // ... implementation
}
```

## Phase 2: Code Organization (Priority: High)

### 2.1 Function Grouping and Comments
**Reorganization Strategy:**
```javascript
// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// ============================================================================
// PRICE DATA HANDLING
// ============================================================================

// ============================================================================
// CONTROL LOGIC
// ============================================================================

// ============================================================================
// DEVICE COMMUNICATION
// ============================================================================

// ============================================================================
// HTTP SERVER AND API
// ============================================================================

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
```

### 2.2 Variable Naming Improvements
**Mapping for Better Readability:**
- `_` → `appState` (where context allows)
- `inst` → `instanceIndex`
- `cfg` → `config`
- `chkTs` → `lastCheckTimestamp`
- `fCmdTs` → `forcedCommandTimestamp`

**Note:** Memory-critical variables (`_i`, `_j`, `_k`) will remain unchanged but be documented.

### 2.3 Configuration Schema Documentation
**File:** `docs/CONFIGURATION_SCHEMA.md`

```markdown
# Configuration Schema

## Common Settings (`_.c.c`)
| Property | Type | Description | Example |
|----------|------|-------------|---------|
| g | string | Price region (SE1-SE4) | "SE3" |
| vat | number | VAT percentage | 25 |
| day | number | Day transfer fee (c/kWh) | 4.0 |
| night | number | Night transfer fee (c/kWh) | 3.0 |

## Instance Settings (`_.c.i[n]`)
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| en | 0\|1 | Instance enabled | 0 |
| mode | 0\|1\|2 | Control mode | 0 |
| o | number[] | Output IDs | [0] |
```

## Phase 3: Development Tools (Priority: Medium)

### 3.1 Code Quality Tools
**Files to Create:**
- `.eslintrc.js` - ESLint configuration for embedded JavaScript
- `.prettierrc` - Code formatting rules
- `jsconfig.json` - VS Code IntelliSense configuration

**ESLint Configuration:**
```javascript
module.exports = {
  env: {
    es6: true,
    node: false, // Shelly environment
  },
  globals: {
    Shelly: 'readonly',
    Timer: 'readonly',
    HTTPServer: 'readonly',
    console: 'readonly',
    // ... other Shelly globals
  },
  rules: {
    'no-unused-vars': ['error', { 
      varsIgnorePattern: '^(_[ijk]|USER_|CNST)' 
    }],
    'no-global-assign': 'error',
    'prefer-const': 'warn',
  }
};
```

### 3.2 Development Environment Setup
**File:** `docs/DEVELOPMENT.md`

```markdown
# Development Environment Setup

## Prerequisites
- Node.js 16+
- VS Code (recommended)

## Setup Steps
1. Clone repository
2. Run `npm install`
3. Install VS Code extensions:
   - ESLint
   - Prettier
   - JavaScript (ES6) code snippets

## Development Workflow
1. Edit source files in `src/`
2. Run `npm run build` to create distribution files
3. Use `npm run serve` for local development
4. Deploy with `npm run upload`

## Testing
- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- Linting: `npm run lint`
```

### 3.3 Testing Framework
**Files to Create:**
- `tests/unit/` - Unit test directory
- `tests/integration/` - Integration test directory
- `tests/mocks/shelly-api.js` - Mock Shelly API for testing

**Example Test Structure:**
```javascript
// tests/unit/price-logic.test.js
describe('Price Logic', () => {
  test('isCheapestHour returns correct result', () => {
    // Mock price data
    const mockPrices = [[1640995200, 0.15], [1640998800, 0.12]];
    // Test logic
  });
});
```

## Phase 4: API and Extension Documentation (Priority: Medium)

### 4.1 Extension System Documentation
**File:** `docs/EXTENSION_SYSTEM.md`

```markdown
# Extension System Guide

## User Script Hooks

### USER_CONFIG(inst, initialized)
Called when configuration changes or logic runs.

**Parameters:**
- `inst` (number): Instance index (0-2)
- `initialized` (boolean): True if settings just loaded

**Use Cases:**
- Dynamic configuration adjustment
- External data integration

### USER_OVERRIDE(inst, cmd, callback)
Called after logic execution to override output command.

**Parameters:**
- `inst` (number): Instance index
- `cmd` (boolean): Original command from logic
- `callback` (function): Must be called with final command

**Example:**
```javascript
function USER_OVERRIDE(inst, cmd, callback) {
  if (inst === 0 && temperatureTooHigh()) {
    callback(false); // Override to OFF
  } else {
    callback(cmd); // Keep original command
  }
}
```

### USER_LOOP()
Called every 10 seconds when system is idle.

**Requirements:**
- Must set `loopRunning = false` when finished
- Use for background tasks or external API calls
```

### 4.2 HTTP API Documentation
**File:** `docs/HTTP_API.md`

```markdown
# HTTP API Reference

## Endpoints

### GET /?r=s&i={instance}
Get system state for specific instance.

**Response:**
```json
{
  "s": { "v": "4.0.0", "timeOK": 1, ... },
  "si": { "chkTs": 1640995200, "cmd": 1, ... },
  "c": { "g": "SE3", "vat": 25, ... },
  "p": [[[1640995200, 0.15], ...], [...]]
}
```

### GET /?r=c&i={instance}
Get configuration for instance or common settings.

### POST /?r=f&i={instance}&ts={timestamp}&c={command}
Force manual override for specified duration.
```

## Phase 5: Advanced Improvements (Priority: Low)

### 5.1 Error Handling Enhancement
**Improvements:**
- Structured error objects with error codes
- Better error recovery mechanisms
- Comprehensive error logging

### 5.2 Performance Monitoring
**Files to Create:**
- `docs/PERFORMANCE.md` - Memory usage guidelines
- Performance monitoring utilities

### 5.3 Internationalization Support
**Considerations:**
- Multi-language support for web interface
- Localized error messages
- Regional price API support

## Implementation Timeline

### Week 1: Foundation
- [ ] Create architecture documentation
- [ ] Add JSDoc to core functions
- [ ] Create type definitions

### Week 2: Organization
- [ ] Reorganize code with section comments
- [ ] Create configuration schema documentation
- [ ] Set up development tools

### Week 3: Testing and API
- [ ] Implement testing framework
- [ ] Document extension system
- [ ] Create HTTP API documentation

### Week 4: Polish and Advanced Features
- [ ] Enhance error handling
- [ ] Add performance monitoring
- [ ] Final documentation review

## Success Metrics

### AI Tool Compatibility
- **Code Analysis**: AI tools can understand function purposes and relationships
- **Auto-completion**: Proper IntelliSense support for all major objects
- **Refactoring**: Safe automated refactoring capabilities
- **Bug Detection**: AI can identify potential issues and suggest fixes

### Developer Experience
- **Onboarding**: New developers can understand the system in < 2 hours
- **Debugging**: Clear error messages and debugging information
- **Extension**: Easy to create and test user scripts
- **Maintenance**: Code changes are predictable and safe

### Code Quality
- **Documentation Coverage**: 90%+ of functions have JSDoc
- **Type Safety**: All major data structures have type definitions
- **Consistency**: Uniform coding patterns throughout
- **Testability**: Core logic is unit testable

## Risk Mitigation

### Memory Constraints
- Keep optimizations for resource-constrained devices
- Document why certain patterns exist
- Provide alternative implementations where possible

### Backward Compatibility
- Maintain existing API contracts
- Document breaking changes clearly
- Provide migration guides

### Build Process
- Ensure documentation doesn't affect minified output
- Test build process with all improvements
- Maintain deployment automation

## Conclusion

This improvement plan will transform the shelly-spotprice-se codebase into an AI-tool-friendly, well-documented, and maintainable project while preserving its embedded system optimizations and functionality. The phased approach ensures minimal disruption while maximizing the benefits for both human developers and AI-powered development tools.