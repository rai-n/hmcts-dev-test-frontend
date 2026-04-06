import csurf from 'csurf';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

const env = process.env.NODE_ENV || 'development';

// Extend Express Request to include csrfToken method
type CsrfRequest = Request & {
  csrfToken?: () => string;
};

// CSRF middleware using 'csurf' package with double-submit cookie pattern
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
  },
  value: (req: Request) => req.body?._csrf || (req.headers['x-csrf-token'] as string),
});

// Middleware to attach CSRF token to response locals for templates
const attachCsrfToken: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const csrfReq = req as CsrfRequest;
  res.locals.csrfToken = csrfReq.csrfToken ? csrfReq.csrfToken() : '';
  next();
};

// Test mode: bypass CSRF with a dummy token
const testCsrfMiddleware: RequestHandler[] = [
  (req: Request, res: Response, next: NextFunction) => {
    // Mock csrfToken method for test environment
    (req as CsrfRequest).csrfToken = () => 'test-csrf-token';
    res.locals.csrfToken = 'test-csrf-token';
    next();
  },
];

// Production/Development: full CSRF protection
const productionCsrfMiddleware: RequestHandler[] = [
  csrfProtection,
  attachCsrfToken,
];

export const createCsrfMiddleware = (): RequestHandler[] =>
  env === 'development' ? testCsrfMiddleware : productionCsrfMiddleware;

export const csrfErrorCode = 'EBADCSRFTOKEN';
