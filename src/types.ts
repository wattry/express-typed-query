import { IParseOptions, BooleanOptional } from 'qs';
import { Application, Request, Response, NextFunction } from 'express';

export const expressQsStringParser: string = 'query parser';

export enum ELevels {
  error,
  warn,
  info,
  debug,
  trace
}

export const LevelMap: Record<string, ELevels> = {
  error: ELevels.error,
  warn: ELevels.warn,
  info: ELevels.info,
  debug: ELevels.debug,
  trace: ELevels.trace
};

export const LevelStringMap: Record<number, string> = {
  [ELevels.error]: 'error',
  [ELevels.warn]: 'warn',
  [ELevels.info]: 'info',
  [ELevels.debug]: 'debug',
  [ELevels.trace]: 'trace'
};

export type TPrimitive = string | number | boolean | Date | null | undefined | string[] | number[] | boolean[] | Date[] | null[] | undefined[];

export interface IAnyObject {
  [s: string]: TValue | TValueArray;
}

export type TValue = TPrimitive | IAnyObject;
export type TValueArray = string[] | number[] | boolean[] | Date[] | null[] | TPrimitive[] | IAnyObject[];
export type TLogArg = TValue;
export type TLogArgs = TValue[];

export interface ILogger {
  error: (...args: TLogArgs) => void;
  warn: (...args: TLogArgs) => void;
  info: (...args: TLogArgs) => void;
  debug: (...args: TLogArgs) => void;
  trace: (...args: TLogArgs) => void;
};

export type TDates = boolean;
export type TTag = boolean;
export type TLogFunction = (level: string) => string;
export type TLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type TLogString = string | TLogFunction;

export type THailMary = boolean;
export type TGlobal = boolean;
export type TQsParseOptions = IParseOptions<BooleanOptional>;
export type TDisable = string[];

export type TMiddleware = (request: Request, response: Response, next: NextFunction) => void;
export type TMiddlewares = TMiddleware[];

export interface ILogging {
  logger?: ILogger;
  level?: TLevel;
  tag?: TTag;
  logString?: TLogString;
}

export type TMiddlewareOption = TMiddlewares | TMiddleware | null;

export interface IOptions {
  global?: TGlobal;
  logging?: ILogging;
  dates?: TDates;
  hailMary?: THailMary;
  disable?: TDisable;
  qsOptions?: TQsParseOptions;
  middleware?: TMiddlewareOption;
}

export type TDisableMap = Map<string, boolean>;

type IsNumber = (value: TValue) => boolean;
type IsString = (value: TValue) => boolean;
type IsBoolean = (value: TValue) => boolean;
type IsDate = (value: TValue) => boolean;
type IsFunction = (value: TValue) => boolean;
type IsArray = (value: TValue) => boolean;
type IsObject = (value: TValue) => boolean;
type IsJson = (value: TValue) => boolean;

export interface ICheck {
  objectRegex: RegExp;
  arrayRegex: RegExp;
  quoteMatcherRegex: RegExp;
  quoteReplacerRegex: RegExp;
  isNumber: IsNumber;
  isString: IsString;
  isBoolean: IsBoolean;
  isDate: IsDate;
  isFunction: IsFunction;
  isArray: IsArray;
  isObject: IsObject;
  isJson: IsJson;
}

export type TMethod = string;
export type TPath = string;
export type TMethodDisable = Map<TMethod, TDisable> | undefined;
export type TPathDisable = Map<TPath, TMethodDisable> | undefined;

export interface IRegistration {
  method: TMethod;
  path: TPath;
}

export interface IModifyOptions {
  dates?: TDates;
  hailMary?: THailMary;
  disable?: TDisable;
  qsOptions?: TQsParseOptions;
}

export interface IPopulatedOptions {
  logger: ILogger;
  dates: TDates;
  hailMary: THailMary;
  disable: TDisableMap;
}

export type TParser = (value: (TValue | TValueArray)) => TValue;
export type TOverrideParser = (queryString: string) => IAnyObject;
export type TOverride = (userParser: TOverrideParser) => void;
export type TModifyParser = (options: IModifyOptions) => void;

export type TDefaultParser = (
  parser: TParser,
  logger: ILogger,
  dates: TDates,
  hailMary: THailMary,
  disable: TDisableMap,
  qsOptions: TQsParseOptions
) => TParser;

export interface IEtqOptions {
  dates: TDates;
  hailMary: THailMary;
  disable: TDisable;
  qsOptions: TQsParseOptions;
  global: boolean;
  middleware: TMiddlewares;
};

export interface IEtq {
  default: () => void;
  override: TOverride;
  modify: TModifyParser;
  restore: () => void;
}

export type TEtq = (
  app: Application,
  logger: ILogger,
  dates: TDates,
  hailMary: THailMary,
  disable: TDisable,
  qsOptions: TQsParseOptions
) => IEtq
