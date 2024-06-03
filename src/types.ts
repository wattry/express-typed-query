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

export type DeepObject = boolean;
export type Logger = any;
export type Dates = boolean;

export interface Logging {
  logger?: Logger,
  level?: string
}

export interface Options {
  deepObject?: DeepObject;
  logging?: Logging;
  dates?: Dates;
}