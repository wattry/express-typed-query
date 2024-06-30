import { error, warn, info, debug, trace } from 'console';

import {
  LevelStringMap,
  ILogger,
  LevelMap,
  TLogArgs,
  TLogArg,
  ILogging,
  TLogFunction
} from './types';
import * as check from './check';

export function Logger(options: ILogging): ILogger {
  const {
    level = 'error',
    logString = (logLevel: string) => `${new Date().toISOString()} [${logLevel.toUpperCase()}] -`,
    tag = false
  } = options;
  const levelIdx = LevelMap[level];

  /**
   * Converts JSON and JS objects to strings to log the value out.
   * @param args
   * @returns {string}
   */
  function parseLogSafeObjects(args: TLogArgs): TLogArgs {
    return args.map((arg) => {
      return (check.isArray(arg) || check.isObject(arg))
        ? JSON.stringify(arg, null, 2)
        : arg
    });
  }

  function log(method: (...args: TLogArgs) => void, levelIdx: number, thresholdIdx: number = 0, args: TLogArgs) {
    if (levelIdx < thresholdIdx) {
      return null;
    }

    const finalArgs: TLogArgs = [];
    const logLevel: string = LevelStringMap[thresholdIdx];

    if (tag) {
      finalArgs.push('<etq>');
    }

    if (check.isString(logString as TLogArg)) {
      finalArgs.push(logString as TLogArg);
    }

    if (args?.length) {
      const parsedArgs: TLogArgs = parseLogSafeObjects(args);

      if (check.isFunction(logString as TLogArg)) {
        const logFn = logString as TLogFunction;

        finalArgs.push(logFn(logLevel));
      }

      for (const arg of parsedArgs) {
        finalArgs.push(arg);
      }
    }

    method(...finalArgs);
  }

  return {
    error: (...args: TLogArgs) => log(error, levelIdx, 0, args),
    warn: (...args: TLogArgs) => log(warn, levelIdx, 1, args),
    info: (...args: TLogArgs) => log(info, levelIdx, 2, args),
    debug: (...args: TLogArgs) => log(debug, levelIdx, 3, args),
    trace: (...args: TLogArgs) => log(trace, levelIdx, 4, args)
  };
}