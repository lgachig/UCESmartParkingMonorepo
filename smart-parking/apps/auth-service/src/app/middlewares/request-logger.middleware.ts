import { Injectable, Logger, NestMiddleware, } from '@nestjs/common';
import { NextFunction, Request, Response, } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  
  private readonly logger = new Logger( RequestLoggerMiddleware.name,);
  
  use( req: Request, res: Response, next: NextFunction,) {
    
    const { method, originalUrl, ip,} = req;
    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `${method} ${originalUrl} ${res.statusCode} - ${duration}ms - ${ip} - ${userAgent}`,
      );
    });
    next();
  }
}