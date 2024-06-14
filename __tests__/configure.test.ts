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
import check from '../src/check';

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
const BASE = { string: "string", boolean: true, number: 1, float: 1.11, null: null, undefined: undefined };
const stringifyValues = (_: any, value: any) => {
  if (value === undefined) {
    return undefined;
  }
  return !check.isString(value) && !check.isObject(value) ? `${value}` : value
};
const parseQs = (array: any[]) => array.map((entry) => entry[1] ? entry.join('=') : `${entry[0]}=${entry[1]}`).join('&');
const parser = (qs: any) => app.get(setString)(qs);

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
    it('it throws when app is not passed', () => {
      expect(() => configure())
        .toThrowError('express app required');
    });

    it('it throws when app is not an express app', () => {
      expect(() => configure({}))
        .toThrowError('express app parameter does not contain set property');
    });

    it('it throws when the JSON is unparsable with the hailMary option', () => {
      configure(app, { hailMary: true });

      const qs = 'filter={string: "string", boolean: "true", number: "1", float: "1.11", null: "null", array: { "string", true", "1", "1.11", "null"} }';

      expect(() => parser(qs))
        .toThrowError('Malformed JSON query: Expected "string"\x1b[4m:\x1b[0m Received "string"\x1b[4m \x1b at position 107');
    });

    it('it replaces all quotes and tries to parse the entries with the hailMary option', () => {
      configure(app, { hailMary: true });

      const qs = 'filter={string: "string", \'boolean\': true", number: \'1", float: "1.11", null: "null", array: ["string", true", "1", "1.11", "null"] }';
      const expected = { filter: { ...JSON.parse(JSON.stringify(BASE)), array: Array.from(Object.values(BASE)) } };

      expect(parser(qs)).toEqual(expected);
    });

    it('it tries to parse the string to json as a last ditch attempt', () => {
      configure(app, { hailMary: true });

      const qs = 'filter={string: string, boolean: true, number: 1, float: 1.11, null: null, array: [string, true, 1, 1.11, null, undefined] }';
      const expected = { filter: { ...JSON.parse(JSON.stringify(BASE)), array: Array.from(Object.values(BASE)) } };

      expect(parser(qs)).toEqual(expected);
    });
  });

  describe('success', () => {
    it('it returns an empty query when the string is not trimmed and is empty', () => {
      configure(app);

      expect(parser(' '))
        .toEqual({});
    });

    it('it returns an empty query when q param is an empty string', () => {
      configure(app);

      expect(parser('q= '))
        .toEqual({ q: '' });
    });

    it('sets a query parser', () => {
      expect(configure(app)).toBeUndefined();
      expect(app.set).toHaveBeenCalledWith(setString, expect.any(Function));
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

    it('it parses every type with a simple query string', () => {
      configure(app);

      const date = new Date();
      const isoDate = date.toISOString();

      expect(parser(parseQs(Object.entries({ ...BASE, date: isoDate }))))
        .toEqual({
          date: isoDate,
          boolean: true,
          string: 'string',
          number: 1,
          float: 1.11,
          null: null,
          undefined: undefined
        });
      expect(app.get).toHaveBeenCalledWith(setString);
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

    it('it parses every type with a dates', () => {
      configure(app, { dates: true });

      const date = new Date();
      const isoDate = date.toISOString();
      const qs = parseQs(Object.entries({ ...BASE, date: isoDate }));

      expect(parser(qs)).toEqual({ ...BASE, date: date });
    });

    it('parses multiple strings unexploded', () => {
      configure(app);

      expect(parser('string[]=one&string[]=two')).toEqual({
        string: ['one', 'two']
      });
    });

    it('parses unexploded parameters which are string arrays', () => {
      configure(app);

      expect(parser('string[]=one')).toEqual({
        string: ['one']
      });
    });

    it('parses unexploded deepObject parameters which are any type of array', () => {
      configure(app);

      expect(parser('string[a]=one&string[a]=3&string[a]=true&string[a]=1.11&string[a]=null&string[b]=two&string[b]=4&string[b]=false&string[b]=2.22&string[b]=null')).toEqual({
        string: { a: ['one', 3, true, 1.11, null], b: ['two', 4, false, 2.22, null] }
      });
    });

    it('parses unexploded parameters with multiple nested objects', () => {
      configure(app);

      expect(parser('string[a]=1&string[b]=2&string[c]=3')).toEqual({
        string: { a: 1, b: 2, c: 3 }
      });
    });

    it('parses unexploded deepObject parameters of objects', () => {
      configure(app);

      expect(parser('string[a]={ "id": 1, "name": "name" }')).toEqual({
        string: { a: { id: 1, name: 'name' } }
      });
    });

    it('parses unexploded deepObject parameters of objects with a hailMary double quotes', () => {
      configure(app, { hailMary: true });

      expect(parser('string[a]={ id: 1, name: "name" }')).toEqual({
        string: { a: { id: 1, name: 'name' } }
      });
    });

    it('parses unexploded deepObject parameters of objects with a hailMary single quotes', () => {
      configure(app, { hailMary: true });

      expect(parser("string[a]={ id: 1, name: 'name' }")).toEqual({
        string: { a: { id: 1, name: 'name' } }
      });
    });

    it('parses unexploded deepObject plain array', () => {
      configure(app, { hailMary: true });

      expect(parser("string[a]=[1, 'name']")).toEqual({
        string: { a: [1, 'name'] }
      });
    });

    it('parses unexploded deepObject parameters which are arrays of objects', () => {
      configure(app);

      expect(parser('object[a]={ "string": "a" }&object[a]={ "boolean": "true" }')).toEqual({
        object: { a: [{ string: 'a' }, { boolean: true }] }
      });
    });

    it('parses multiple exploded strings', () => {
      configure(app);

      expect(parser('string=one&string=two')).toEqual({
        string: ['one', 'two']
      });
      expect(debug).not.toHaveBeenCalled();
    });

    it('parses a single array unexploded string', () => {
      configure(app);

      expect(parser('string[]=one')).toEqual({
        string: ['one']
      });
      expect(debug).not.toHaveBeenCalled();
    });

    it('parses multiple strings with debug level logging', () => {
      configure(app, { logging: { level: 'debug' } });

      expect(parser('string=one&string=two')).toEqual({ string: ['one', 'two'] });
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
      expect(info).not.toHaveBeenCalled();
      expect(trace).not.toHaveBeenCalled();
    });

    it('parses multiple strings with trace level logging', () => {
      configure(app, { logging: { level: 'trace' } });

      expect(parser('string=one&string=two')).toEqual({ string: ['one', 'two'] });
      expect(debug).toHaveBeenCalledTimes(3);
    });

    it('parses multiple numbers', () => {
      configure(app);

      expect(parser('number=1&number=2')).toEqual({
        number: [1, 2]
      });
    });

    it('parses unexploded parameters which are number arrays', () => {
      configure(app);

      expect(parser('number[]=1')).toEqual({ number: [1] });
    });

    it('parses unexploded parameters which are an array with more than one number', () => {
      configure(app);

      expect(parser('number[]=1&number[]=2')).toEqual({ number: [1, 2] });
    });

    it('parses multiple floats', () => {
      configure(app);

      expect(parser('float=1.11&float=2.22')).toEqual({ float: [1.11, 2.22] });
    });

    it('parses unexploded parameters which are an array with one float', () => {
      configure(app);

      expect(parser('float[]=1.11')).toEqual({ float: [1.11] });
    });

    it('parses unexploded parameters which are an array with more than one float', () => {
      configure(app);

      expect(parser('float[]=1.11&float[]=2.22')).toEqual({ float: [1.11, 2.22] });
      expect(error).not.toHaveBeenCalled();
    });

    it('parses multiple booleans', () => {
      configure(app);

      expect(parser('boolean=true&boolean=false')).toEqual({
        boolean: [true, false]
      });
    });

    it('parses unexploded parameters which are an array with one boolean', () => {
      configure(app);

      expect(parser('boolean[]=true')).toEqual({ boolean: [true] });
    });

    it('parses unexploded parameters which are an array with more than one float', () => {
      configure(app);

      expect(parser('boolean[]=true&boolean[]=false')).toEqual({ boolean: [true, false] });
    });

    it('parses unexploded parameters which are an array with more than one float', () => {
      configure(app);

      expect(parser('boolean[]=true&boolean[]=false')).toEqual({ boolean: [true, false] });
    });

    it('parses unexploded deepObject parameters which are arrays of dates with a number', () => {
      configure(app, { dates: true });

      const now = Date.now();
      const isoNow = new Date(now).toISOString();
      const isoLater = new Date(now + 10000).toISOString();

      expect(parser(`date[]=${isoNow}&date[]=${isoLater}&number=1`)).toEqual({
        date: [new Date(now), new Date(isoLater)],
        number: 1
      });
    });

    it('parses unexploded deepObject parameters which are arrays of dates with a number', () => {
      configure(app, { dates: true });

      const now = Date.now();
      const isoNow = new Date(now).toISOString();
      const isoLater = new Date(now + 10000).toISOString();

      expect(parser(`date[a]=${isoNow}&date[a]=${isoLater}&number=1`)).toEqual({
        date: { a: [new Date(isoNow), new Date(isoLater)] },
        number: 1
      });
    });

    it('parses unexploded deepObject parameters which are arrays of dates with numbers', () => {
      configure(app, { dates: true });
      const now = Date.now();
      const isoNow = new Date(now).toISOString();
      const isoLater = new Date(now + 10000).toISOString();

      const qs = `date[a]={ "now": "${isoNow}" }&date[a]={ "later": "${isoLater}" }&number[b]=1`;
      expect(parser(qs)).toEqual({
        date: { a: [{ now: new Date(isoNow) }, { later: new Date(isoLater) }] },
        number: { b: 1 }
      });
    });
  });
});
