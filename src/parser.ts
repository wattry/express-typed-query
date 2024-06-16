import check from './check';
import { Logger, Dates, HailMary, LogArg, Value, AnyObject, ValueArray, LogArgs } from './types';

export function Parser(logger: Logger, dates: Dates, hailMary: HailMary) {
  function parse(value: Value | ValueArray): Value | ValueArray {
    // Must happen before the number and date checks
    if (check.isArray(value as Value)) {
      logger.debug('isArray', value as LogArg);

      return parseArray(value as ValueArray);
    }

    // Number.parseFloat will parse the first number in an array so we must check arrays first
    if (check.isNumber(value as Value)) {
      logger.debug('isNumber', value as LogArg);


      if (check.isString(value as string)) {
        const parsed = Number.parseFloat(value as string);

        return parsed;
      }

      return value;
    }

    if (check.isBoolean(value as string | boolean)) {
      logger.debug('isBoolean', value as LogArg);

      return (value as string).toString().toLowerCase() === 'true';
    }

    if (value === 'null' || value === null) {
      logger.debug('isNull', value);

      return null;
    }

    if (value === 'undefined' || value === undefined) {
      logger.debug('isUndefined', value);

      return undefined;
    }

    return parseObjectOrString(value as AnyObject | string);
  }

  function parseArray(value: ValueArray): ValueArray {
    const mapFunction = (val: Value): Value | ValueArray => parse(val as Value | ValueArray);

    return value.map(mapFunction) as ValueArray;
  }

  function parseJsonString(value: string): AnyObject {
    const jsonParser = (_: unknown, val: Value) => parse(val as Value);

    return JSON.parse(value, jsonParser) as AnyObject;
  }

  function parseObject(value: AnyObject) {
    const object: AnyObject = {};

    for (const [key, val] of Object.entries(value as AnyObject)) {
      object[key] = parse(val as Value | ValueArray);
    }

    return object;
  }

  function parseQuotes(value: string): string {
    return value
      .replace(check.quoteMatcherRegex, '')
      .replace(check.quoteReplacerRegex, '"$1"');
  }

  function replace(string: string, args: LogArgs): string {
    let i = 0;

    return string.replace(/%s/g, (): string => {
      const arg = args[i];
      i += 1;

      return arg as string;
    }) as string;
  }

  /**
   * Tries to locate the offending location to underline the issue.
   * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/JSON_bad_parse
   */
  function handleJsonParserError(error: { message: string }, value: string): LogArg {
    const hasPositions = error.message.indexOf('position');

    // If the error is a JSON parsing error we want to illustrate where the issue is.
    if (hasPositions > 0) {
      const parsedJson = parseQuotes(value);
      const [, location]: string[] = error.message.substring(hasPositions, error.message.length).split(' ');

      // Get everything before the offending entry.
      const previous = parsedJson.substring(0, parseInt(location, 10));
      // Find the first instance of a space, denoting the beginning of the offending entry.
      const lastSpace = previous.lastIndexOf(' ') + 1;
      // Get the offending entry.
      const offender = parsedJson.substring(lastSpace, parseInt(location, 10));
      // If there is an Expected in the message we want to capture the character provided
      const expected: RegExpMatchArray | null = error.message.match(/'(.*.)'/)

      if (expected) {
        const [, char]: string[] = expected;
        const args = [offender, char, offender];

        return replace(
          `Malformed JSON query - ${error.message}: Expected %s\x1b[4m%s\x1b[0m Received %s\x1b[4m \x1b`,
          args
        );
      }

      // If if we have a position

      const underlineString = parsedJson.substring(parseInt(location, 10), parsedJson.length);
      const errorLocation = parsedJson.replace(underlineString, `\x1b[4m${underlineString}\x1b`);

      return `Malformed JSON query - ${error.message}: ${errorLocation}`;
    }

    return error.message;
  }

  function parseObjectOrString(value: Value) {
    // Check if it contains an opening and closing array or object
    // brackets and try parse it to a javascript object.
    // If it is not parsable it will throw an error.
    try {
      if (check.isJson(value)) {
        logger.debug('isJson', value as LogArg);

        return parseJsonString(value as string);
      } else if (check.isObject(value)) {
        return parseObject(value as AnyObject);
      }

      // new Date() will throw an error when non-date strings are provided so let's leave this as the last check before we return a string.
      if (dates && check.isDate(value as Value)) {

        logger.debug('isDate', value as LogArg);

        return new Date(value as string);
      }

      // At this point we know this a string as all other type checks have been skipped over.
      logger.debug('isString');
      return value;
    } catch (error: unknown) {
      // If it appears to be a JSON string but is not properly formed we'll need to throw an error.
      if (hailMary) {
        logger.warn('Performing Hail Mary');
        try {
          // Remove all quotes and wrap all keys and values in double quotes.
          const parsedJson: string = parseQuotes(value as string);
          const result: AnyObject = parseJsonString(parsedJson);

          logger.debug('Hail Mary success');
          return result;
        } catch (err: unknown) {
          const jsonError = err as SyntaxError | Error;
          const message = err instanceof SyntaxError
            ? handleJsonParserError(jsonError, value as string)
            : jsonError.message;

          logger.error('Hail Mary failed:', message);

          throw new Error(message as string);
        }
      }

      const jsonError = error as SyntaxError | Error;
      const message = error instanceof SyntaxError
        ? handleJsonParserError(jsonError, value as string)
        : jsonError.message;

      logger.error('Parsing JSON failed', message);
      throw new Error(message as string);
    }
  }

  return parse;
}