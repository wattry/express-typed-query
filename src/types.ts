import { IParseOptions, BooleanOptional } from 'qs';

export const expressQsStringParser: string = 'query parser';

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


type Primitive = string | number | boolean | Date | null | undefined | string[] | number[] | boolean[] | Date[] | null[] | undefined[];

export interface AnyObject {
  [s: string]: Value | ValueArray;
}

export type Value = Primitive | AnyObject;
export type ValueArray = string[] | number[] | boolean[] | Date[] | null[] | Primitive[] | AnyObject[];
export type LogArg = Value;
export type LogArgs = Value[];

export type Logger = {
  error: (...args: LogArgs) => void;
  warn: (...args: LogArgs) => void;
  info: (...args: LogArgs) => void;
  debug: (...args: LogArgs) => void;
  trace: (...args: LogArgs) => void;
};
export type Dates = boolean;
export type Tag = boolean;
export type LogFunction = (level: string) => string;
export type LogString = string | LogFunction;
export type HailMary = boolean;
export type QsParseOptions = IParseOptions<BooleanOptional>;

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
  qsOptions?: QsParseOptions;
}
