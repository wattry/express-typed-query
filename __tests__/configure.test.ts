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

const error = jest.spyOn(console, 'error');
const warn = jest.spyOn(console, 'warn');
const info = jest.spyOn(console, 'info');
const debug = jest.spyOn(console, 'debug');
const trace = jest.spyOn(console, 'trace');

/** ********************************************************************
  *                            Setup
  * ******************************************************************** */

const app = express();

beforeAll(() => {
  jest.spyOn(app, 'set');
  jest.spyOn(app, 'get');
});

/** ********************************************************************
  *                            Tests
  * ******************************************************************** */

describe('configure', () => {
  it('sets a query parser', () => {
    expect(configure(app)).toBeUndefined();
    expect(app.set).toHaveBeenCalledWith(setString, expect.any(Function));
  });

  it('returns an empty object when the qs is an empty string', () => {
    configure(app);
    const handler = app.get(setString);

    const result = handler('');

    expect(result).toEqual({});
  });

  it('returns an empty object when the qs is an untrimmed whitespace', () => {
    configure(app);
    const handler = app.get(setString);

    const result = handler(' ');

    expect(result).toEqual({});
  });

  it('returns an empty object when the qs is null', () => {
    configure(app);
    const handler = app.get(setString);

    const result = handler(null);

    expect(result).toEqual({});
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
    expect(result).toEqual({ date });
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

  it('parses unexploded parameters which are arrays', () => {
    configure(app);
    const handler = app.get(setString);
    const result = handler('string[]=one');

    expect(result).toEqual({
      string: ['one']
    });
  });

  it('parses multiple exploded strings', () => {
    configure(app);
    const handler = app.get(setString);
    const result = handler('string=one&string=two');

    expect(result).toEqual({
      string: ['one', 'two']
    });
    expect(debug).not.toHaveBeenCalled();
  });

  it('parses a single array unexploded string', () => {
    configure(app);
    const handler = app.get(setString);
    const result = handler('string[]=one');

    expect(result).toEqual({
      string: ['one']
    });
    expect(debug).not.toHaveBeenCalled();
  });

  it('parses multiple strings with debug level logging', () => {
    configure(app, { logging: { level: 'debug' } });
    const handler = app.get(setString);
    const result = handler('string=one&string=two');

    expect(result).toEqual({ string: ['one', 'two'] });
    expect(debug).toHaveBeenCalledWith(
      '<etq>',
      expect.stringContaining('DEBUG'),
      'Duplicate key reusing existing entry',
      'string',
      JSON.stringify(['one', 'two'], null, 2)
    );
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(trace).not.toHaveBeenCalled();
  });

  it('parses multiple strings with trace level logging', () => {
    const options = { logging: { level: 'trace' } };
    const query = { string: ['one', 'two'] };
    configure(app, options);

    const handler = app.get(setString);
    const qs = 'string=one&string=two';
    const result = handler(qs);
    const tag: string = "<etq>";
    expect(result).toEqual(query);
    expect(debug).toHaveBeenCalled();
    expect(trace).toHaveBeenCalledTimes(7);
    expect(trace).toHaveBeenNthCalledWith(
      1
      tag,
      expect.stringContaining('TRACE'),
      'options',
      JSON.stringify(options, null, 2)
    );
    expect(trace).toHaveBeenNthCalledWith(
      2
      tag,
      expect.stringContaining('TRACE'),
      'qs',
      qs
    );
    expect(trace).toHaveBeenNthCalledWith(
      3
      tag,
      expect.stringContaining('TRACE'),
      'key',
      'string'
    );
    expect(trace).toHaveBeenNthCalledWith(
      4
      tag,
      expect.stringContaining('TRACE'),
      'entries',
      JSON.stringify(['one', 'two'], null, 2)
    );
    expect(trace).toHaveBeenNthCalledWith(
      5
      tag,
      expect.stringContaining('TRACE'),
      'isArray',
      JSON.stringify(['one', 'two'], null, 2)
    );
    expect(trace).toHaveBeenNthCalledWith(
      6
      tag,
      expect.stringContaining('TRACE'),
      'key',
      'string'
    );
    expect(trace).toHaveBeenNthCalledWith(
      7
      tag,
      expect.stringContaining('TRACE'),
      'query',
      JSON.stringify(query, null, 2)
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
