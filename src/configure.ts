import { Application } from 'express';

import { Logger } from './logger';
import { Etq } from './etq';
import {
  TLogArg,
  IOptions,
  ILogger,
  IRules,
  TRule
} from './types';

export function configure(app: Application, options: IOptions = {}) {
  if (!app) throw new Error('express app required');
  if (!app.set) throw new Error('express app parameter does not contain set property');

  const {
    logging = {},
    dates = false,
    hailMary = false,
    ignore = [],
    qsOptions = {},
    rules = {},
    global = true,
  } = options;
  const {
    level = 'error',
    tag = false,
    logString = (logLevel: string) => `${new Date().toISOString()} [${logLevel.toUpperCase()}] -`,
    logger = Logger({ level, tag, logString }) as ILogger
  } = logging;

  logger.info('Initializing express typed parser');
  logger.debug('options', options as TLogArg);

  Etq(app, logger, { dates, hailMary, ignore, qsOptions, rules, global });
}
