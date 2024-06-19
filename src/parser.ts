import check from './check';
import { TLogArg, TValue, IAnyObject, TValueArray, TLogArgs, TParser, IPopulatedOptions, IRules } from './types';

export function Parser(options: IPopulatedOptions, rules: IRules): TParser {
  const { logger, ignore, hailMary, dates } = options;

  function parse(
    value: TValue | TValueArray
  ): TValue | TValueArray {

    // Must happen before the number and date checks
    if (check.isArray(value as TValue)) {
      logger.debug('isArray', value as TLogArg);

      return parseArray(value as TValueArray);
    }

    // Number.parseFloat will parse the first number in an array so we must check arrays first
    if (check.isNumber(value as TValue) && rules.isNumber(value as TValue)) {
      logger.debug('isNumber', value as TLogArg);


      if (check.isString(value as string)) {
        const parsed = Number.parseFloat(value as string);

        return parsed;
      }

      return value;
    }

    if (check.isBoolean(value as string | boolean) && rules.isBoolean(value as TValue)) {
      logger.debug('isBoolean', value as TLogArg);

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

    return parseObjectOrString(value as IAnyObject | string);
  }

  function parseArray(value: TValueArray): TValueArray {
    const mapFunction = (val: TValue): TValue | TValueArray => parse(val as TValue | TValueArray);

    return value.map(mapFunction) as TValueArray;
  }

  function parseJsonString(value: string): IAnyObject {
    const jsonParser = (key: string, val: TValue) => ignore.has(key)
      ? val
      : parse(val as TValue);

    return JSON.parse(value, jsonParser) as IAnyObject;
  }

  function parseObject(value: IAnyObject) {
    const object: IAnyObject = {};

    for (const [key, val] of Object.entries(value as IAnyObject)) {

      object[key] = ignore.has(key)
        ? val
        : parse(val as TValue | TValueArray);
    }

    return object;
  }

  function parseQuotes(value: string): string {
    return value
      .replace(check.quoteMatcherRegex, '')
      .replace(check.quoteReplacerRegex, '"$1"');
  }

  function replace(string: string, args: TLogArgs): string {
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
  function handleJsonParserError(error: { message: string }, value: string): TLogArg {
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

  function parseObjectOrString(value: TValue) {
    // Check if it contains an opening and closing array or object
    // brackets and try parse it to a javascript object.
    // If it is not parsable it will throw an error.
    try {
      if (check.isJson(value)) {
        logger.debug('isJson', value as TLogArg);

        return parseJsonString(value as string);
      } else if (check.isObject(value)) {
        return parseObject(value as IAnyObject);
      }

      // new Date() will throw an error when non-date strings are provided so let's leave this as the last check before we return a string.
      if (dates && check.isDate(value as TValue) && rules.isDate(value as TValue)) {

        logger.debug('isDate', value as TLogArg);

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
          const result: IAnyObject = parseJsonString(parsedJson);

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

  return parse as TParser;
}