module.exports = {
  env: {
    es6: true,
    node: false, // Shelly environment, not Node.js
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'script', // Not module, as Shelly uses script context
  },
  globals: {
    // Shelly device globals
    Shelly: 'readonly',
    Timer: 'readonly',
    HTTPServer: 'readonly',
    console: 'readonly',
    JSON: 'readonly',
    
    // Memory optimization globals (documented in AI improvement plan)
    _i: 'writable',
    _j: 'writable',
    _k: 'writable',
    
    // Application state and configuration globals
    _: 'writable',
    loopRunning: 'writable',
    
    // User extension hooks
    USER_CONFIG: 'readonly',
    USER_OVERRIDE: 'readonly',
    USER_LOOP: 'readonly',
    
    // Constants that may be defined globally
    CNST_VER: 'readonly',
    CNST_PRICE_REGIONS: 'readonly',
    CNST_MODES: 'readonly',
  },
  rules: {
    // Allow memory optimization variables and user extension patterns
    'no-unused-vars': ['error', { 
      varsIgnorePattern: '^(_[ijk]|USER_|CNST_)',
      argsIgnorePattern: '^_'
    }],
    
    // Prevent accidental global assignments
    'no-global-assign': 'error',
    'no-implicit-globals': 'error',
    
    // Code quality rules suitable for embedded environment
    'prefer-const': 'warn',
    'no-var': 'warn',
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    
    // Allow necessary patterns for embedded JavaScript
    'no-console': 'off', // Console is used for logging in Shelly
    'no-undef': 'error',
    'no-unused-expressions': ['error', { 
      allowShortCircuit: true, 
      allowTernary: true 
    }],
    
    // Relaxed rules for memory-optimized code
    'prefer-arrow-callback': 'off', // Function expressions may be more memory efficient
    'object-shorthand': 'off', // May not be supported in all Shelly firmware versions
    
    // Formatting rules (handled by Prettier)
    'indent': 'off',
    'quotes': 'off',
    'semi': 'off',
    'comma-dangle': 'off',
  },
  
  // Override rules for test files
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        node: true,
        jest: true,
      },
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
      rules: {
        'no-undef': 'error',
      }
    }
  ]
};