import express, { Application, RequestHandler } from 'express';
import supertest from 'supertest';

/** ********************************************************************
  *                         Local Imports
  * ******************************************************************** */

import etq from '../src';

/** ********************************************************************
  *                            Types
  * ******************************************************************** */

import { IOptions, IRegisterOptions } from '../src/types';

/** ********************************************************************
  *                            Mocks
  * ******************************************************************** */

jest.mock('console', () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn()
}));

/** ********************************************************************
  *                            Setup
  * ******************************************************************** */

type AnyObject = { [key: string]: unknown };
const BASE_QUERY = { string: "string", boolean: true, number: 1, float: 1.11, null: null, undefined: undefined };
const parseQs = (object: AnyObject) => {
  return Object.entries(object).map((entry: [string, unknown]) => {
    return entry[1] ? entry.join('=') : `${entry[0]}=${entry[1]}`
  }).join('&');
};

const before = (path: string = '/test') => ((req, res, next) => {
  // @ts-expect-error prevent failure
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (req?.user?.[path]?.auth) {
    next();
  } else {
    res.status(401).send({ message: 'Unauthorized' });
  }
}) as RequestHandler;

const after = (path: string = '/test') => ((req, res, next) => {
  // @ts-expect-error prevent failure
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const user = req.user;
  const secret = req.query.secret;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (user?.[path]?.noAuthParams?.secret && secret) {
    res.status(403).send({ message: 'q parameter is forbidden on this endpoint' });
  } else {
    next();
  }
}) as RequestHandler;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

/** ********************************************************************
  *                            Tests
  * ******************************************************************** */

async function expressExpect(
  path: string,
  queryObject: AnyObject | string,
  assert: RequestHandler,
  options: IOptions = {},
  registerOptions?: IRegisterOptions
) {
  // Use supertest to simulate a GET request to /test
  const app: Application = express();

  etq.init(app);

  app.use((req, _, next) => {
    // @ts-expect-error required for testing middleware with generic RequestHandler
    req.user = {
      [path]: {
        auth: true,
        noAuthParams: { secret: true }
      }
    };

    next();
  });

  etq.configure(app, options);

  app.use(express.json({ limit: '1MB' }));
  app.use(express.urlencoded({ limit: '1MB', extended: true }));
  const router = express.Router();

  etq.register(
    router.get(path, assert),
    registerOptions
  );

  app.use(router);

  const query = typeof queryObject === 'string'
    ? queryObject
    : parseQs(queryObject);

  const response = await supertest(app).get(`${path}?${query}`);

  return response;
}

describe('register middleware', () => {
  it('uses parses on an unregistered path with no registered routes', async () => {
    const handler: RequestHandler = async (req, _, next) => {
      await expect(req.query).toEqual(expect.objectContaining({ ...BASE_QUERY, q: 1, id: 1 }));
      next();
    };

    const mock = jest.fn().mockImplementation(handler);
    await expressExpect(
      '/test',
      { ...BASE_QUERY, q: '01', id: '01' },
      mock,
      { global: false, disable: ['q'] },
      { global: false }
    );
    expect(mock).toHaveBeenCalled();
  });

  it('uses parses on an unregistered path with no registered routes', async () => {
    const handler: RequestHandler = async (req, _, next) => {
      await expect(req.query).toEqual(expect.objectContaining({ ...BASE_QUERY, q: '01', id: 1 }));
      next();
    };
    const mock = jest.fn().mockImplementation(handler);

    await expressExpect(
      '/test',
      { ...BASE_QUERY, q: '01', id: '01' },
      mock,
      { global: false, disable: ['q'] }
    );
    expect(mock).toHaveBeenCalled();
  });

  it('uses parses on an registered path using disable and global options', async () => {
    const handler: RequestHandler = async (req, _, next) => {
      await expect(req.query).toEqual(expect.objectContaining({ q: 1, id: '01' }));
      next();
    };
    const mock = jest.fn().mockImplementation(handler);
    await expressExpect(
      '/test',
      { ...BASE_QUERY, q: '01', id: '01' },
      mock,
      { global: false, disable: ['q'] },
      { disable: ['id'], global: false }
    );
    expect(mock).toHaveBeenCalled();
  });

  it('uses parses on an registered path with single', async () => {
    const handler: RequestHandler = (req, _, next) => {
      expect(req.query).toEqual({ q: 1 })
      next();
    };
    const mock = jest.fn().mockImplementation(handler);
    const response = await expressExpect(
      '/test',
      'q=01',
      mock,
      { global: false, middleware: [before('/tests')] }
    );

    expect(response.status).toEqual(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    expect(mock).not.toHaveBeenCalled();
  });

  it('uses parses on an registered path with only a after middleware', async () => {
    const handler: RequestHandler = (req, res, next) => {
      expect(req.query).toEqual({ q: 1, secret: 12345 });
      next();
    };
    const mock = jest.fn().mockImplementation(handler);
    const response = await expressExpect(
      '/test',
      'q=01&secret=12345',
      mock,
      { global: false, middleware: [null, after('/test')] }
    );

    expect(response.status).toEqual(403);
    expect(response.body).toEqual({ message: 'q parameter is forbidden on this endpoint' });
    expect(mock).not.toHaveBeenCalled();
  });

  it('uses parses a registered path with a before and after middleware that has a protected parameter', async () => {
    const handler: RequestHandler = async (req, _, next) => {
      await expect(req.query).toEqual({ q: 1, secret: 12345 });
      next();
    };
    const mock = jest.fn().mockImplementation(handler);
    const response = await expressExpect(
      '/test',
      'q=01&secret=12345',
      mock,
      { global: false, middleware: [before('/test'), after('/test')] }
    );

    expect(response.status).toEqual(403);
    expect(response.body).toEqual({ message: 'q parameter is forbidden on this endpoint' });
    expect(mock).not.toHaveBeenCalled();
  });

  it('uses parses on an registered path with a before and after middleware', async () => {
    const handler: RequestHandler = (req, res) => {
      expect(req.query).toEqual({ q: '1' });
      res.status(200).send();
    };
    const mock = jest.fn().mockImplementation(handler);
    const response = await expressExpect(
      '/test',
      'q=1',
      mock,
      { global: false, middleware: [before('/test'), after('/test')] }
    );
    expect(response.status).toEqual(200);
    expect(mock).toHaveBeenCalled();
  });
});