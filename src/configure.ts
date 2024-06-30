import { Application } from 'express';

import { Logger } from './logger';
import { Etq } from './etq';
import {
  IOptions,
  ILogger,
  ILogging
} from './types';

export function configure(app: Application, options: IOptions = {}) {
  if (!app) throw new Error('express app required');
  if (!app.set) throw new Error('express app parameter does not contain set property');

  const {
    logging = {},
    dates = false,
    hailMary = false,
    disable = [],
    qsOptions = {},
    global = true,
    middleware
  } = options as IOptions;
  const {
    level = 'error',
    tag = false,
    logString = (logLevel: string) => `${new Date().toISOString()} [${logLevel.toUpperCase()}] -`,
    logger = Logger({ level, tag, logString }) as ILogger
  } = logging as ILogging;
  logger.debug('Initializing express typed parser', { logging, dates, hailMary, disable, qsOptions, global } as any);

  const middlewares = middleware
    ? Array.isArray(middleware)
      ? middleware
      : [middleware]
    : [];

  Etq(app, logger, { dates, hailMary, disable, qsOptions, global, middleware: middlewares });
}
