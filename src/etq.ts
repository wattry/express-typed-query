import { Application, Request, Response, NextFunction } from 'express';
import qs, { ParsedQs } from 'qs';

import { Parser } from './parser';

import {
  expressQsStringParser,
  IAnyObject,
  TParser,
  ILogger,
  TValue,
  IEtqOptions,
  TIgnoreMap,
  TQsParseOptions,
  TPathRules,
  IRules,
  TRule,
  TMethodRules,
  IRegistration
} from './types';

const dates = {
  dates: false,
  set(value: boolean) {
    this.dates = value;
  },
  get() {
    return this.dates;
  }
};

const hailMary = {
  hailMary: false,
  set(value: boolean) {
    this.hailMary = value;
  },
  get() {
    return this.hailMary;
  }
};

const ignore = {
  ignore: new Map([]),
  set(value: string[]) {
    this.ignore = new Map<string, boolean>(value.map((param: string) => [param, true]));
  },
  get() {
    return this.ignore;
  }
};

const qsOptions = {
  qsOptions: {},
  set(value: TQsParseOptions) {
    this.qsOptions = value;
  },
  get() {
    return this.qsOptions;
  }
};

const pathRules: TPathRules = new Map();
const defaultRule: TRule = () => true;

export function register(options: IRegistration) {
  // @ts-ignore
  // ignore.set(options.path, new Map([[options.method.toUpperCase(), options.rules]]));
  pathRules?.set(options.path, new Map([[
    options.method.toUpperCase(), {
      isNumber: options.rules?.isNumber || defaultRule,
      isBoolean: options.rules.isBoolean || defaultRule,
      isDate: options.rules?.isDate || defaultRule
    }
  ]]));

  return (_: Request, __: Response, next: NextFunction) => next();
}

const etq = {
  get(logger: ILogger, rules: IRules) {
    return (queryString: string, opts: IAnyObject) => {
      logger.debug('queryString', queryString);

      const parser: TParser = Parser({
        logger,
        dates: this.dates.get(),
        hailMary: this.hailMary.get(),
        ignore: ignore.get() as TIgnoreMap,
      },
        rules
      );

      // If the query string is '' or ' ' we make
      const query: IAnyObject = {};
      const trimmedQs = queryString?.trim();

      if (trimmedQs) {
        const params = Object.entries(qs.parse(trimmedQs, this.qsOptions.get()));

        for (const param of params) {
          const [key, value] = param;
          const shouldIgnore = this.ignore.get().has(key);
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
  },
  dates,
  hailMary,
  ignore,
  qsOptions,
  pathRules
}

export function Etq(app: Application, logger: ILogger, options: IEtqOptions): void {
  const {
    dates,
    hailMary,
    ignore,
    qsOptions,
    rules: iRules,
    global
  } = options;

  etq.dates.set(dates);
  etq.hailMary.set(hailMary);
  etq.ignore.set(ignore);
  etq.qsOptions.set(qsOptions);

  if (global) {
    const rules: IRules = {
      isNumber: iRules?.isNumber || defaultRule,
      isBoolean: iRules?.isBoolean || defaultRule,
      isDate: iRules?.isDate || defaultRule
    };

    const parser = etq.get(logger, rules);

    app.set(expressQsStringParser, parser);
  } else {
    app.set('pathRules', pathRules);

    app.use((request: Request, _: Response, next: NextFunction) => {
      app.set(expressQsStringParser, () => {});

      const { originalUrl, method } = request;
      const [path, queryString] = originalUrl.split('?');
      const methodRules: TMethodRules = pathRules?.get(path);
      const methodRule = methodRules?.get(method);
      const rules: IRules = {
        isNumber: methodRule?.isNumber || defaultRule,
        isBoolean: methodRule?.isBoolean || defaultRule,
        isDate: methodRule?.isDate || defaultRule
      };
      const parser = etq.get(logger, rules);

      try {
        request.query = parser(queryString, {}) as ParsedQs;

        next();
      } catch (error) {
        next(error);
      }
    });
  }
}