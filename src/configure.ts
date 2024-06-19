import { Application } from 'express';

import { Logger } from './logger';
import { Etq } from './etq';
import {
  TLogArg,
  IOptions,
  ILogger,
  IEtq,
  IRuleOptions,
  TDefaultRule,
  TRule,
  IRules
} from './types';

export function configure(app: Application, options: IOptions = {}, rules: IRuleOptions = {}) {
  if (!app) throw new Error('express app required');
  if (!app.set) throw new Error('express app parameter does not contain set property');
  const {
    logging = {},
    dates = false,
    hailMary = false,
    ignore = [],
    qsOptions = {},
  } = options;
  const {
    level = 'error',
    tag = false,
    logString = (logLevel: string) => `${new Date().toISOString()} [${logLevel.toUpperCase()}] -`,
    logger = Logger({ level, tag, logString }) as ILogger
  } = logging;

  logger.info('Initializing express typed parser');
  logger.debug('options', options as TLogArg);
  const defaultRule = () => true;
  const etq: IEtq = Etq(app, logger, { dates, hailMary, ignore, qsOptions }, {
    isNumber: rules.isNumber || defaultRule,
    isBoolean: rules.isBoolean || defaultRule,
    isDate: rules.isDate || defaultRule
  } as IRules);

  etq.default();
  app.set('etq', etq);
}
