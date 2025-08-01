/**
 * TypeScript definitions for configuration schemas
 * Detailed configuration object types with validation constraints and defaults
 * 
 * @fileoverview Configuration schema definitions for shelly-spotprice-se
 * @version 4.0.0
 */

/**
 * Swedish electricity price regions
 */
export type SwedishPriceRegion = 'SE1' | 'SE2' | 'SE3' | 'SE4';

/**
 * Operating modes for instances
 */
export type OperatingMode = 0 | 1 | 2;

/**
 * Binary state values
 */
export type BinaryState = 0 | 1;

/**
 * Price reference types (numeric value or average)
 */
export type PriceReference = number | 'avg';

/**
 * Complete configuration schema with validation constraints
 */
export interface ConfigurationSchema {
  /** Common settings schema */
  common: CommonConfigSchema;
  /** Instance settings schema */
  instance: InstanceConfigSchema;
}

/**
 * Common configuration schema with validation rules
 */
export interface CommonConfigSchema {
  /** Price region/group */
  g: {
    type: 'string';
    enum: SwedishPriceRegion[];
    default: 'SE3';
    description: 'Swedish electricity price region (SE1=North, SE2=Central, SE3=South, SE4=Malmö)';
  };
  /** VAT percentage */
  vat: {
    type: 'number';
    minimum: 0;
    maximum: 100;
    default: 25;
    description: 'VAT percentage added to spot price';
  };
  /** Day transfer price */
  day: {
    type: 'number';
    minimum: 0;
    maximum: 1000;
    default: 0;
    description: 'Day transfer price (07:00-22:00) in c/kWh';
  };
  /** Night transfer price */
  night: {
    type: 'number';
    minimum: 0;
    maximum: 1000;
    default: 0;
    description: 'Night transfer price (22:00-07:00) in c/kWh';
  };
  /** Instance names */
  names: {
    type: 'array';
    items: { type: 'string'; maxLength: 50 };
    default: [];
    description: 'Display names for instances';
  };
}

/**
 * Instance configuration schema with validation rules
 */
export interface InstanceConfigSchema {
  /** Instance enabled */
  en: {
    type: 'number';
    enum: [0, 1];
    default: 0;
    description: 'Instance enabled status (0=disabled, 1=enabled)';
  };
  /** Operating mode */
  mode: {
    type: 'number';
    enum: [0, 1, 2];
    default: 0;
    description: 'Operating mode (0=manual, 1=price_limit, 2=cheapest_hours)';
  };
  /** Manual mode settings */
  m0: ManualModeSchema;
  /** Price limit mode settings */
  m1: PriceLimitModeSchema;
  /** Cheapest hours mode settings */
  m2: CheapestHoursModeSchema;
  /** Backup hours */
  b: {
    type: 'number';
    minimum: 0;
    maximum: 0b111111111111111111111111; // 24 bits
    default: 0;
    description: 'Backup hours when no price data (binary flags for hours 0-23)';
  };
  /** Emergency command */
  e: {
    type: 'number';
    enum: [0, 1];
    default: 0;
    description: 'Emergency command when time is unknown (0=off, 1=on)';
  };
  /** Output IDs */
  o: {
    type: 'array';
    items: { type: 'number'; minimum: 0; maximum: 15 };
    minItems: 1;
    maxItems: 8;
    default: [0];
    description: 'Output/relay IDs to control';
  };
  /** Forced hours */
  f: {
    type: 'number';
    minimum: 0;
    maximum: 0b111111111111111111111111; // 24 bits
    default: 0;
    description: 'Forced hours override (binary flags for hours 0-23)';
  };
  /** Forced hours commands */
  fc: {
    type: 'number';
    minimum: 0;
    maximum: 0b111111111111111111111111; // 24 bits
    default: 0;
    description: 'Forced hours commands (binary flags - 1=force_on, 0=force_off)';
  };
  /** Invert output */
  i: {
    type: 'number';
    enum: [0, 1];
    default: 0;
    description: 'Invert output logic (0=normal, 1=inverted)';
  };
  /** Minutes per hour */
  m: {
    type: 'number';
    minimum: 1;
    maximum: 60;
    default: 60;
    description: 'Minutes per hour to keep output active (1-60)';
  };
  /** Output control mode */
  oc: {
    type: 'number';
    enum: [0, 1];
    default: 0;
    description: 'Output control mode (0=always_set, 1=only_on_change)';
  };
}

/**
 * Manual mode configuration schema
 */
export interface ManualModeSchema {
  /** Manual command */
  c: {
    type: 'number';
    enum: [0, 1];
    default: 0;
    description: 'Manual output command (0=off, 1=on)';
  };
}

/**
 * Price limit mode configuration schema
 */
export interface PriceLimitModeSchema {
  /** Price limit */
  l: {
    type: 'number' | 'string';
    minimum: -1000;
    maximum: 1000;
    enum_string: ['avg'];
    default: 0;
    description: 'Price limit threshold in c/kWh (or "avg" for average price)';
  };
}

/**
 * Cheapest hours mode configuration schema
 */
export interface CheapestHoursModeSchema {
  /** Period length */
  p: {
    type: 'number';
    minimum: -2;
    maximum: 48;
    default: 24;
    description: 'Period length in hours (-1=custom, -2=dual_custom, >0=rolling_period)';
  };
  /** Cheapest hours count */
  c: {
    type: 'number';
    minimum: 0;
    maximum: 24;
    default: 0;
    description: 'Number of cheapest hours to select in period 1';
  };
  /** Always-on price limit */
  l: {
    type: 'number' | 'string';
    minimum: -1000;
    maximum: 1000;
    enum_string: ['avg'];
    default: -999;
    description: 'Always-on price limit in c/kWh (or "avg" for average)';
  };
  /** Sequential hours */
  s: {
    type: 'number';
    enum: [0, 1];
    default: 0;
    description: 'Sequential hours requirement (0=any_order, 1=consecutive)';
  };
  /** Maximum price limit */
  m: {
    type: 'number' | 'string';
    minimum: -1000;
    maximum: 1000;
    enum_string: ['avg'];
    default: 999;
    description: 'Maximum price limit in c/kWh (or "avg" for average)';
  };
  /** Custom period 1 start */
  ps: {
    type: 'number';
    minimum: 0;
    maximum: 23;
    default: 0;
    description: 'Custom period 1 start hour (0-23)';
  };
  /** Custom period 1 end */
  pe: {
    type: 'number';
    minimum: 1;
    maximum: 24;
    default: 23;
    description: 'Custom period 1 end hour (1-24)';
  };
  /** Custom period 2 start */
  ps2: {
    type: 'number';
    minimum: 0;
    maximum: 23;
    default: 0;
    description: 'Custom period 2 start hour (0-23)';
  };
  /** Custom period 2 end */
  pe2: {
    type: 'number';
    minimum: 1;
    maximum: 24;
    default: 23;
    description: 'Custom period 2 end hour (1-24)';
  };
  /** Cheapest hours count for period 2 */
  c2: {
    type: 'number';
    minimum: 0;
    maximum: 24;
    default: 0;
    description: 'Number of cheapest hours to select in period 2';
  };
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Is configuration valid */
  valid: boolean;
  /** Validation errors */
  errors: ConfigValidationError[];
  /** Validation warnings */
  warnings: ConfigValidationWarning[];
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  /** Configuration path (e.g., "instance.0.m2.c") */
  path: string;
  /** Error message */
  message: string;
  /** Current value */
  value: any;
  /** Expected constraint */
  constraint: string;
}

/**
 * Configuration validation warning
 */
export interface ConfigValidationWarning {
  /** Configuration path */
  path: string;
  /** Warning message */
  message: string;
  /** Current value */
  value: any;
  /** Suggested value */
  suggestion?: any;
}

/**
 * Default configuration values
 */
export interface DefaultConfigValues {
  /** Default common configuration */
  common: {
    g: 'SE3';
    vat: 25;
    day: 0;
    night: 0;
    names: string[];
  };
  /** Default instance configuration */
  instance: {
    en: 0;
    mode: 0;
    m0: { c: 0 };
    m1: { l: 0 };
    m2: {
      p: 24;
      c: 0;
      l: -999;
      s: 0;
      m: 999;
      ps: 0;
      pe: 23;
      ps2: 0;
      pe2: 23;
      c2: 0;
    };
    b: 0;
    e: 0;
    o: [0];
    f: 0;
    fc: 0;
    i: 0;
    m: 60;
    oc: 0;
  };
}

/**
 * Configuration migration information
 */
export interface ConfigMigration {
  /** Source version */
  from: string;
  /** Target version */
  to: string;
  /** Migration function */
  migrate: (oldConfig: any) => any;
  /** Migration description */
  description: string;
}

/**
 * Configuration constraints for validation
 */
export interface ConfigConstraints {
  /** Maximum number of instances */
  MAX_INSTANCES: 10;
  /** Maximum history length */
  MAX_HISTORY_LENGTH: 100;
  /** Maximum instance name length */
  MAX_NAME_LENGTH: 50;
  /** Maximum number of outputs per instance */
  MAX_OUTPUTS_PER_INSTANCE: 8;
  /** Price value limits */
  MIN_PRICE: -1000;
  MAX_PRICE: 1000;
  /** Hour constraints */
  MIN_HOUR: 0;
  MAX_HOUR: 23;
  /** VAT percentage limits */
  MIN_VAT: 0;
  MAX_VAT: 100;
}

/**
 * Configuration utility functions
 */
export interface ConfigUtils {
  /** Validate configuration object */
  validate(config: any, schema: ConfigurationSchema): ConfigValidationResult;
  /** Apply default values to configuration */
  applyDefaults(config: any): any;
  /** Migrate configuration from old version */
  migrate(config: any, fromVersion: string, toVersion: string): any;
  /** Get configuration value by path */
  getValue(config: any, path: string): any;
  /** Set configuration value by path */
  setValue(config: any, path: string, value: any): void;
}