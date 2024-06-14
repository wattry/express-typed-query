export const setString: string = 'query parser';

export enum Levels {
  error,
  warn,
  info,
  debug,
  trace
}

export const LevelMap: Record<string, Levels> = {
  error: Levels.error,
  warn: Levels.warn,
  info: Levels.info,
  debug: Levels.debug,
  trace: Levels.trace
};

export const LevelStringMap: Record<number, string> = {
  [Levels.error]: 'error',
  [Levels.warn]: 'warn',
  [Levels.info]: 'info',
  [Levels.debug]: 'debug',
  [Levels.trace]: 'trace'
};

export type Logger = any;
export type Dates = boolean;
export type Tag = boolean;
export type LogFunction = (level: string) => string;
export type LogString = string | LogFunction;
export type HailMary = boolean;

export interface Logging {
  logger?: Logger;
  level?: string;
  tag?: boolean;
  logString?: LogString;
}

export interface Options {
  logging?: Logging;
  dates?: Dates;
  hailMary?: HailMary;
}