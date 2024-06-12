import check, { qsArrayRegex, qsDeepObjectRegex} from './check';
import { Logger, Dates, HailMarry } from './types';

export default function Parser(logger: Logger, dates: Dates, hailMary: HailMarry) {
  function parseQsArray(qsKey: string, entries: string[], deepObject: any) {
    const isDeepObject = qsKey.match(qsDeepObjectRegex);

    if (isDeepObject) {
      const normalizedKey = qsKey.replace(qsDeepObjectRegex, '');

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, keys] = isDeepObject;

      for (const key of keys) {
        if (deepObject[key]) {
          continue;
        }

        deepObject[key] = parse(entries);
      }

      return { key: normalizedKey, values: deepObject, isDeepObject: true };
    }

    const normalizedKey = qsKey.replace(qsArrayRegex, '');

    return { key: normalizedKey, values: parse(entries) };
  }

  function parseQs(key: string, values: any, query: any, deepObject: any) {
    // There are be multiple entries for the same key.
    if (values.length > 1 || check.isQsStructure(key)) {
      const qsEntry = parseQsArray(key, values, deepObject);
      logger.trace('arrayKey', qsEntry);
      if (qsEntry.isDeepObject) {
        logger.trace('isDeepObject');

        query[qsEntry.key] = query[qsEntry.key] ? { ...query[qsEntry.key], ...qsEntry.values } : qsEntry.values;
      } else {
        logger.trace('shallow qs');
        query[qsEntry.key] = qsEntry.values;
      }
    } else {
      const result = parse(values[0]);
      query[key] = result;
    }
  }

  function parse(value: any): any {
    const isNumber = check.isNumber(value);

    if (isNumber) {
      logger.trace('isNumber', value);
      // Interestingly if an array of numbers is provided it will be parsed to the first entry.
      // So for single entry arrays we can use the return.
      const parsed = Number.parseFloat(value);
      const isArray = check.isArray(value);

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

    return parseObjectOrString(value);
  }

  function parseArray(value: any[]): any[] {
    return value.map((val: any) => parse(val));
  }

  function parseObject(value: any) {
    return JSON.parse(value, (_, value) => parse(value));
  }

  function parseObjectOrString(value: any) {
    // Check if it contains an opening and closing array or object
    // brackets and try parse it to a javascript object.
    // If it is not parsable it will throw an error.
    const isJson = check.isJson(value);
    const isObject = check.isObject(value);
    try {
      if (isJson || isObject) {
        logger.trace('isJson', value);

        return parseObject(value);
      }

      // Is a string or a JS object
      return value;
    } catch (error: any) {
      // If it appears to be a JSON string but is not properly formed we'll need to throw an error.
      if (hailMary && isJson) {
        logger.warn('Performing risky Hail Mary');
        try {
          // Remove all quotes and wrap all keys and values in double quotes.
          const lastAttempt = value
            .replace(/"|'/g, '')
            .replace(/((\d+(\.\d+)?)|\w+)/g, '"$1"');

          return parseObject(lastAttempt);
        } catch (err: any) {
          logger.error('Malformed JSON query', err.message, err.stack);

          throw new Error(`Invalid JSON in query: ${err.message}`);
        }
      } else {
        logger.trace('isObject', value);

        return value;
      }
    }
  }

  return { parseQs };
}