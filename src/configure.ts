import { Application } from 'express';
import { ParsedUrlQuery } from 'querystring';

import { Logger } from './logger';
import Parser from './parser';
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

  logger.trace('options', options);

  app.set(setString, (qs: string) => {
    logger.trace('qs', qs);
    const query: ParsedUrlQuery = {};
    const deepObject = {};
    const queryString = qs?.trim();

    if (queryString) {
      const entries = new URLSearchParams(queryString);

      for (const [key] of entries) {
        logger.trace('key', key);
        const value = query[key];

        if (value) {
          logger.debug('Duplicate key reusing existing entry', key, value);
        } else {
          const values = entries.getAll(key);
          logger.trace('key:', key);
          logger.trace('value: ', values);

          parser.parseQs(key, values, query, deepObject);
        }
      }
    }

    logger.trace('query', query);
    return query;
  });
}
