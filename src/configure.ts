import { Application } from 'express';
import qs from 'qs';

import { Logger } from './logger';
import { Parser } from './parser';
import { AnyObject, LogArg, Options, expressQsStringParser, Value } from './types';

export function configure(app: Application, options: Options = {}) {
  if (!app) throw new Error('express app required');
  if (!app.set) throw new Error('express app parameter does not contain set property');

  const {
    logging = {},
    dates = false,
    hailMary = false,
    qsOptions = {}
  }: Options = options;
  const {
    level = 'error',
    tag = false,
    logString = (logLevel: string) => `${new Date().toISOString()} [${logLevel.toUpperCase()}] -`,
    logger = Logger({ level, tag, logString }),
  } = logging;
  logger.info('Initializing express typed parser');
  logger.debug('options', options as LogArg);

  const parser = Parser(logger, dates, hailMary);

  app.set(expressQsStringParser, (queryString: string) => {
    logger.debug('queryString', queryString);
    // If the query string is '' or ' ' we make
    const query: AnyObject = {};
    const trimmedQs = queryString?.trim();

    if (trimmedQs) {
      const params = Object.entries(qs.parse(trimmedQs, qsOptions));

      for (const param of params) {
        const [key, value] = param;
        logger.debug('key', key);
        logger.debug('value', value as Value);

        query[key] = parser(value as Value);
      }
    }

    return query;
  });
}
