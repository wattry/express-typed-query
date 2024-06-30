import { Router } from 'express';

import { configure } from './configure';
import { exampleHandler } from './example-handler';

// Must be called before any other app.use otherwise express those 'use' calls will
// be registered higher in the stack than the parser.
const app = configure({ disable: ['q'], logging: { level: 'debug' }, dates: true });

const router = Router();

/* ************************************************************************************************
 *                               Disable q at a global level
 * 
 * input: curl http://localhost:3000/global?q=01&id=01&stringId=01&now=2024-06-30T15:57:23.309Z&boolean=true
 * output: {"q":"01","id":1,"stringId":1,"now":"2024-06-30T15:57:23.309Z","boolean":true}
 * ***********************************************************************************************/

router.get('/global', exampleHandler);

app.use(router);

app.listen(3000);