# Express Typed Query

Converts query strings to Javascript typed objects

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
This package uses JavaScript console logging by default. You can provide a log level to adjust what
is logged using the log level option. The default level is "error" if no option is provided.

```javascript
const options = { logging: { level: 'debug' } };
```

If you'd like to provide your own logger you can use the following.
It must have the following levels or aliases in order of precedence:

```
error 0
warn  1
info  2
debug 3
trace 4
```

The following is the default logging string you can override this by providing
a different function. The log level of the message will be passed to the callback.

```javascript
const options = { logging: { logString: (level) => `${new Date().toISOString()} [${level.toUpperCase()}] -` } };
```

If you'd like to provide your own logger you can use the following.
It must have the following levels or aliases in order of precedence:

```
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

This option will try parse string that are parsable into date objects.

### Deep Objects

By default this package will use JSON.parse to convert stringified objects to get types
if you need a deep conversion use this option to parse the string to a typed object.

```javascript
const options = { deepObject: true };

const query = 'filter={"string": "string", "boolean": "true", "number": "1", "float": "1.11", "null": "null", "array": ["string", "true", "1", "1.11", "null"] }'
```

#### Deep Object False
```javascript
const { query } = request;

{ filter:
    {
      string: 'string',
      boolean: 'true',
      number: '1',
      float: '1.11',
      null: 'null',
      array: [ 'string', 'true', '1', '1.11', 'null' ]
    }
  }
```

#### Deep Object True
```javascript
const { query } = request;

{ filter:
  {
    string: 'string',
    boolean: true,
    number: 1,
    float: 1.11,
    null: null,
    array: [ 'string', true, 1, 1.11, null ]
  }
}
```