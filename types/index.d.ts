/**
 * TypeScript definitions for shelly-spotprice-se
 * Main application types and interfaces
 * 
 * @fileoverview Core type definitions for the Shelly Spot Price SE application
 * @version 4.0.0
 */

/**
 * Main application state object (the global `_` variable)
 * Contains all system state, configuration, and runtime data
 */
export interface AppState {
  /** System state information */
  s: SystemState;
  /** Instance states array - one for each configured instance */
  si: InstanceState[];
  /** Price data arrays [today, tomorrow] - each containing [epoch, price] tuples */
  p: PriceData[][];
  /** Command history for each instance - arrays of [epoch, command, status] tuples */
  h: HistoryEntry[][];
  /** Active configuration */
  c: Configuration;
}

/**
 * System-wide state information
 */
export interface SystemState {
  /** Application version string */
  v: string;
  /** Device name from Shelly system */
  dn: string;
  /** Configuration validation status (0 = not checked, 1 = OK) */
  configOK: 0 | 1;
  /** Time synchronization status (0 = no valid time, 1 = time OK) */
  timeOK: 0 | 1;
  /** Current error count for price fetching */
  errCnt: number;
  /** Epoch timestamp of last error */
  errTs: number;
  /** Epoch timestamp when system started (first valid time) */
  upTs: number;
  /** Active timezone as URL-encoded string (e.g., "%2B02:00" for +02:00) */
  tz: string;
  /** Timezone hour offset from UTC */
  tzh: number;
  /** Count of enabled instances */
  enCnt: number;
  /** Price information for today [0] and tomorrow [1] */
  p: [PriceInfo, PriceInfo];
}

/**
 * Price information summary for a day
 */
export interface PriceInfo {
  /** Epoch timestamp when prices were last fetched */
  ts: number;
  /** Current hour price (only valid for today) */
  now: number;
  /** Lowest price of the day */
  low: number;
  /** Highest price of the day */
  high: number;
  /** Average price of the day */
  avg: number;
}

/**
 * State information for a single instance
 */
export interface InstanceState {
  /** Epoch timestamp of last logic check */
  chkTs: number;
  /** Current status code (see status codes in documentation) */
  st: number;
  /** Additional status string (for user scripts) */
  str: string;
  /** Active command (-1 = undetermined, 0 = off, 1 = on) */
  cmd: -1 | 0 | 1;
  /** Configuration validation status (0 = not checked, 1 = OK) */
  configOK: 0 | 1;
  /** Forced command expiration timestamp (0 = not forced) */
  fCmdTs: number;
  /** Forced command value (0 = off, 1 = on) */
  fCmd: 0 | 1;
}

/**
 * Complete configuration structure
 */
export interface Configuration {
  /** Common settings shared across all instances */
  c: CommonConfig;
  /** Instance-specific configurations */
  i: InstanceConfig[];
}

/**
 * Common configuration settings
 */
export interface CommonConfig {
  /** Price region/group (SE1, SE2, SE3, SE4) */
  g: 'SE1' | 'SE2' | 'SE3' | 'SE4';
  /** VAT percentage added to spot price */
  vat: number;
  /** Day transfer price (07:00-22:00) in c/kWh */
  day: number;
  /** Night transfer price (22:00-07:00) in c/kWh */
  night: number;
  /** Instance display names */
  names: string[];
}

/**
 * Instance-specific configuration
 */
export interface InstanceConfig {
  /** Instance enabled status (0 = disabled, 1 = enabled) */
  en: 0 | 1;
  /** Operating mode (0 = manual, 1 = price limit, 2 = cheapest hours) */
  mode: 0 | 1 | 2;
  /** Manual mode settings */
  m0: ManualModeConfig;
  /** Price limit mode settings */
  m1: PriceLimitConfig;
  /** Cheapest hours mode settings */
  m2: CheapestHoursConfig;
  /** Backup hours (binary flags for hours 0-23) */
  b: number;
  /** Emergency command when time is unknown (0 = off, 1 = on) */
  e: 0 | 1;
  /** Output IDs to control (array of switch/relay numbers) */
  o: number[];
  /** Forced hours (binary flags for hours 0-23) */
  f: number;
  /** Forced hours commands (binary flags - 1 = force on, 0 = force off) */
  fc: number;
  /** Invert output (0 = normal, 1 = inverted) */
  i: 0 | 1;
  /** Minutes per hour to keep output on (1-60) */
  m: number;
  /** Output control mode (0 = always set, 1 = only on change) */
  oc: 0 | 1;
}

/**
 * Manual mode configuration (mode 0)
 */
export interface ManualModeConfig {
  /** Manual command (0 = off, 1 = on) */
  c: 0 | 1;
}

/**
 * Price limit mode configuration (mode 1)
 */
export interface PriceLimitConfig {
  /** Price limit threshold in c/kWh (or "avg" for average price) */
  l: number | "avg";
}

/**
 * Cheapest hours mode configuration (mode 2)
 */
export interface CheapestHoursConfig {
  /** Period length in hours (-1 = custom range, -2 = dual custom ranges) */
  p: number;
  /** Number of cheapest hours to select in period 1 */
  c: number;
  /** Always-on price limit in c/kWh (or "avg" for average) */
  l: number | "avg";
  /** Sequential hours requirement (0 = any order, 1 = consecutive) */
  s: 0 | 1;
  /** Maximum price limit in c/kWh (or "avg" for average) */
  m: number | "avg";
  /** Custom period 1 start hour (0-23) */
  ps: number;
  /** Custom period 1 end hour (0-24) */
  pe: number;
  /** Custom period 2 start hour (0-23) */
  ps2: number;
  /** Custom period 2 end hour (0-24) */
  pe2: number;
  /** Number of cheapest hours to select in period 2 */
  c2: number;
}

/**
 * Price data tuple: [epoch_timestamp, price_in_c_per_kWh]
 */
export type PriceData = [number, number];

/**
 * History entry tuple: [epoch_timestamp, command, status_code]
 */
export type HistoryEntry = [number, number, number];

/**
 * Default instance state structure
 */
export interface DefaultInstanceState {
  chkTs: 0;
  st: 0;
  str: '';
  cmd: -1;
  configOK: 0;
  fCmdTs: 0;
  fCmd: 0;
}

/**
 * Default configuration structures
 */
export interface DefaultConfigs {
  COM: {
    g: 'SE3';
    vat: 25;
    day: 0;
    night: 0;
    names: never[];
  };
  INST: {
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
 * Constants structure
 */
export interface Constants {
  /** Number of instances */
  INST_COUNT: number;
  /** Maximum history length */
  HIST_LEN: number;
  /** Error limit before delay */
  ERR_LIMIT: number;
  /** Error delay in seconds */
  ERR_DELAY: number;
  /** Default instance state */
  DEF_INST_ST: DefaultInstanceState;
  /** Default configurations */
  DEF_CFG: DefaultConfigs;
}

/**
 * User script hook functions
 * These are optional functions that can be defined by users to extend functionality
 */
export interface UserScriptHooks {
  /**
   * Called when configuration changes or logic runs
   * @param inst Instance number (0-based)
   * @param initialized True if settings were just loaded
   */
  USER_CONFIG?(inst: number, initialized: boolean): void;

  /**
   * Called after logic execution to override output command
   * @param inst Instance number (0-based)
   * @param cmd Original command from logic (true = on, false = off)
   * @param callback Must be called with final command (true/false) or null to re-run logic
   */
  USER_OVERRIDE?(inst: number, cmd: boolean, callback: (finalCmd: boolean | null) => void): void;

  /**
   * Called every 10 seconds when system is idle
   * Must set global loopRunning = false when finished
   */
  USER_LOOP?(): void;
}

/**
 * HTTP request parameters for API endpoints
 */
export interface ApiRequestParams {
  /** Request type (s=state, c=config, h=history, r=reload, f=force) */
  r?: 's' | 'c' | 'h' | 'r' | 'f' | string;
  /** Instance number (0-based) */
  i?: string;
  /** Timestamp for force command */
  ts?: string;
  /** Command for force (0=off, 1=on) */
  c?: string;
}

/**
 * HTTP API response for state endpoint
 */
export interface StateResponse {
  /** System state */
  s: SystemState;
  /** Instance state */
  si: InstanceState;
  /** Common configuration */
  c: CommonConfig;
  /** Instance configuration */
  ci: InstanceConfig;
  /** Price data */
  p: PriceData[][];
}

/**
 * Status codes used in instance state
 */
export enum StatusCodes {
  /** Initial/unknown state */
  UNKNOWN = 0,
  /** Manual mode active */
  MANUAL = 1,
  /** Price limit mode - output on (price below limit) */
  PRICE_LIMIT_ON = 2,
  /** Price limit mode - output off (price above limit) */
  PRICE_LIMIT_OFF = 3,
  /** Cheapest hours mode - output off (not cheapest hour) */
  CHEAPEST_OFF = 4,
  /** Cheapest hours mode - output on (cheapest hour) */
  CHEAPEST_ON = 5,
  /** Always-on price limit triggered */
  ALWAYS_ON_LIMIT = 6,
  /** No price data available, using backup hours */
  NO_DATA_BACKUP = 7,
  /** No valid time available */
  NO_TIME = 8,
  /** Manual force active */
  MANUAL_FORCE = 9,
  /** Forced hours active */
  FORCED_HOURS = 10,
  /** Maximum price limit exceeded */
  MAX_PRICE_EXCEEDED = 11,
  /** User script override */
  USER_OVERRIDE = 12,
  /** Output limited by minutes setting */
  MINUTES_LIMIT = 13
}

/**
 * Global variables used to prevent stack overflow
 * These are intentionally global for memory optimization
 */
export interface GlobalVariables {
  /** Loop counter variable */
  _i: number;
  /** Loop counter variable */
  _j: number;
  /** Loop counter variable */
  _k: number;
  /** Increment variable */
  _inc: number;
  /** Count variable */
  _cnt: number;
  /** Start index variable */
  _start: number;
  /** End index variable */
  _end: number;
  /** Active commands array */
  cmd: boolean[];
  /** Previous epoch time */
  prevEpoch: number;
  /** Loop running flag */
  loopRunning: boolean;
  /** Average price calculation variable */
  _avg: number;
  /** Start index for cheapest hours */
  _startIndex: number;
  /** Sum calculation variable */
  _sum: number;
}