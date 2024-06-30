import { Request, Response, NextFunction, Router } from 'express';

import { configure } from './configure';
import { IAnyObject } from '../src/types';

// Must be called before any other app.use otherwise express those 'use' calls will
// be registered higher in the stack than the parser.
const app = configure({ disable: ['q'], logging: { level: 'debug' }, dates: true });

const example = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const query: {
    now?: Date,
    stringId?: number,
    numberId?: number,
    q?: string,
    boolean?: boolean
  } = request.query;

  console.log('query.now is date?', query.now instanceof Date);
  console.log(query.now?.toLocaleString());
  console.log('query.stringId is?', typeof query.stringId);
  console.log('query.stringId is?', typeof query.numberId);
  console.log('query.q is?', typeof query.q);
  console.log('query.boolean is?', typeof query.boolean);
  
  response.send(query);
};

const router = Router();

/* ************************************************************************************************
 *                               Disable q at a global level
 * ***********************************************************************************************/

router.get('/global', example);

app.use(router);

app.listen(3000);