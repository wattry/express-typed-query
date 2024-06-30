import { Request, Response, NextFunction, Router } from 'express';

import { configure } from './configure';
import { register } from '../src/index';
import { IAnyObject } from '../src/types';

// Registering this middleware will execute it prior to calling the query parser middleware.
// This will only work when the etq instance is configured without the global option.
const middleware = (request: Request, response: Response, next: NextFunction) => {
  console.log('This is my middleware before query parsing:', request.query);

  next();
};

const app = configure({
  disable: ['q'],
  logging: { level: 'debug' },
  global: false,
  dates: true,
  middleware: middleware
});

// q=123345 woule be converted to a number so we want to treat it globally as a string.

const example = (request: Request, response: Response, next: NextFunction) => {
  const query = request.query as IAnyObject;

  console.log('query.now is date?', query.now instanceof Date);
  console.log(query.now?.toLocaleString());
  console.log('query.numberId is?', typeof query.id);
  console.log('query.stringId is?', typeof query.stringId);
  console.log('query.q is?', typeof query.q);
  console.log('query.boolean is?', typeof query.boolean);

  response.send(request.query);
};

const router = Router();
const disable = ['stringId', 'now'];

/* ************************************************************************************************
 *                         Do not register any ignored keys but use globals
 *
 * input: curl http://localhost:3000/override?q=01&id=01&stringId=01
 * output: { q: '01', id: 1, stringId: 1 }
 * ***********************************************************************************************/
router.get('/override', example);

/* ************************************************************************************************
 *                                  Use globals by default
 * 
 * input: curl http://localhost:3000/override/disable?q=01&id=01&stringId=01
 * output: { q: '01', id: 1, stringId: '01' }
 * ***********************************************************************************************/
register(router.get('/override/disable', example), { disable });

/* ************************************************************************************************
 *                                  Disable global rules
 * 
 * curl http://localhost:3000/override/disable/global?q=01&id=01&stringId=01
 * { q: 1, id: 1, stringId: '01' }
 * ***********************************************************************************************/
register(router.get('/override/disable/global', example), { disable, global: false });


/* ************************************************************************************************
 *                                  Parse all keys
 * 
 * input:  curl http://localhost:3000/override/disable/all?q=01&id=01&stringId=01
 * output: { q: 1, id: 1, stringId: '01' }
 * ***********************************************************************************************/
register(router.get('/override/disable/all', example), { global: false });

app.use(router);

app.listen(3000);