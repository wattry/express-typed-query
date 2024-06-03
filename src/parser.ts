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

      logger.trace('isString', value);
      return value;
    }
  }

  function parse(value: any) {
    const isNumber = check.isNumber(value);

    if (isNumber) {
      logger.trace('isNumber', value);
      // Interestingly if an array of numbers is provided it will be parsed to the first entry.
      // So for single entry arrays we can use the return.
      const parsed = Number.parseFloat(value);
      const isArray = check.isArray(value);
      logger.trace('isArray', isArray);

      return isArray ? [parsed] : parsed;
    }

    if (dates && check.isDate(value)) {
      logger.trace('parsing dates', value);

      return new Date(value);
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