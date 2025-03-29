export enum Severity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export interface Location {
  file: string;
  line: number;
  column: number;
  offset: number;
}

export interface Range {
  start: Location;
  end: Location;
}

export interface CommonOptions {
  cwd?: string;
  configPath?: string;
  fix?: boolean;
  cache?: boolean;
}

export interface FilePatterns {
  include?: string[];
  exclude?: string[];
}

export type Position = {
  line: number;
  column: number;
  offset: number;
};

export enum FixType {
  Replace = 'replace',
  Insert = 'insert',
  Remove = 'remove',
}

export interface Result {
  success: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fixableCount: number;
  fixedCount: number;
}
