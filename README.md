# Express Typed Query

No dependency module that converts query strings to Javascript typed objects with optional dates. Can be used in the browser and NodeJS.

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

eqs.configure(app, options);
```

## Options

### Logger
This package uses JavaScript console logging by default. You can provide a log level to adjust what is logged using the log level option. The default level is "error" if no option is provided.

```javascript
const options = { logging: { level: 'debug' } };
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
{ user: { a: [{ id: 1, name: 'John' }] }}
```