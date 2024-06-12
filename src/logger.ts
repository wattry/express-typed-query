import { error, warn, info, debug, trace } from 'console';

import { LevelMap, LevelStringMap, Logging, LogFunction } from './types';
import check from './check';

export function Logger(options: Logging) {
  const {
    level = 'error',
    logString = (logLevel: string) => `${new Date().toISOString()} [${logLevel.toUpperCase()}] -`,
    tag
  } = options;
  const levelIdx = LevelMap[level];

  function parseLogSafeObjects(args: any[]) {
    return args.map((arg) => {
      return (check.isArray(arg) || check.isObject(arg))
        ? JSON.stringify(arg, null, 2)
        : arg
    });
  }

  function log(method: (...args: any) => void, levelIdx: number, thresholdIdx: number = 0, args: any[]) {
    if (levelIdx < thresholdIdx) {
      return null;
    }

    const finalArgs = [];
    const logLevel = LevelStringMap[levelIdx];

    if (tag) {
      finalArgs.push('<etq>');
    }

    if (check.isString(logString)) {
      finalArgs.push(logString);
    }

    if (args?.length) {
      const parsedArgs = parseLogSafeObjects(args);

      if (check.isFunction(logString)) {
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
    error: (...args: any[]) => log(error, levelIdx, 0, args),
    warn: (...args: any[]) => log(warn, levelIdx, 1, args),
    info: (...args: any[]) => log(info, levelIdx, 2, args),
    debug: (...args: any[]) => log(debug, levelIdx, 3, args),
    trace: (...args: any[]) => log(trace, levelIdx, 4, args)
  };
}