import * as path from 'path';

import { HTTPError } from './HttpError';
import { Nunjucks } from './modules/nunjucks';
import { createCsrfMiddleware } from './modules/csrf';

import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import { glob } from 'glob';
import favicon from 'serve-favicon';

const { setupDev } = require('./development');

const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';

export const app = express();
app.locals.ENV = env;

new Nunjucks(developmentMode).enableFor(app);

app.use(favicon(path.join(__dirname, '/public/assets/images/favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(createCsrfMiddleware());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
  next();
});

// fixing build issue 
glob
  .sync('src/main/routes/**/*.+(ts|js)')
  .map(filename => require('./' + path.relative('src/main', filename)))
  .forEach(route => route.default(app));

setupDev(app, developmentMode);

// CSRF error handler
app.use((err: HTTPError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message === 'invalid csrf token') {
    res.status(403);
    res.render('error', { message: 'Invalid CSRF token' });
    return;
  }
  next(err);
});

// error handler
app.use((err: HTTPError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = env === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});
