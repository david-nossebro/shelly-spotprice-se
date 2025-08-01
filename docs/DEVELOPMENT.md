# Development Environment Setup

This document provides comprehensive instructions for setting up and working with the shelly-spotprice-se development environment.

## Prerequisites

- **Node.js 16+** - Required for build tools and testing framework
- **VS Code** (recommended) - For optimal development experience with IntelliSense
- **Git** - For version control

## Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd shelly-spotprice-se
npm install
```

### 2. Install Recommended VS Code Extensions

For the best development experience, install these VS Code extensions:

- **ESLint** (`dbaeumer.vscode-eslint`) - Code linting and error detection
- **Prettier** (`esbenp.prettier-vscode`) - Code formatting
- **JavaScript (ES6) code snippets** (`xabikos.JavaScriptSnippets`) - Code snippets
- **Jest** (`Orta.vscode-jest`) - Test runner integration
- **GitLens** (`eamodio.gitlens`) - Enhanced Git capabilities

### 3. Configure VS Code Settings

Add these settings to your VS Code workspace settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript"],
  "eslint.format.enable": true,
  "jest.autoRun": "watch"
}
```

## Development Workflow

### Project Structure

```
shelly-spotprice-se/
├── src/                    # Source code
│   ├── shelly-spotprice-se.js  # Main application script
│   ├── statics/           # Web interface files
│   └── after-build/       # Generated build variants
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── mocks/            # Mock implementations
├── types/                # TypeScript definitions
├── docs/                 # Documentation
└── dist/                 # Build output (generated)
```

### Core Development Commands

#### Building and Testing

```bash
# Run full development cycle (lint + test + build)
npm run dev

# Build the application
npm run build

# Run tests
npm test                  # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

#### Code Quality

```bash
# Lint code
npm run lint             # Check for linting errors
npm run lint:fix         # Fix auto-fixable linting errors

# Format code
npm run format           # Format all code files
npm run format:check     # Check if code is properly formatted

# Pre-commit checks
npm run precommit        # Run all quality checks
```

#### Development Server

```bash
# Serve static files for local development
npm run serve            # Serves on http://localhost:3000

# Debug mode
npm run debug            # Run builder in debug mode
```

#### Deployment

```bash
# Build and upload to Shelly device
npm start                # Equivalent to: npm run build && npm run upload

# Upload only (without building)
npm run upload
```

## Development Guidelines

### Code Style

The project uses ESLint and Prettier for consistent code formatting:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Always required
- **Line length**: 80 characters maximum
- **Trailing commas**: ES5 style (objects and arrays)

### Memory Optimization Patterns

This project is optimized for Shelly devices with limited memory:

#### Global Loop Variables
```javascript
// Use global variables _i, _j, _k for loops to prevent stack overflow
for (_i = 0; _i < array.length; _i++) {
  // Loop body
}
```

#### Abbreviated Variable Names
```javascript
// Memory-critical variables use short names
let cfg = _.c;        // config
let inst = 0;         // instance
let chkTs = Date.now(); // checkTimestamp
```

#### State Management
```javascript
// Central state object minimizes memory fragmentation
let _ = {
  s: {},    // system state
  si: [],   // instance states
  c: {},    // configuration
  p: [],    // price data
  h: []     // history
};
```

### Testing Guidelines

#### Unit Tests
- Test individual functions in isolation
- Use mocks for external dependencies (Shelly API, HTTP requests)
- Focus on core logic functions: `logic()`, `isCheapestHour()`, `getPrices()`

#### Integration Tests
- Test complete workflows
- Use real data structures but mocked external APIs
- Verify state transitions and side effects

#### Test File Naming
```
tests/
├── unit/
│   ├── price-logic.test.js
│   ├── config-validation.test.js
│   └── utility-functions.test.js
└── integration/
    ├── full-workflow.test.js
    └── api-endpoints.test.js
```

### Extension Development

#### User Script Hooks

The system provides three extension points:

```javascript
// Called when configuration changes
function USER_CONFIG(inst, initialized) {
  // Custom configuration logic
}

// Called to override output commands
function USER_OVERRIDE(inst, cmd, callback) {
  // Custom logic override
  callback(finalCommand);
}

// Called every 10 seconds during idle periods
function USER_LOOP() {
  // Background tasks
  loopRunning = false; // Must set when finished
}
```

#### Extension Testing
```javascript
// tests/unit/extensions.test.js
describe('User Extensions', () => {
  test('USER_OVERRIDE modifies command correctly', () => {
    const mockCallback = jest.fn();
    USER_OVERRIDE(0, true, mockCallback);
    expect(mockCallback).toHaveBeenCalledWith(false);
  });
});
```

## Build Process

### Build Pipeline

1. **Source Processing**: Main script is processed by `shelly-builder.js`
2. **Minification**: Code is minified using UglifyJS
3. **HTML Processing**: Static files are minified using html-minifier
4. **Variant Generation**: `after-build.js` creates specialized versions
5. **Output**: Generated files are placed in `src/after-build/`

### Build Variants

The build process creates several specialized versions:

- `shelly-spotprice-se-1-instance-no-history.js` - Single instance, no history
- `shelly-spotprice-se-addon-temp.js` - Temperature sensor integration
- `shelly-spotprice-se-config.js` - Configuration-only version

### Build Configuration

Build settings are controlled by:
- `shelly-builder.js` - Main build script
- `after-build.js` - Post-build processing
- `shelly-library.json` - Library metadata

## Debugging

### Local Development

1. **Static File Testing**: Use `npm run serve` to test web interface locally
2. **Logic Testing**: Use unit tests to verify core functionality
3. **Build Verification**: Check generated files in `src/after-build/`

### Device Debugging

1. **Console Logging**: Use `console.log()` for runtime debugging
2. **State Inspection**: Access `_` object to examine application state
3. **HTTP Endpoints**: Use API endpoints to inspect system state

### Common Issues

#### Memory Errors
- **Symptom**: Device restarts or becomes unresponsive
- **Solution**: Check for memory leaks, use global loop variables

#### Build Failures
- **Symptom**: Build process fails or generates invalid code
- **Solution**: Check ESLint errors, verify syntax

#### Test Failures
- **Symptom**: Tests fail unexpectedly
- **Solution**: Update mocks, check for async timing issues

## Performance Considerations

### Memory Usage
- Monitor memory usage during development
- Use abbreviated variable names in production code
- Minimize object creation in loops

### Execution Speed
- Optimize critical paths (price fetching, logic execution)
- Use efficient algorithms for time-sensitive operations
- Cache frequently accessed data

### Network Efficiency
- Minimize HTTP requests
- Implement proper error handling for network failures
- Use appropriate timeouts

## Deployment

### Pre-deployment Checklist

- [ ] All tests pass (`npm test`)
- [ ] Code is properly linted (`npm run lint`)
- [ ] Code is formatted (`npm run format:check`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Generated files are valid JavaScript

### Deployment Process

1. **Build**: `npm run build`
2. **Verify**: Check generated files in `src/after-build/`
3. **Upload**: `npm run upload` (requires Shelly device configuration)
4. **Test**: Verify functionality on target device

### Rollback Procedure

1. Keep previous working version as backup
2. Use Shelly web interface to restore previous script
3. Verify system functionality after rollback

## Contributing

### Code Review Guidelines

- Ensure all tests pass
- Verify memory optimization patterns are maintained
- Check documentation is updated
- Validate build process works correctly

### Pull Request Process

1. Create feature branch from main
2. Implement changes with tests
3. Run full development cycle (`npm run dev`)
4. Submit pull request with description
5. Address review feedback

## Troubleshooting

### Common Development Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| ESLint errors | Build fails | Run `npm run lint:fix` |
| Test failures | CI fails | Check mocks and test data |
| Build errors | Invalid output | Check syntax and dependencies |
| Memory issues | Device crashes | Review memory optimization patterns |

### Getting Help

- Check existing documentation in `docs/`
- Review test files for usage examples
- Examine generated code in `src/after-build/`
- Use VS Code IntelliSense for API guidance

## Additional Resources

- [Shelly API Documentation](https://shelly-api-docs.shelly.cloud/)
- [ESLint Configuration Guide](https://eslint.org/docs/user-guide/configuring/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Prettier Code Formatter](https://prettier.io/docs/en/configuration.html)