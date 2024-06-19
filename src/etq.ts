import { Application, NextFunction } from 'express';
import qs from 'qs';

import { Parser } from './parser';

import {
  expressQsStringParser,
  IAnyObject,
  TParser,
  ILogger,
  TValue,
  IEtq,
  TOverrideParser,
  IEtqOptions,
  TLogArg,
  IRules
} from './types';

function defaultParser(logger: ILogger, options: IEtqOptions, rules: IRules) {
  const {
    dates,
    hailMary,
    ignore,
    qsOptions
  } = options;

  return (queryString: string) => {
    logger.debug('queryString', queryString);
    const ignoreMap = new Map<string, boolean>(ignore.map((param) => [param, true]));
    const parser: TParser = Parser({ logger, dates, hailMary, ignore: ignoreMap }, rules);

    // If the query string is '' or ' ' we make
    const query: IAnyObject = {};
    const trimmedQs = queryString?.trim();

    if (trimmedQs) {
      const params = Object.entries(qs.parse(trimmedQs, qsOptions));

      for (const param of params) {
        const [key, value] = param;
        const shouldIgnore = ignoreMap.has(key);

        logger.debug('key', key, 'ignore: ', shouldIgnore);
        logger.debug('value', value as TValue);

        query[key] = shouldIgnore
          ? value as string
          : parser(value as TValue);
      }
    }

    logger.debug('query', query);
    return query;
  }
}

export function Etq(app: Application, logger: ILogger, options: IEtqOptions, rules: IRules): IEtq {
  return {
    qs: () => {
      return (_: Request, __: Response, next: NextFunction) => {
        logger.debug('<restore>');

        app.delete(expressQsStringParser);
        app.set(expressQsStringParser, 'extended');

        if (next) {
          next();
        }
      }
    },
    restore: () => {
      return (_: Request, __: Response, next: NextFunction) => {
        logger.debug('<restore>');

        app.delete(expressQsStringParser);
        app.set(expressQsStringParser, defaultParser(logger, options, rules));

        next();
      }
    },
    default: () => {
      logger.debug('<default>');
      app.delete(expressQsStringParser);
      app.set(expressQsStringParser, defaultParser(logger, options, rules));
    },
    override: (userParser: TOverrideParser) => {
      return (_: Request, __: Response, next: NextFunction) => {
        logger.debug('<override>');
        app.delete(expressQsStringParser);
        app.set(expressQsStringParser, userParser);

        next();
      }
    },
    modify: (iOptions) => {
      logger.debug('<modify>', 'iOptions', iOptions as TLogArg);
      const iHailMary = iOptions?.hailMary || options.hailMary;
      const iDates = iOptions?.dates || options.dates;
      const iIgnore = iOptions?.ignore || options.ignore;
      const iQsOptions = iOptions?.qsOptions || options.qsOptions;

      return (_: Request, __: Response, next: NextFunction) => {
        app.delete(expressQsStringParser);
        app.set(expressQsStringParser, defaultParser(logger, { dates: iDates, hailMary: iHailMary, ignore: iIgnore, qsOptions: iQsOptions }, rules));

        next();
      }
    }
  } as IEtq;
}