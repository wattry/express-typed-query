# Express Typed Query

Exhausted from double checking types passed to your data layer? Well this simple package leverages the power of [qs](https://github.com/ljharb/qs) and parses your query sting to usable types. Use real types when exchanging parameters without JSON serialization. Make sure your users can get the data they need in the most flexible way possible.
Converts query strings to Javascript typed objects including dates and malformed JSON

## Install

npm
```
npm install express-typed-query
```

yarn
```
yarn add express-typed-query
```

pnpm
```
pnpm add express-typed-query
```

## Usage

```javascript
import express from 'express';
import eqs from 'express-typed-query';

const app = express();

eqs.configure(app, options);
```

```javascript
import express from 'express';
import eqs from 'express-typed-query';

const app = express();

eqs(app, options);
```

```javascript
import express from 'express';
import { configure } from 'express-typed-query';

const app = express();

configure(app, options);
```

```javascript
const express = require('express');
const { configure } = require('express-typed-query');

const app = express();

configure(app, options);
```

```javascript
const express = require('express');
const eqs = require('express-typed-query');

const app = express();

eqs.default(app, options);
```
## Options ([IOptions](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#L72))

## Global vs Middleware ([TGlobal](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#56))

The global pattern is used by default which will implement the query parser as a function using the set and get methods on the Express app object. Keep in mind that this config must occur before
any app.use calls.

This will only allow you to disable keys at a global level. If you have keys for specific endpoints,
whose key/value pairs should not be parsed you'll have to set the global option to false.

See [examples/global.ts](./examples/global.ts) for examples run `pnpm run serve-global`

When disabling the global parser, you'll need to register routes that will be ignored. See the [examples/override.ts](./examples/override.ts) for override examples.
`pnpm run serve-override`

### middleware ({ global: false }) ([TMiddlewareOption](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#L70))

When disabling the global options this will allow you to register a middleware or several middlewares to run before the query is parsed.

### qsOptions ([TQsParseOptions](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#L57))

If you'd like to override the qs parser's behavior you can use this option which

### Logger
This package uses JavaScript console logging by default. You can provide a log level to adjust what is logged using the log level option. The default level is "error" if no option is provided.

#### Level ([TLevel](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#L52))

Setting the log level

```javascript
const options = { logging: { level: 'debug' } };
```

#### logString ([TLogString](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#L53))

You can provide a string or function that will be prepended to all logs output by this module. The default log string function is

```ts
const options = {
  logging: {
    level: (logLevel: string) => `${new Date().toISOString()} [${logLevel.toUpperCase()}] -`
  }
};
```

#### tag ([TTag](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#L50))

By default tagging is off. If you'd like to distinguish logs created by this package pass the tag logging option. This will prepend '<etq>' to the front of all log messages output by the package.

```ts
const options = {
  logging: {
    tag: true
  }
};
```

### logger ([ILogger](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#L41))

If you'd like to provide your own logger. This will override all of the prior logging settings set. It must have the following level methods in order of precedence:

```txt
error 0
warn  1
info  2
debug 3
trace 4
```

```javascript
const options = { logging: { logger: <Logger> } };
```

### Dates ([TDates](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#L49))

If you'd like dates to be parsed from strings you can use the following option

```javascript
const options = { dates: true };
```

This option will try parse date strings that are parsable into date objects.

### Hail Mary ([THailMary](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#L55))

Sometimes complex JSON queries may have mistakes or incorrect quotes. Using the hailMary flag will try replace all quotes in a string that appears to contain JSON and attempt to parse it. 
This operation is risky as it makes assumptions regarding the string. If it fails an error will be thrown indicating it was unable to be parsed.

If the hailMary flag is not set the original string will be parsed back and error handling will be required by the caller.

```javascript
const options = { hailMary: true };

Input
const qs = 'filter={string: "string", boolean: true, number: 1, float: 1.11, null: null, array: ["string", true, 1, 1.11, null] }';

Output
const output = { filter: {
  string: 'string',
  boolean: true,
  number: 1,
  float: 1.11,
  null: null,
  array: [
    'string',
    true,
    1,
    1.11
  ]
}}
```

### disable ([TDisable](https://github.com/wattry/express-typed-query/blob/main/src/types.ts#L58))

In some cases we have keys that should always remain in the type they are set. For example when using a q parameter ?q="1234" that would be parsed to a number and when searching on a text field we'd run into issues. You can pass in an array of keys to instruct the parser to disable parsing and return the original value at
a global level.

```ts
const options: Options = { disable: ['q'] };
```

## Parameter Parsing

Utilizing terms from the [Open API 3.1.0 spec](https://swagger.io/specification/#parameter-object), this module will parse form and deepObjects using the explode settings to convert each to their respective representation.

### Repeated Keys keys=x&keys=y

Primitive types with repeated keys will be parsed to their associated type for instance

```javascript
Input
'?id=1&id=2&name=John&name=Doe'

Output
{
  id: [1, 2],
  name: ["John", "Doe"]
}
```

### Array Keys keys[]=x&key[]=y

This format ensures a key/value intended to be an array will be interpreted as such.

```javascript
Input
'?id[]=1&name[]=John'

Output
{
  id: [1],
  name: ["John"]
}
```

If we use the repeated key syntax and the API is expecting an array as in the following example:

```javascript
Input
'?id=1&name=John'

Output
{
  id: 1,
  name: "John"
}
```

It results in more processing by the route to handle the case where the data layer is expecting an array.

### Deep Objects

Leveraging Open API terminology again, we can nest arrays of objects as follows

```javascript
Input
'?user[a]={ "id": 1, name: "John" }'

Output
{ user: { a: { id: 1, name: 'John' } }}
```