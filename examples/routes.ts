import { Request, Response, NextFunction, Router } from 'express';

import { configure } from './configure';
import etq from '../src/index';
import { exampleHandler } from './example-handler';

// Registering this middleware will execute it prior to calling the query parser middleware.
// This will only work when the etq instance is configured without the global option.
const before = (request: Request, response: Response, next: NextFunction) => {
  // @ts-ignore
  if (request?.user?.[request.path]?.auth) {
    next();
  } else {
    response.status(401).send('Unauthorized')
  }
};

const after = async (request: Request, response: Response, next: NextFunction) => {
  // @ts-ignore
  const user = request.user;
  const secret = request.query.secret;

  if (user?.[request.path]?.noAuthParams?.secret && secret) {
    response.status(403).send('parameter forbidden');
  } else {
    next();
  }
};

const app = configure({
  disable: ['q'],
  logging: { level: 'debug' },
  global: false,
  dates: true,
  middleware: [before, after]
});

const router = Router();
const disable = ['stringId', 'now'];

/* ************************************************************************************************
 *                         Do not register any ignored keys but use globals
 *
 * input: curl http://localhost:3000/route?q=01&id=01&stringId=01&now=2024-06-30T15:57:23.309Z&boolean=true
 * output: { q: '01', id: 1, stringId: 1 }
 * ***********************************************************************************************/
router.get('/routes', exampleHandler);

/* ************************************************************************************************
 *                                  Use globals by default
 * 
 * input: curl http://localhost:3000/route/disable?q=01&id=01&stringId=01&now=2024-06-30T15:57:23.309Z&boolean=true
 * output: {"q":"01","id":1,"stringId":"01","now":"2024-06-30T15:57:23.309Z","boolean":true}
 * ***********************************************************************************************/
etq.register(router.get('/routes/disable', exampleHandler), { disable });

/* ************************************************************************************************
 *                                  Disable global rules
 * 
 * input: curl http://localhost:3000/route/disable/global?q=01&id=01&stringId=01&now=2024-06-30T15:57:23.309Z&boolean=true
 * output: {"q":1,"id":1,"stringId":"01","now":"2024-06-30T15:57:23.309Z","boolean":true}
 * ***********************************************************************************************/
etq.register(router.get('/routes/disable/global', exampleHandler), { disable, global: false });


/* ************************************************************************************************
 *                                  Parse all keys
 * 
 * input:  curl http://localhost:3000/route/disable/all?q=01&id=01&stringId=01&now=2024-06-30T15:57:23.309Z&boolean=true
 * output: {"q":1,"id":1,"stringId":1,"now":"2024-06-30T15:57:23.309Z","boolean":true}
 * ***********************************************************************************************/
etq.register(router.get('/routes/disable/all', exampleHandler), { global: false });

app.use(router);

app.listen(3000);