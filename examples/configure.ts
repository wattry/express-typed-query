import express from 'express';

import etq from '../src';
import { IOptions } from '../src/types';

export function configure(options: IOptions) {
  const app = express();

  if (options.global === false) {
    etq.init(app);
  }
  // If the global implementation is going to be used, this must happen before the app object has any modifications. 
  // Otherwise the default 'query string' parser will be used.
  app.use((req, res, next) => {
    const auth = {
      auth: true,
      noAuthParams: { secret: true }
    };

    // @ts-ignore
    req.user = {
      '/routes': auth,
      '/routes/disable': auth,
      '/routes/disable/global': auth,
      '/routes/disable/all': auth
    };

    next();
  });

  etq.configure(app, options);
  app.use(express.json({ limit: '1MB' }));
  app.use(express.urlencoded({ limit: '1MB', extended: true }));

  return app;
}