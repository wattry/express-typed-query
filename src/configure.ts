import { Application } from "express";
import { ParsedUrlQuery } from "querystring";

import { Logger } from './logger';
import { Parser } from './parser';
import { Options, setString } from "./types";

export function configure(app: Application, options?: Options) {
  const {
    deepObject = false,
    logging,
    dates = false
  }: Options = options || {};
  const {
    level = 'error',
    logger = Logger(level)
  } = logging || {};

  logger.trace('app', app);
  logger.trace('options', options);

  app.set(setString, (qs: string) => {
    logger.trace('query string', qs);

    const entries = new URLSearchParams(qs);
    const query: ParsedUrlQuery = {};
    const parse = Parser(logger, deepObject, dates);
    const isArrayRegex = /\[\]$/gm;

    for (const key of entries.keys()) {
      logger.trace('key', key);
      const value = query[key];
      const isArray = isArrayRegex.test(key);

      logger.trace('value', value);

      if (value) {
        logger.debug('Duplicate key reusing existing entry', key);
      } else {
        const all = entries.getAll(key);
        logger.trace('entries', all);

        if (all.length > 1 || isArray) {
          const normalizedKey = key.replace(/\[\]$/, '');
          // There may be multiple entries for the same key.
          query[normalizedKey] =  parse(all);
        } else {
          query[key] = parse(all[0]);
        }
      }
    }

    logger.trace('query', query);
    return query;
  });
}
