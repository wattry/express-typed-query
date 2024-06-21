import { TValue, ICheck } from "./types";

export const objectRegex: RegExp = /{[\s\S]*}/m;
export const arrayRegex: RegExp = /\[[\s\S]*\]/m;
export const quoteMatcherRegex: RegExp = /"|'/g;
export const quoteReplacerRegex: RegExp = /((\d+(\.\d+)?)|\w+)/g;

function isNumber(value: TValue) {
  const number = Number.parseFloat(value as string);

  if (!Number.isNaN(number) && isFinite(value as number)) {
    return true;
  }

  return false;
}

function isString(value: TValue): value is string {
  return typeof value === 'string';
}

function isBoolean(value: string | boolean): boolean {
  if (isString(value as string)) {
    const string = value as string;

    return (string.toLowerCase() === 'true' || string.toLowerCase() === 'false')
  } else {
    return value === true || value === false;
  }
}

function isDate(value: TValue): boolean {
  if (isString(value)) {
    const date = new Date(value);

    return date instanceof Date && !Number.isNaN(date.getTime());
  }
  return false;
}

function isFunction(value: TValue): boolean {
  return typeof value === 'function';
}

function isArray(value: TValue): boolean {
  return value instanceof Array || Object.prototype.toString.call(value) === '[object Array]' || Array.isArray(value);
}

function isJson(value: TValue): boolean {
  if (isString(value)) {
    const trimmed = value.trim() as string;

    return objectRegex.test(trimmed) || arrayRegex.test(trimmed);
  }

  return false;
}

function isObject(value: TValue): boolean {
  return !(value === null) && value instanceof Object && Object.prototype.toString.call(value) === '[object Object]';
}

export default {
  objectRegex,
  arrayRegex,
  quoteMatcherRegex,
  quoteReplacerRegex,
  isNumber,
  isString,
  isBoolean,
  isDate,
  isFunction,
  isArray,
  isObject,
  isJson
} as ICheck; 