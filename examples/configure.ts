import express from 'express';

import * as etq from '../src/index';
import { IOptions } from '../src/types';

export function configure(options: IOptions) {
  const app = express();

  // If the global implementation is going to be used, this must happen before the app object has any modifications. 
  // Otherwise the default 'query string' parser will be used.
  etq.configure(app, options);
  app.use(express.json({ limit: '1MB' }));
  app.use(express.urlencoded({ limit: '1MB', extended: true }));

  return app;
}