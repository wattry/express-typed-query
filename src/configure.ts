import { Application } from 'express';
import { ParsedUrlQuery } from 'querystring';

import { Logger } from './logger';
import { Parser } from './parser';
import { Options, setString } from './types';

export function configure(app: Application, options?: Options) {
  const {
    deepObject = false,
    logging,
    dates = false
  }: Options = options || {};
  const {
    level = 'error',
    tag = true,
    logger: userLogger
  } = logging || {};

  const logger = userLogger || Logger({ level, tag });
  logger.trace('options', options);

  app.set(setString, (qs: string) => {
    logger.trace('qs', qs);
    const query: ParsedUrlQuery = {};
    const queryString = qs?.trim();

    if (queryString) {
      const entries = new URLSearchParams(queryString);
      const parse = Parser(logger, deepObject, dates);
      const isArrayRegex = /\[\]$/gm;

      for (const [key] of entries) {
        logger.trace('key', key);
        const value = query[key];
        const isArray = isArrayRegex.test(key);

        if (value) {
          logger.debug('Duplicate key reusing existing entry', key, value);
        } else {
          const all = entries.getAll(key);
          logger.trace('entries', all);

          if (all.length > 1 || isArray) {
            const normalizedKey = key.replace(/\[\]$/, '');
            // There may be multiple entries for the same key.
            query[normalizedKey] = parse(all);
          } else {
            query[key] = parse(all[0]);
          }
        }
      }
    }

    logger.trace('query', query);
    return query;
  });
}
