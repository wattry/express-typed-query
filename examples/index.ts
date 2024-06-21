import express, { Request, Response, NextFunction, Router } from 'express';

import { etq, register } from '../src/index';
import { TValue } from '../src/types';
const app = express();

// If a string starts with a 0 we don't want to parse it as it may be necessary.
const isNumber = (value: TValue) => !((value as string)?.[0] === '0');

etq(app, { ignore: ['q'], logging: { level: 'debug' }, global: false });

app.use(express.json({ limit: '10MB' }));
app.use(express.urlencoded({ limit: '10MB', extended: true }));

function example(request: Request, response: Response, next: NextFunction) {
  console.log(request.query);

  response.send(request.query);
}

const router = Router();

router
  .get('/test', register({ method: 'get', path: '/test', rules: { isNumber } }), example);

app.use(router);

app.listen(3000);