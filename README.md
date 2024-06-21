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

## Options

### Logger
This package uses JavaScript console logging by default. You can provide a log level to adjust what is logged using the log level option. The default level is "error" if no option is provided.

#### Level (string)

Setting the log level

```javascript
const options = { logging: { level: 'debug' } };
```

#### logString (string|Function)

You can provide a string or function that will be prepended to all logs output by this module. The default log string function is

```ts
const options = {
  logging: {
    level: (logLevel: string) => `${new Date().toISOString()} [${logLevel.toUpperCase()}] -`
  }
};
```

#### tag (boolean)

By default tagging is off. If you'd like to distinguish logs created by this package pass the tag logging option.
This will prepend '<etq>' to the front of all log messages output by the package.

```ts
const options = {
  logging: {
    tag: true
  }
};
```

If you'd like to provide your own logger you can use the following. It must have the following levels or aliases in order of precedence:

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

### Dates

If you'd like dates to be parsed from strings you can use the following option

```javascript
const options = { dates: true };
```

This option will try parse date strings that are parsable into date objects.

### Hail Mary

Sometimes complex JSON queries may have mistakes or incorrect quotes. Using the hailMary flag will try replace all quotes
in a string that appears to contain JSON and attempt to parse it. This operation is risky as it makes assumptions regarding the
string. If it fails an error will be thrown indicating it was unable to be parsed.

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

### ignore (Map<string, boolean>)

In some cases we have keys that should always remain in the type they are set. For example when using a q parameter ?q="1234"
that would be parsed to a number and when searching on a text field we'd run into issues. You can pass in an array of keys to
instruct the parser to return the original value.

```ts
const options: Options = { ignore: ['q'] };
```


### rules ( { rules: IRules } )

In some cases we may want to treat some values differently, for examle we may have an id that is padded with leading 0's
hence it presents as a number

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