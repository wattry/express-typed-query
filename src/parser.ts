import check from './check';
import { Logger, DeepObject, Dates } from './types';

export function Parser(logger: Logger, deepObject: DeepObject, dates: Dates) {
  function parseArray(value: any[]): any[] {
    return value.map((val: any) => parse(val));
  }

  function parseObject(value: any) {
    const keys: any[] = Object.keys(value);
    const object: { [k: string ]: any } = {};

    for (const key of keys) {
      const val = value[key];

      object[key] = parse(val);
    }

    return object;
  }

  function parseObjectOrStringOrDate(value: any) {
    // Check if it contains an opening and closing array or object
    // brackets and try parse it to a javascript object.
    // If it is not parsable it will throw an error.
    try {
      if (check.isJsonString(value)) {
        logger.trace('isJsonString', value);
        const js = JSON.parse(value);

        return deepObject ? parseObject(js) : js;
      } else if (check.isJsonObject(value)) {
        logger.trace('isJsonObject', value);

        return deepObject ? parseObject(value) : JSON.parse(JSON.stringify(value))
      }

      if (dates && check.isDate(value)) {
        logger.trace('parsing dates', value);

        return new Date(value);
      }

      return value;
    } catch (error: any) {
      logger.error('An error occurred parsing JSON query', error.message, error.stack);

      if (dates && check.isDate(value)) {
        logger.trace('parsing dates', value);
        return new Date(value);
      }

      logger.trace('isString', value);
      return value;
    }
  }

  function parse(value: any) {
    const number = Number.parseFloat(value);

    if (!isNaN(number) && isFinite(value)) {
      logger.trace('isNumber', value);
      return number;
    }

    if (check.isBoolean(value)) {
      logger.trace('isBoolean', value);

      return value.toString().toLowerCase() === 'true';
    }

    if (value === 'null' || value === null) {
      logger.trace('isNull', value);

      return null;
    }

    if (value === 'undefined' || value === undefined) {
      logger.trace('isUndefined', value);

      return undefined;
    }

    if (check.isArray(value)) {
      logger.trace('isArray', value);

      return parseArray(value);
    }

    return parseObjectOrStringOrDate(value);
  }

  return parse;
}