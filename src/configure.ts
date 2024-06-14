import { Application } from 'express';
import qs from 'qs';

import { Logger } from './logger';
import { Parser } from './parser';
import { Options, setString } from './types';

export function configure(app: Application, options?: Options) {
  const {
    logging,
    dates = false,
    hailMary = false
  }: Options = options || {};
  const {
    level = 'error',
    tag = true,
    logger: userLogger,
  } = logging || {};
  const logger = userLogger || Logger({ level, tag });
  const parser = Parser(logger, dates, hailMary);

  logger.debug('options', options);

  app.set(setString, (queryString: string) => {
    logger.debug('queryString', queryString);
    // If the query string is '' or ' ' we make
    const query: any = {};
    const trimmedQs = queryString?.trim();

    if (trimmedQs) {
      const params = qs.parse(trimmedQs);

      for (const [key, value] of Object.entries(params)) {
        query[key] = parser(value);
      }
    }

    return query;
  });
}
