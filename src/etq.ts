import { Router } from 'express';
import qs from 'qs';

/* ************************************************************************************************
 *                                          Imported Types
 * ***********************************************************************************************/
import { Application, Request, Response, NextFunction } from 'express';

import { Parser } from './parser';
import { IError, IRegisterOptions } from './types';

/* ************************************************************************************************
 *                                          Custom Types
 * ***********************************************************************************************/

import {
  expressQsStringParser,
  IAnyObject,
  TParser,
  ILogger,
  TValue,
  IEtqOptions,
  TDisableMap,
  TQsParseOptions,
  TDisable,
  TMethod,
  TPath,
  TMiddleware,
  TGlobal
} from './types';

/* ************************************************************************************************
 *                                          Global State Objects
 * ***********************************************************************************************/

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

const ignoreKeys = {
  disable: new Map<string, boolean>([]),
  input: [] as string[],
  setInput(keys: string[]) {
    for (const key of keys) {
      this.input.push(key);
    }
  },
  getInput() {
    return this.input;
  },
  set(keys: string[]) {
    this.setInput(keys);

    for (const key of keys) {
      this.disable.set(key, true);
    }
  },
  get(): TDisableMap {
    return this.disable;
  }
};

const pathDisableKeys = {
  disable: new Map<TPath, Map<TMethod, { global: TGlobal, methods: TDisableMap }>>([]),
  set(path: TPath, method: TMethod, keys: string[], global: TGlobal) {
    const keyArray: [string, boolean][] = keys?.map((key: string) => [key, true]);
    const ignoreMethods = this.disable.get(path);

    if (ignoreMethods) {
      ignoreMethods.set(method, { global, methods: new Map(keyArray) });

      this.disable.set(path, ignoreMethods);
    } else {
      this.disable.set(path, new Map([[method, { global, methods: new Map(keyArray) }]]));
    }
  },
  get(path: TPath, method: TMethod): { global: TGlobal, methods: TDisableMap } {
    return this.disable?.get(path)?.get(method) || { global: true, methods: new Map([]) };
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

const etq = {
  get(logger: ILogger, disable: TDisableMap) {
    return (queryString: string): IAnyObject => {
      logger.debug('queryString', queryString);

      const parser: TParser = Parser({
        logger,
        dates: this.dates.get(),
        hailMary: this.hailMary.get(),
        disable,
      });

      // If the query string is '' or ' ' we make
      const query: IAnyObject = {};
      const trimmedQs = queryString?.trim();

      if (trimmedQs) {
        const params = Object.entries(qs.parse(trimmedQs, this.qsOptions.get()));

        for (const param of params) {
          const [key, value] = param;
          const shouldDisable = disable.has(key);
          logger.debug('key', key, 'disable: ', shouldDisable);
          logger.debug('value', value as TValue);

          query[key] = shouldDisable
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
  disable: ignoreKeys,
  pathDisableKeys,
  qsOptions
};

export function init(app: Application) {
  app.set(expressQsStringParser, false);
}

export function register(router: Router, options: IRegisterOptions = {}) {
  if (router) {
    const { disable = [], global = true } = options;
    const routerStack = router.stack;
    const layer = routerStack[routerStack.length - 1];

    if (layer.route) {
      const routeStack = layer.route.stack;
      const routeLayer = routeStack[routeStack.length - 1];
      const method = routeLayer.method;

      pathDisableKeys.set(
        layer.route.path,
        method.toUpperCase(),
        global ? [...ignoreKeys.getInput(), ...disable as TDisable] : disable as TDisable,
        global
      );
    }
  } else {
    throw new ReferenceError('Express router instance required');
  }
}

export function Etq(app: Application, logger: ILogger, options: IEtqOptions): void {
  const {
    dates,
    hailMary,
    disable,
    qsOptions,
    global,
    middleware
  } = options;
  etq.dates.set(dates);
  etq.hailMary.set(hailMary);
  etq.disable.set(disable);
  etq.qsOptions.set(qsOptions);

  const disableMap = etq.disable.get();

  if (global) {
    const parser = etq.get(logger, disableMap);

    app.set(expressQsStringParser, parser);
  } else {
    app.set(expressQsStringParser, false);

    const handler: TMiddleware = (request: Request, _: Response, next: NextFunction) => {
      try {
        // Disable the query parser, also if there are no query params return an empty object
        const { originalUrl, method } = request;
        // Get the path and the query string.
        const [path, queryString] = originalUrl.split('?');
        
        // Convert the query string into a map.
        const pathDisableMap: { global: TGlobal, methods: TDisableMap } = pathDisableKeys.get(path, method);
        
        // If no endpoint route ignores are provided and there are globals, we enforce the globals unless they have disabled globals for this route.
        const disabled = pathDisableMap.methods.size
          ? pathDisableMap.methods
          : pathDisableMap.global
            ? disableMap
            : pathDisableMap.methods;

        const parser = etq.get(logger, disabled);

        (request.query as IAnyObject) = parser(queryString);

        next();
      } catch (error: unknown) {
        logger.error('An error occurred parsing query string please check your configuration', (error as IError).message);
        next(error);
      }
    };

    if (middleware.length > 2) {
      throw new Error('Middleware array limited to 2. The first middleware is run before parsing and the second after');
    } else if (middleware.length >= 1) {
      const [before, after] = middleware;

      if (before) {
        app.use(before);
      }

      app.use(handler);

      if (after) {
        app.use(after);
      }
    } else {
      app.use(handler);
    }
  }
}
