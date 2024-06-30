import { Request, Response, NextFunction, Router } from 'express';

import { configure } from './configure';
import { register } from '../src/index';
import { IAnyObject } from '../src/types';
import { exampleHandler } from './example-handler';

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

const router = Router();
const disable = ['stringId', 'now'];

/* ************************************************************************************************
 *                         Do not register any ignored keys but use globals
 *
 * input: curl http://localhost:3000/override?q=01&id=01&stringId=01&now=2024-06-30T15:57:23.309Z&boolean=true
 * output: { q: '01', id: 1, stringId: 1 }
 * ***********************************************************************************************/
router.get('/override', exampleHandler);

/* ************************************************************************************************
 *                                  Use globals by default
 * 
 * input: curl http://localhost:3000/override/disable?q=01&id=01&stringId=01&now=2024-06-30T15:57:23.309Z&boolean=true
 * output: {"q":"01","id":1,"stringId":"01","now":"2024-06-30T15:57:23.309Z","boolean":true}
 * ***********************************************************************************************/
register(router.get('/override/disable', exampleHandler), { disable });

/* ************************************************************************************************
 *                                  Disable global rules
 * 
 * input: curl http://localhost:3000/override/disable/global?q=01&id=01&stringId=01&now=2024-06-30T15:57:23.309Z&boolean=true
 * output: {"q":1,"id":1,"stringId":"01","now":"2024-06-30T15:57:23.309Z","boolean":true}
 * ***********************************************************************************************/
register(router.get('/override/disable/global', exampleHandler), { disable, global: false });


/* ************************************************************************************************
 *                                  Parse all keys
 * 
 * input:  curl http://localhost:3000/override/disable/all?q=01&id=01&stringId=01&now=2024-06-30T15:57:23.309Z&boolean=true
 * output: {"q":1,"id":1,"stringId":1,"now":"2024-06-30T15:57:23.309Z","boolean":true}
 * ***********************************************************************************************/
register(router.get('/override/disable/all', exampleHandler), { global: false });

app.use(router);

app.listen(3000);