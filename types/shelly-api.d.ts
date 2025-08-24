/**
 * TypeScript definitions for Shelly device API
 * Covers the Shelly API calls and response structures used in shelly-spotprice-se
 * 
 * @fileoverview Shelly device API type definitions
 * @version 4.0.0
 */

/**
 * Shelly system component status
 */
export interface ShellySystemStatus {
  /** Unix timestamp from system (null if not synced) */
  unixtime: number | null;
  /** System uptime in seconds */
  uptime?: number;
  /** RAM usage information */
  ram_size?: number;
  ram_free?: number;
  /** Filesystem information */
  fs_size?: number;
  fs_free?: number;
  /** Configuration revision */
  cfg_rev?: number;
  /** Available updates */
  available_updates?: {
    stable?: { version: string };
    beta?: { version: string };
  };
}

/**
 * Shelly system component configuration
 */
export interface ShellySystemConfig {
  /** Device configuration */
  device: {
    /** Device name */
    name: string;
    /** Device MAC address */
    mac?: string;
    /** Firmware ID */
    fw_id?: string;
    /** Profile name */
    profile?: string;
  };
  /** Location information */
  location?: {
    tz?: string;
    lat?: number;
    lon?: number;
  };
  /** Debug settings */
  debug?: {
    level?: number;
    file_level?: number;
  };
}

/**
 * WiFi component status
 */
export interface ShellyWiFiStatus {
  /** Station IP address (when connected as client) */
  sta_ip: string | null;
  /** Station status */
  status?: string;
  /** Signal strength */
  rssi?: number;
  /** Access point IP (when acting as AP) */
  ap_ip?: string;
  /** Connected SSID */
  ssid?: string;
}

/**
 * Switch/Relay component status
 */
export interface ShellySwitchStatus {
  /** Switch ID */
  id: number;
  /** Current state (true = on, false = off) */
  output: boolean;
  /** Power consumption in watts */
  apower?: number;
  /** Voltage in volts */
  voltage?: number;
  /** Current in amperes */
  current?: number;
  /** Energy counter in watt-hours */
  aenergy?: {
    total: number;
    by_minute: number[];
    minute_ts: number;
  };
  /** Temperature information */
  temperature?: {
    tC: number;
    tF: number;
  };
}

/**
 * Switch/Relay component configuration
 */
export interface ShellySwitchConfig {
  /** Switch ID */
  id: number;
  /** Switch name */
  name?: string;
  /** Initial state on power on */
  initial_state?: 'off' | 'on' | 'restore_last' | 'match_input';
  /** Auto-off timer in seconds */
  auto_off?: boolean;
  auto_off_delay?: number;
  /** Auto-on timer in seconds */
  auto_on?: boolean;
  auto_on_delay?: number;
  /** Input mode */
  input_mode?: 'momentary' | 'follow' | 'flip' | 'detached';
}

/**
 * Timer component for scheduling
 */
export interface ShellyTimer {
  /** Set a timer */
  set(delay_ms: number, repeat: boolean, callback: (...args: any[]) => void, ...args: any[]): number;
  /** Clear a timer */
  clear(timer_id: number): boolean;
}

/**
 * HTTP client for making requests
 */
export interface ShellyHTTPClient {
  /** Make HTTP GET request */
  GET(request: HTTPRequest, callback: HTTPCallback): void;
  /** Make HTTP POST request */
  POST(request: HTTPRequest, callback: HTTPCallback): void;
}

/**
 * HTTP request configuration
 */
export interface HTTPRequest {
  /** Request URL */
  url: string;
  /** Request timeout in seconds */
  timeout?: number;
  /** SSL certificate validation (* = skip validation) */
  ssl_ca?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (for POST) */
  body?: string;
}

/**
 * HTTP response object
 */
export interface HTTPResponse {
  /** HTTP status code */
  code: number;
  /** Response body */
  body?: string;
  /** Response headers */
  headers?: Record<string, string>;
  /** Status message */
  message?: string;
}

/**
 * HTTP request callback function
 */
export type HTTPCallback = (
  response: HTTPResponse | null,
  error_code: number,
  error_message: string
) => void;

/**
 * KVS (Key-Value Store) operations
 */
export interface ShellyKVS {
  /** Get value by key */
  Get: {
    (params: { key: string }, callback: KVSGetCallback): void;
  };
  /** Set key-value pair */
  Set: {
    (params: { key: string; value: string }, callback: KVSSetCallback): void;
  };
  /** Delete key */
  Delete: {
    (params: { key: string }, callback: KVSDeleteCallback): void;
  };
  /** List all keys */
  List: {
    (params: {}, callback: KVSListCallback): void;
  };
}

/**
 * KVS Get operation response
 */
export interface KVSGetResponse {
  /** Retrieved value */
  value: string;
  /** Entry timestamp */
  etag?: string;
}

/**
 * KVS operation callbacks
 */
export type KVSGetCallback = (
  response: KVSGetResponse | null,
  error_code: number,
  error_message: string
) => void;

export type KVSSetCallback = (
  response: any,
  error_code: number,
  error_message: string,
  user_callback?: (success: boolean) => void
) => void;

export type KVSDeleteCallback = (
  response: any,
  error_code: number,
  error_message: string
) => void;

export type KVSListCallback = (
  response: { keys: string[] } | null,
  error_code: number,
  error_message: string
) => void;

/**
 * HTTP Server for handling incoming requests
 */
export interface ShellyHTTPServer {
  /** Register endpoint handler */
  registerEndpoint(path: string, handler: HTTPRequestHandler): void;
  /** Unregister endpoint */
  unregisterEndpoint(path: string): void;
}

/**
 * HTTP request handler function
 */
export type HTTPRequestHandler = (
  request: IncomingHTTPRequest,
  response: OutgoingHTTPResponse
) => void;

/**
 * Incoming HTTP request
 */
export interface IncomingHTTPRequest {
  /** Request method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Request URL path */
  url: string;
  /** Query string parameters */
  query: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body */
  body?: string;
}

/**
 * Outgoing HTTP response
 */
export interface OutgoingHTTPResponse {
  /** HTTP status code */
  code: number;
  /** Response headers */
  headers: string[][];
  /** Response body */
  body: string;
  /** Send the response */
  send(): void;
}

/**
 * Main Shelly API object
 */
export interface ShellyAPI {
  /** Make RPC call to Shelly device */
  call<T = any>(
    method: string,
    params: any,
    callback: (result: T, error_code: number, error_message: string, user_callback?: any) => void,
    user_callback?: any
  ): void;

  /** Get component status */
  getComponentStatus(component: 'sys'): ShellySystemStatus;
  getComponentStatus(component: 'wifi'): ShellyWiFiStatus;
  getComponentStatus(component: string): any;

  /** Get component configuration */
  getComponentConfig(component: 'sys'): ShellySystemConfig;
  getComponentConfig(component: string): any;

  /** Get current script ID */
  getCurrentScriptId(): number;

  /** Emit event */
  emit(event: string, data?: any): void;

  /** Add event listener */
  addEventHandler(event: string, handler: (data: any) => void): void;

  /** Remove event listener */
  removeEventHandler(event: string, handler: (data: any) => void): void;
}

/**
 * Switch control parameters for Switch.Set call
 */
export interface SwitchSetParams {
  /** Switch ID */
  id: number;
  /** Desired state */
  on: boolean;
  /** Toggle instead of set */
  toggle?: boolean;
}

/**
 * Switch.Set response
 */
export interface SwitchSetResponse {
  /** Was the operation successful */
  was_on: boolean;
}

/**
 * Global Shelly objects available in the runtime
 */
declare global {
  /** Main Shelly API */
  const Shelly: ShellyAPI;
  /** Timer utilities */
  const Timer: ShellyTimer;
  /** HTTP Server */
  const HTTPServer: ShellyHTTPServer;
  /** Console for logging */
  const console: {
    log(message: string): void;
    error(message: string): void;
    warn(message: string): void;
  };
  /** Base64 decode function */
  function atob(encoded: string): string;
  /** Base64 encode function */
  function btoa(data: string): string;
  /** JSON utilities */
  const JSON: {
    parse(text: string): any;
    stringify(value: any): string;
  };
}

/**
 * Common RPC method names used in the application
 */
export type ShellyRPCMethods = 
  | 'Switch.Set'
  | 'Switch.GetStatus'
  | 'Switch.GetConfig'
  | 'Sys.GetStatus'
  | 'Sys.GetConfig'
  | 'WiFi.GetStatus'
  | 'KVS.Get'
  | 'KVS.Set'
  | 'KVS.Delete'
  | 'KVS.List'
  | 'HTTP.GET'
  | 'HTTP.POST';

/**
 * Error codes commonly returned by Shelly API
 */
export enum ShellyErrorCodes {
  /** Success */
  SUCCESS = 0,
  /** Invalid argument */
  INVALID_ARGUMENT = -1,
  /** Out of memory */
  OUT_OF_MEMORY = -2,
  /** Not found */
  NOT_FOUND = -3,
  /** Timeout */
  TIMEOUT = -4,
  /** Not authorized */
  NOT_AUTHORIZED = -5,
  /** Internal error */
  INTERNAL_ERROR = -6
}