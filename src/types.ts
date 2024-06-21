import { IParseOptions, BooleanOptional } from 'qs';
import { Application } from 'express';

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
export type TLogString = string | TLogFunction;
export type THailMary = boolean;
export type TQsParseOptions = IParseOptions<BooleanOptional>;
export type TIgnore = string[];
export type TIgnoreMap = Map<string, boolean>;

export interface ILogging {
  logger?: ILogger;
  level?: string;
  tag?: boolean;
  logString?: TLogString;
}

type TDefaultRule = () => boolean;

export interface IRuleOptions {
  isNumber?: TDefaultRule;
  isBoolean?: TDefaultRule;
  isDate?: TDefaultRule;
}

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


export type TRule = (value: TValue, check: ICheck) => boolean;
export interface IRules {
  isNumber?: TRule
  isBoolean?: TRule
  isDate?: TRule
}
export type TMethod = string;
export type TPath = string;
export type TMethodRules = Map<TMethod, IRules> | undefined;
export type TPathRules = Map<TPath, TMethodRules> | undefined;

export interface IRegistration {
  method: TMethod;
  path: TPath;
  rules: IRules;
}

export interface IOptions {
  logging?: ILogging;
  dates?: TDates;
  hailMary?: THailMary;
  ignore?: TIgnore;
  qsOptions?: TQsParseOptions;
  rules?: IRules;
  global?: boolean;
}

export interface IModifyOptions {
  dates?: TDates;
  hailMary?: THailMary;
  ignore?: TIgnore;
  qsOptions?: TQsParseOptions;
}

export interface IPopulatedOptions {
  logger: ILogger;
  dates: TDates;
  hailMary: THailMary;
  ignore: TIgnoreMap;
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
  ignore: TIgnoreMap,
  qsOptions: TQsParseOptions
) => TParser;

export interface IEtqOptions {
  dates: TDates;
  hailMary: THailMary;
  ignore: TIgnore;
  qsOptions: TQsParseOptions;
  rules: IRules;
  global: boolean;
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
  ignore: TIgnore,
  qsOptions: TQsParseOptions
) => IEtq
