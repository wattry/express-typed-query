import { expect, jest, it } from '@jest/globals';
import express from 'express';
import console from 'console';

/** ********************************************************************
  *                         Local Imports
  * ******************************************************************** */

import { configure } from "../src/configure";


/** ********************************************************************
  *                            Types
  * ******************************************************************** */

import { setString } from "../src/types";

/** ********************************************************************
  *                            Mocks
  * ******************************************************************** */

const debug = jest.spyOn(console, 'debug');

/** ********************************************************************
  *                            Setup
  * ******************************************************************** */

const app = express();

beforeAll(() => {
  jest.spyOn(app, 'set');
  jest.spyOn(app, 'get');
});

beforeEach(() => {
  debug.mockClear();
});

/** ********************************************************************
  *                            Tests
  * ******************************************************************** */

describe('configure', () => {
  it('sets a query parser', () => {
    expect(configure(app)).toBeUndefined();
    expect(app.set).toHaveBeenCalledWith(setString, expect.any(Function));
  });

  it('it parses every type with a simple query string', () => {
    configure(app);
    const handler = app.get(setString);
    const date = new Date();
    const isoDate = date.toISOString();

    expect(handler(
      `string=string&true=true&false=false&number=1&float=1.11&null=null&undefined=undefined&date=${isoDate}`
    )).toEqual({
      date: isoDate,
      true: true,
      false: false,
      string: 'string',
      number: 1,
      float: 1.11,
      null: null,
      undefined: undefined
    });
    expect(app.get).toHaveBeenCalledWith(setString);
  });

  it('parses a an object', () => {
    configure(app);
    const handler = app.get(setString);
    const result = handler(
      'filter={"string": "string", "boolean": true, "number": 1, "float": 1.11, "null": null, "array": ["string", true, 1, 1.11, null] }'
    );

    expect(result).toEqual({
      filter: {
        string: 'string',
        boolean: true,
        number: 1,
        float: 1.11,
        null: null,
        array: ['string', true, 1, 1.11, null]
      }
    });
  });

  it('parses a an object without throwing using deepObject setting', () => {
    configure(app, { deepObject: true });
    const handler = app.get(setString);
    const result = handler(
      'filter={"string": "string", "boolean": true, "number": 1, "float": 1.11, "null": null, "array": ["string", true, 1, 1.11, null] }'
    );

    expect(result).toEqual({
      filter: {
        string: 'string',
        boolean: true,
        number: 1,
        float: 1.11,
        null: null,
        array: ['string', true, 1, 1.11, null]
      }
    });
  });

  it('parses a deep object', () => {
    configure(app, { deepObject: true });
    const handler = app.get(setString);
    const result = handler(
      'filter={"string": "string", "boolean": "true", "number": "1", "float": "1.11", "null": "null", "array": ["string", "true", "1", "1.11", "null"] }'
    );

    expect(result).toEqual({
      filter: {
        string: 'string',
        boolean: true,
        number: 1,
        float: 1.11,
        null: null,
        array: ['string', true, 1, 1.11, null]
      }
    });
  });

  it('parses dates', () => {
    configure(app, { dates: true });
    const date = new Date();
    const isoDate = date.toISOString();
    const handler = app.get(setString);

    const result = handler(`date=${isoDate}`);
    jest.spyOn(console, 'debug');

    expect(result).toEqual({ date });
    expect(debug).not.toHaveBeenCalled();
  });

  it('it parses every type with a dates', () => {
    configure(app, { dates: true });
    const handler = app.get(setString);
    const date = new Date();
    const isoDate = date.toISOString();

    expect(handler(
      `string=string&true=true&false=false&number=1&float=1.11&null=null&undefined=undefined&date=${isoDate}`
    )).toEqual({
      date,
      true: true,
      false: false,
      string: 'string',
      number: 1,
      float: 1.11,
      null: null,
      undefined: undefined
    });
    expect(app.get).toHaveBeenCalledWith(setString);
  });

  it('parses multiple strings unexploded', () => {
    configure(app);
    const handler = app.get(setString);
    const result = handler('string[]=one&string[]=two');

    expect(result).toEqual({
      string: ['one', 'two']
    });
  });

  it('parses multiple exploded strings', () => {
    configure(app);
    const handler = app.get(setString);
    const result = handler('string=one&string=two');
    jest.spyOn(console, 'debug');

    expect(result).toEqual({
      string: ['one', 'two']
    });
    expect(debug).not.toHaveBeenCalled();
  });

  it('parses a single array unexploded string', () => {
    configure(app);
    const handler = app.get(setString);
    const result = handler('string[]=one');
    jest.spyOn(console, 'debug');

    expect(result).toEqual({
      string: ['one']
    });
    expect(debug).not.toHaveBeenCalled();
  });

  it('parses multiple strings with debug level logging', () => {
    configure(app, { logging: { level: 'debug' }});
    const handler = app.get(setString);
    const result = handler('string=one&string=two');

    expect(result).toEqual({
      string: ['one', 'two']
    });
    expect(debug).toHaveBeenCalledWith(
      expect.stringContaining('DEBUG'),
      'Duplicate key reusing existing entry',
      'string'
    );
  });

  it('parses multiple numbers', () => {
    configure(app);
    const handler = app.get(setString);
    const result = handler('number=1&number=2');

    expect(result).toEqual({
      number: [1, 2]
    });
  });

  it('parses multiple floats', () => {
    configure(app);
    const handler = app.get(setString);
    const result = handler('float=1.11&float=2.22');

    expect(result).toEqual({
      float: [1.11, 2.22]
    });
  });

  it('parses multiple booleans', () => {
    configure(app);
    const handler = app.get(setString);
    const result = handler('boolean=true&boolean=false');

    expect(result).toEqual({
      boolean: [true, false]
    });
  });
});
