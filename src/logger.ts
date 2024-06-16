import { error, warn, info, debug, trace } from 'console';

import { Logger, LevelMap, LevelStringMap, LogArgs, LogArg, Logging, LogFunction } from './types';
import check from './check';

export function Logger(options: Logging): Logger {
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
  function parseLogSafeObjects(args: LogArgs): LogArgs {
    return args.map((arg) => {
      return (check.isArray(arg) || check.isObject(arg))
        ? JSON.stringify(arg, null, 2)
        : arg
    });
  }

  function log(method: (...args: LogArgs) => void, levelIdx: number, thresholdIdx: number = 0, args: LogArgs) {
    if (levelIdx < thresholdIdx) {
      return null;
    }

    const finalArgs: LogArgs = [];
    const logLevel: string = LevelStringMap[thresholdIdx];

    if (tag) {
      finalArgs.push('<etq>');
    }

    if (check.isString(logString as LogArg)) {
      finalArgs.push(logString as LogArg);
    }

    if (args?.length) {
      const parsedArgs: LogArgs = parseLogSafeObjects(args);

      if (check.isFunction(logString as LogArg)) {
        const logFn = logString as LogFunction;

        finalArgs.push(logFn(logLevel));
      }

      for (const arg of parsedArgs) {
        finalArgs.push(arg);
      }
    }

    method(...finalArgs);
  }

  return {
    error: (...args: LogArgs) => log(error, levelIdx, 0, args),
    warn: (...args: LogArgs) => log(warn, levelIdx, 1, args),
    info: (...args: LogArgs) => log(info, levelIdx, 2, args),
    debug: (...args: LogArgs) => log(debug, levelIdx, 3, args),
    trace: (...args: LogArgs) => log(trace, levelIdx, 4, args)
  };
}