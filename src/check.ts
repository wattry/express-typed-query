export const objectRegex = /{[\s\S]*}/gm;
export const arrayRegex = /\[[\s\S]*\]/gm;
export const qsArrayRegex: RegExp = /\[\]$/gm;
export const qsDeepObjectRegex: RegExp = /\[([a-zA-Z])\]$/;

function isQsArray(key: string) {
  return qsArrayRegex.test(key);
}

function isQsDeepObject(key: string) {
  return qsDeepObjectRegex.test(key);
}

function isQsStructure(key: string) {
  return isQsArray(key) || isQsDeepObject(key);
}

function isNumber(value: any) {
  const number = Number.parseFloat(value);

  if (!Number.isNaN(number) && isFinite(value)) {
    return true;
  }

  return false;
}

function isString(value: any): boolean {
  return typeof value === 'string';
}

function isBoolean(value: any): boolean {
  if (isString(value)) {
    return (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
  } else {
    return value === true || value === false;
  }
}

function isDate(value: any): boolean {
  try {
    new Date(value).toISOString();

    return true
  } catch (error: any) {
    return false;
  }
}

function isFunction(value: any): boolean {
  return typeof value === 'function';
}

function isArray(value: any): boolean {
  return value instanceof Array || Object.prototype.toString.call(value) === '[object Array]' || Array.isArray(value);
}

function isJson(value: any): boolean {
  if (isString(value)) {
    const trimmed = value.trim();

    return objectRegex.test(trimmed) || arrayRegex.test(trimmed);
  }

  return false;
}

function isObject(value: any): boolean {
  return !(value === null) && value instanceof Object && Object.prototype.toString.call(value) === '[object Object]';
}

export default {
  isQsArray,
  isQsDeepObject,
  isQsStructure,
  isNumber,
  isString,
  isBoolean,
  isDate,
  isFunction,
  isArray,
  isObject,
  isJson
};