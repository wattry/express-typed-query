import console from 'console';

import { LevelMap } from './types';
import check from './check';

export function Logger(
  level: (string | undefined) = 'error',
  logString: ((logLevel: string) => string | undefined) = (logLevel: string) => `${new Date().toISOString()} [${logLevel.toUpperCase()}] -`
) {
  const levelIdx = LevelMap[level];
  const { error, warn, info, debug, trace } = console;

  function parseObjects(args: any[]) {
    return args.map((arg) => {
      return (check.isArray(arg) || check.isJsonObject(arg))
        ? JSON.stringify(args, null, 2)
        : arg
    });
  }

  return {
    error: (...args: any[]) => error(logString, ...parseObjects(args)),
    warn: (...args: any[]) => levelIdx >= 1 ? warn(logString('warn'), ...parseObjects(args)) : null,
    info: (...args: any[]) => levelIdx >= 2 ? info(logString('info'), ...parseObjects(args)) : null,
    debug: (...args: any[]) => levelIdx >= 3 ? debug(logString('debug'), ...parseObjects(args)) : null,
    trace: (...args: any[]) => levelIdx >= 4 ? trace(logString('trace'), ...parseObjects(args)) : null
  };
}