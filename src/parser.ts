import check from './check';
import { Logger, Dates, HailMary } from './types';

export function Parser(logger: Logger, dates: Dates, hailMary: HailMary) {
  function parse(value: any): any {
    const isNumber = check.isNumber(value);

    if (isNumber) {
      logger.debug('isNumber', value);
      // Interestingly if an array of numbers is provided it will be parsed to the first entry.
      // So for single entry arrays we can use the return.
      const parsed = Number.parseFloat(value);
      const isArray = check.isArray(value);

      return isArray ? [parsed] : parsed;
    }

    if (dates && check.isDate(value)) {
      logger.debug('parsing dates', value);

      return new Date(value);
    }

    if (check.isBoolean(value)) {
      logger.debug('isBoolean', value);

      return value.toString().toLowerCase() === 'true';
    }

    if (value === 'null' || value === null) {
      logger.debug('isNull', value);

      return null;
    }

    if (value === 'undefined' || value === undefined) {
      logger.debug('isUndefined', value);

      return undefined;
    }

    if (check.isArray(value)) {
      logger.debug('isArray', value);

      return parseArray(value);
    }

    return parseObjectOrString(value);
  }

  function parseArray(value: any[]): any[] {
    return value.map((val: any) => parse(val));
  }

  function parseJsonString(value: any) {
    return JSON.parse(value, (_, value) => parse(value));
  }

  function parseObject(value: any) {
    const object: any = {};

    for (const [key, val] of Object.entries(value)) {
      object[key] = parse(val);
    }

    return object;
  }

  function parseQuotes(value: any) {
    return value
      .replace(check.quoteMatcherRegex, '')
      .replace(check.quoteReplacerRegex, '"$1"');
  }

  function handleJsonParserError(error: any, value: string) {
    const hasPositions = error.message.indexOf('position');
    // If the error is a JSON parsing error we want to illustrate where the issue is.
    if (hasPositions > 0) {
      const parsedJson = parseQuotes(value);
      const [, location] = error.message.substring(hasPositions, parsedJson.length).split(' ');

      // Get everything before the offending entry.
      const previous = parsedJson.substring(0, location);
      // Find the first instance of a space, denoting the beginning of the offending entry.
      const lastSpace = previous.lastIndexOf(' ') + 1;
      // Get the offending entry.
      const offender = parsedJson.substring(lastSpace, location);
      // If there is an Expected in the message we want to capture the character provided
      const expected = error.message.match(/'(.*.)'/)

      if (expected) {
        const [, char] = expected;
        const args = [offender, char, offender, location];

        let i = 0;

        return `Malformed JSON query: Expected %s\x1b[4m%s\x1b[0m Received %s\x1b[4m \x1b at position %s`.replace(/%s/g, () => {
          const arg = args[i];
          i += 1;

          return arg;
        })
      }

      return offender;
    }

    return error.message;
  }

  function parseObjectOrString(value: any) {
    // Check if it contains an opening and closing array or object
    // brackets and try parse it to a javascript object.
    // If it is not parsable it will throw an error.
    const isJson = check.isJson(value);
    const isObject = check.isObject(value);

    try {
      if (isJson) {
        logger.debug('isJson', value);

        return parseJsonString(value);
      } else if (isObject) {
        return parseObject(value);
      }

      // Is a string or a JS object
      return value;
    } catch (error: any) {
      const message = handleJsonParserError(error, value);
      logger.warn(message, error.stack);

      // If it appears to be a JSON string but is not properly formed we'll need to throw an error.
      if (hailMary && isJson) {
        logger.warn('Performing Hail Mary');
        try {
          // Remove all quotes and wrap all keys and values in double quotes.
          const parsedJson = parseQuotes(value);
          const result = parseJsonString(parsedJson);

          logger.debug('Hail Mary success');
          return result;
        } catch (err: any) {
          const message = handleJsonParserError(err, value);

          logger.warn(message, err.stack);

          throw new Error(message);
        }
      }

      return value;
    }
  }

  return parse;
}