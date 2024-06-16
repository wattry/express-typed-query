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

import { expressQsStringParser, AnyObject, Value } from "../src/types";
import check from '../src/check';
import { Application } from 'express';

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

const app: Application = express();
const BASE = { string: "string", boolean: true, number: 1, float: 1.11, null: null, undefined: undefined };
const stringifyValues = (_: unknown, value: Value) => {
  if (value === undefined) {
    return undefined;
  }
  return !check.isString(value) && !check.isObject(value) ? `${value}` : value
};
const parseQs = (array: [string, Value | null][]): string => array.map((entry: [string, Value | null]) => entry[1] ? entry.join('=') : `${entry[0]}=${entry[1]}`).join('&');
const parser = (qs: string | null): AnyObject | null => {
  const caller = app.get(expressQsStringParser as string) as (qs: string) => AnyObject;

  return caller(qs as string) as AnyObject;
};
const expectedObject: Value = JSON.parse(JSON.stringify(BASE)) as AnyObject;
const expected = { filter: { ...expectedObject, array: Array.from(Object.values(BASE)) } };

beforeAll(() => {
  jest.spyOn(app, 'set');
  jest.spyOn(app, 'get');
});

beforeEach(() => {
  error.mockClear();
  warn.mockClear();
  info.mockClear();
  debug.mockClear();
  trace.mockClear();
})

/** ********************************************************************
  *                            Tests
  * ******************************************************************** */

describe('configure', () => {
  describe('error', () => {
    it('throw the hailMary is not enabled and the structure appears to be JSON', () => {
      configure(app, { logging: { level: 'debug' }});

      const message = 'Malformed JSON query - Unexpected non-whitespace character after JSON at position 27: { "id": "1", "name": "name"\x1b[4m },\x1b';
      expect(() => parser('string[a]={ "id": 1, "name": "name" },'))
        .toThrowError(message);
      expect(error).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('[ERROR]'),
        'Parsing JSON failed',
        message
      );
    });

    it('throws when the JSON is unparsable with the hailMary option', () => {
      configure(app, { hailMary: true, logging: { level: 'warn' } });
      const message = 'Malformed JSON query - Expected \':\' after property name in JSON at position 107: Expected "string"\x1b[4m:\x1b[0m Received "string"\x1b[4m \x1b';
      const value = '{string: "string", boolean: "true", number: "1", float: "1.11", null: "null", array: { "string", true", "1", "1.11", "null"} }';
      const qs = `filter=${value}`;

      expect(() => parser(qs))
        .toThrowError(message);
      expect(warn).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('[WARN] -'),
        'Performing Hail Mary'
      );
      expect(error).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('[ERROR]'),
        'Hail Mary failed:',
        message
      );
    });

    it('throws when value is JSON like but is malformed', () => {
      configure(app, { hailMary: true });

      const qs = 'filter={a}';

      expect(() => parser(qs))
        .toThrowError('Malformed JSON query - Expected \':\' after property name in JSON at position 4: Expected {"a"\x1b[4m:\x1b[0m Received {"a"\x1b[4m \x1b');
    });
  });

  describe('success', () => {
    it('adds a tag when the tag option is set and the log level is debug', () => {
      const options = { logging: { tag: true, level: 'debug' } };
      configure(app, options);

      parser('');
      expect(debug).toHaveBeenNthCalledWith(
        1,
        '<etq>',
        expect.stringContaining('[DEBUG]'),
        'options',
        expect.stringContaining(JSON.stringify(options, null, 2))
      );
    });

    it('allows the user to set a log string', () => {
      const options = { logging: { level: 'debug', logString: 'test' } };
      configure(app, options);

      parser('');
      expect(debug).toHaveBeenNthCalledWith(
        1,
        'test',
        'options',
        expect.stringContaining(JSON.stringify(options, null, 2))
      );
    });

    it('allows the user to set a function for the log string', () => {
      const isoDate = new Date().toISOString();
      const options = { logging: { level: 'debug', logString: (logLevel: string) => `${isoDate} [${logLevel}] test -` } };
      configure(app, options);

      parser('');
      expect(debug).toHaveBeenNthCalledWith(
        1,
        `${isoDate} [debug] test -`,
        'options',
        expect.stringContaining(JSON.stringify(options, null, 2))
      );
    });

    it('returns an empty query when q param is an empty string', () => {
      configure(app);

      expect(parser('q= '))
        .toEqual({ q: '' });
    });

    it('sets a query parser', () => {
      expect(configure(app)).toBeUndefined();
      expect(app.set).toHaveBeenCalledWith(expressQsStringParser, expect.any(Function));
    });

    it('returns an empty object when the qs is an empty string', () => {
      configure(app);

      expect(parser('')).toEqual({});
    });

    it('returns an empty object when the qs is an untrimmed whitespace', () => {
      configure(app);

      expect(parser(' ')).toEqual({});
    });

    it('returns an empty object when the qs is null', () => {
      configure(app);

      expect(parser(null)).toEqual({});
    });

    it('parses every type with a simple query string', () => {
      configure(app);

      const date = new Date();
      const isoDate = date.toISOString();
      const qs: string = parseQs(Object.entries({ ...BASE, date: isoDate }));

      expect(parser(qs))
        .toEqual({
          date: isoDate,
          boolean: true,
          string: 'string',
          number: 1,
          float: 1.11,
          null: null,
          undefined: undefined
        });
      expect(app.get).toHaveBeenCalledWith(expressQsStringParser);
    });

    it('parses an object', () => {
      configure(app);

      expect(parser(`filter=${JSON.stringify(BASE, stringifyValues)}`))
        .toEqual({ filter: BASE });
    });

    it('parses a nested JSON string', () => {
      configure(app);

      expect(parser(`filter=${JSON.stringify({ ...BASE, object: { ...BASE } })}`))
        .toEqual({
          filter: {
            ...BASE,
            object: { ...BASE }
          }
        });
    });

    it('parses dates', () => {
      configure(app, { dates: true });
      const date = new Date();
      const isoDate = date.toISOString();

      expect(parser(`date=${isoDate}`)).toEqual({ date });
    });

    it('parses every type with a dates', () => {
      configure(app, { dates: true });

      const date = new Date();
      const isoDate = date.toISOString();
      const qs: string = parseQs(Object.entries({ ...BASE, date: isoDate }));

      expect(parser(qs)).toEqual({ ...BASE, date: date });
    });

    it('parses a correctly formed JSON string without the hailMary option with all quoted values', () => {
      configure(app);

      const qs = 'filter={ "string": "string", "boolean": "true", "number": "1", "float": "1.11", "null": "null", "array": ["string", "true", "1", "1.11", "null"] }';

      expect(parser(qs)).toEqual(expected);
    });

    it('parses a correctly formed JSON string without the hailMary option with unquoted values which are not strings', () => {
      configure(app, { dates: true });

      const now = new Date()
      const isoNow = now.toISOString();
      const qs = `filter={ "string": "string", "boolean": true, "number": 1, "float": 1.11, "null": null, "date": "${isoNow}", "array": ["string", true, 1, 1.11, null, "undefined"] }`;


      expect(parser(qs)).toEqual({ filter: { ...expected.filter, date: now } });
    });

    it('replaces all quotes and tries to parse the entries with the hailMary option with malformed JSON', () => {
      configure(app, { hailMary: true });

      const qs = 'filter={string: "string", \'boolean\': true", number: \'1", float: "1.11", null: "null", array: ["string", true", "1", "1.11", "null"] }';

      expect(parser(qs)).toEqual(expected);
    });

    it('tries to parse the string to JSON as a last ditch attempt when no quotes are provided', () => {
      configure(app, { hailMary: true });

      const qs = 'filter={string: string, boolean: true, number: 1, float: 1.11, null: null, array: [string, true, 1, 1.11, null, undefined] }';

      expect(parser(qs)).toEqual(expected);
    });

    it('parses repeated keys which are strings', () => {
      configure(app);

      expect(parser('string=one&string=two')).toEqual({ string: ['one', 'two'] });
    });

    it('parses a single array parameter which is a string', () => {
      configure(app);

      expect(parser('string[]=one')).toEqual({
        string: ['one']
      });
      expect(debug).not.toHaveBeenCalled();
    });

    it('parses multiple array parameters which are strings', () => {
      configure(app);

      expect(parser('string[]=one&string[]=two')).toEqual({
        string: ['one', 'two']
      });
      expect(debug).not.toHaveBeenCalled();
    });

    it('parses repeated keys which are numbers', () => {
      configure(app);

      expect(parser('number=1&number=2')).toEqual({
        number: [1, 2]
      });
    });

    it('parses a single array parameter which is a number', () => {
      configure(app);

      expect(parser('number[]=1')).toEqual({ number: [1] });
    });

    it('parses multiple array parameters which are numbers', () => {
      configure(app);

      expect(parser('number[]=1&number[]=2')).toEqual({ number: [1, 2] });
    });

    it('parses repeated keys which are floats', () => {
      configure(app);

      expect(parser('float=1.11&float=2.22')).toEqual({ float: [1.11, 2.22] });
    });

    it('parses a single array parameter which is a float', () => {
      configure(app);

      expect(parser('float[]=1.11')).toEqual({ float: [1.11] });
    });

    it('parses multiple array parameters which are floats', () => {
      configure(app);

      expect(parser('float[]=1.11&float[]=2.22')).toEqual({ float: [1.11, 2.22] });
      expect(error).not.toHaveBeenCalled();
    });

    it('parses repeated keys which are booleans', () => {
      configure(app);

      expect(parser('boolean=true&boolean=false')).toEqual({
        boolean: [true, false]
      });
    });

    it('parses a single array parameter which is a boolean', () => {
      configure(app);

      expect(parser('boolean[]=true')).toEqual({ boolean: [true] });
    });

    it('parses multiple array parameters which are booleans', () => {
      configure(app);

      expect(parser('boolean[]=true&boolean[]=false')).toEqual({ boolean: [true, false] });
    });

    it('parses deepObject parameters which are booleans', () => {
      configure(app);

      expect(parser('boolean[a]=true&boolean[b]=false')).toEqual({ boolean: { a: true, b: false } });
    });

    it('parses repeated parameters which are arrays of dates and numbers', () => {
      configure(app, { dates: true });

      const now = Date.now();
      const isoNow = new Date(now).toISOString();
      const isoLater = new Date(now + 10000).toISOString();

      expect(parser(`date=${isoNow}&date=${isoLater}&number=1&number=2`)).toEqual({
        date: [new Date(now), new Date(isoLater)],
        number: [1, 2]
      });
    });

    it('parses single array parameters which are a date and number', () => {
      configure(app);

      const now = Date.now();
      const isoNow = new Date(now).toISOString();

      expect(parser(`date[]=${isoNow}&number[]=1`))
        .toEqual({ date: [isoNow], number: [1] });
    });

    it('parses multiple array parameters which are dates and numbers', () => {
      configure(app, { dates: true });

      const now = Date.now();
      const isoNow = new Date(now).toISOString();
      const isoLater = new Date(now + 10000).toISOString();

      expect(parser(`date[]=${isoNow}&date[]=${isoLater}&number[]=1&&number[]=2`)).toEqual({
        date: [new Date(now), new Date(isoLater)],
        number: [1, 2]
      });
    });

    it('parses deepObject array parameters which dates and numbers', () => {
      configure(app, { dates: true });

      const now = Date.now();
      const isoNow = new Date(now).toISOString();
      const isoLater = new Date(now + 10000).toISOString();

      expect(parser(`date[a]=${isoNow}&date[a]=${isoLater}&number[b]=1&number[b]=2`)).toEqual({
        date: { a: [new Date(isoNow), new Date(isoLater)] },
        number: { b: [1, 2] }
      });
    });

    it('parses deepObject array parameters which are any primitive type', () => {
      configure(app);

      expect(parser('string[a]=one&string[a]=3&string[a]=true&string[a]=1.11&string[a]=null&string[b]=two&string[b]=4&string[b]=false&string[b]=2.22&string[b]=null')).toEqual({
        string: { a: ['one', 3, true, 1.11, null], b: ['two', 4, false, 2.22, null] }
      });
    });

    it('parses deepObject parameters with multiple object keys with numbers', () => {
      configure(app);

      expect(parser('string[a]=1&string[b]=2&string[c]=3')).toEqual({
        string: { a: 1, b: 2, c: 3 }
      });
    });

    it('parses deepObject parameters which is a valid JSON object', () => {
      configure(app);

      expect(parser('string[a]={ "id": 1, "name": "name" }')).toEqual({
        string: { a: { id: 1, name: 'name' } }
      });
    });

    it('parses deepObject parameters which is a invalid JSON object using a hailMary', () => {
      configure(app, { hailMary: true });

      expect(parser('string[a]={ id: \'1\', name: "name" }')).toEqual({
        string: { a: { id: 1, name: 'name' } }
      });
    });

    it('parses deepObject parameters which is an object containing an array', () => {
      configure(app, { hailMary: true });

      expect(parser("string[a]=[1, 'name']")).toEqual({
        string: { a: [1, 'name'] }
      });
    });

    it('parses deepObject array parameters which are arrays of objects of every primitive type', () => {
      configure(app);

      expect(parser('object[a]={ "string": "a" }&object[a]={ "number": "1" }&object[a]={ "float": "1.11" }&object[a]={ "boolean": "true" }&object[a]={ "null": "null" }&object[a]={ "undefined": "undefined" }')).toEqual({
        object: { a: [{ string: 'a' }, { number: 1 }, { float: 1.11 }, { boolean: true }, { null: null }, { undefined: undefined }] }
      });
    });
  });
});
