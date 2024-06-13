import { Application } from 'express';
import { ParsedUrlQuery } from 'querystring';

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

  app.set(setString, (qs: string) => {
    logger.debug('qs', qs);
    const query: ParsedUrlQuery = {};
    // If the query string is '' or ' ' we make
    const queryString = qs?.trim();

    if (queryString) {
      const params = new URLSearchParams(queryString);
      // Get deduplicate the keys
      const keys = new Set(params.keys());

      for (const key of keys) {
        logger.debug('key', key);
        // Get all the values for a possible key, reducing iteration.
        const values = params.getAll(key);
        logger.debug('value: ', values);

        parser.parseQs(key, values, query);
      }
    }

    logger.debug('query', query);
    return query;
  });
}
