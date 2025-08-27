import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import uuid4 from 'uuid4';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.headers['x-request-id']?.toString() || uuid4();
      req.requestId = id;
      res.setHeader('X-Request-Id', id);
      next();
    } catch (error) {
      next(error);
    }
  }
}