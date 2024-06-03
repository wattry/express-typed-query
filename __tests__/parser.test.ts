import { parser } from "../src/parser";

const app = {
  set(name, callback) {
    this.run = callback;
  }
};
configureQueryParser(app);

describe('configureQueryParser', () => {
  test('it successfully parses all primitive types', () => {
    const date = new Date();
    // eslint-disable-next-line max-len
    const query = `string=string&true=true&false=false&number=1&float=1.11&null=null&undefined=undefined&date=${date.toISOString()}`;

    expect(app.run(query)).toEqual({
      string: 'string',
      true: true,
      false: false,
      number: 1,
      float: 1.11,
      null: null,
      undefined,
      date: date.toISOString()
    });
  });

  test('it successfully parses array of strings', () => {
    const result = app.run('string=one&string=two');

    expect(result).toEqual({
      string: ['one', 'two']
    });
  });

  test('it successfully parses array of numbers', () => {
    const result = app.run('number=1&number=2');

    expect(result).toEqual({
      number: [1, 2]
    });
  });

  test('it successfully parsesmultiple floats', () => {
    const result = app.run('float=1.11&float=2.22');

    expect(result).toEqual({
      float: [1.11, 2.22]
    });
  });

  test('it successfully parses multiple booleans', () => {
    const result = app.run('boolean=true&boolean=false');

    expect(result).toEqual({
      boolean: [true, false]
    });
  });

  test('it successfully parses an object with all types', () => {
    // eslint-disable-next-line max-len
    const query = 'filter={"string": "string", "boolean": true, "number": 1, "float": 1.11, "null": null, "array": ["string", true, 1, 1.11, null] }';
    const result = app.run(query);

    expect(result).toEqual({
      filter: {
        string: 'string',
        boolean: true,
        number: 1,
        float: 1.11,
        null: null,
        array: ['string', true, 1, 1.11, null]
      }
    });
  });
});
