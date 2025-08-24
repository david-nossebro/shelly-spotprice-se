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
    module: 'writable',

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

    // Additional globals used in the application
    INSTANCE_COUNT: 'readonly',
    HIST_LEN: 'readonly',
    atob: 'readonly',
  },
  rules: {
    // Allow memory optimization variables and user extension patterns
    'no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^(_[ijk]|USER_|CNST_)',
        argsIgnorePattern: '^_',
      },
    ],

    // Prevent accidental global assignments
    'no-global-assign': 'error',
    'no-implicit-globals': 'error',

    // Code quality rules suitable for embedded environment
    'prefer-const': 'warn',
    'no-var': 'warn',
    eqeqeq: ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',

    // Allow necessary patterns for embedded JavaScript
    'no-console': 'off', // Console is used for logging in Shelly
    'no-undef': 'error',
    'no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
      },
    ],

    // Relaxed rules for memory-optimized code
    'prefer-arrow-callback': 'off', // Function expressions may be more memory efficient
    'object-shorthand': 'off', // May not be supported in all Shelly firmware versions

    // Formatting rules (handled by Prettier)
    indent: 'off',
    quotes: 'off',
    semi: 'off',
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
      },
    },
    {
      files: ['after-build.js', 'shelly-builder.js'],
      env: {
        node: true,
      },
      globals: {
        require: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
      rules: {
        'no-undef': 'off',
      },
    },
    {
      files: ['src/after-build/**/*.js'],
      rules: {
        'no-implicit-globals': 'off',
        'no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^(_[ijk]|USER_|CNST_|INSTANCE_COUNT|HIST_LEN)',
            argsIgnorePattern: '^_',
          },
        ],
      },
    },
    {
      files: ['src/statics/**/*.js'],
      env: {
        browser: true,
        es6: true,
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        clearTimeout: 'readonly',
        setTimeout: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        prompt: 'readonly',
        eval: 'readonly',
        DEV: 'readonly',
        URL: 'writable',
        URLS: 'writable',
        DBG: 'writable',
        me: 'writable',
        updateLoop: 'readonly',
        reqJs: 'readonly',
        getData: 'readonly',
        doc: 'readonly',
        qs: 'readonly',
        STATE_STR: 'readonly',
        MODE_STR: 'readonly',
        formatDateTime: 'readonly',
        formatTime: 'readonly',
        CBS: 'readonly',
      },
      rules: {
        'no-undef': 'off',
        'no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^(_[ijk]|USER_|CNST_|format)',
            argsIgnorePattern: '^_',
          },
        ],
        'no-eval': 'off', // Allow eval in browser context
      },
    },
  ],
};
