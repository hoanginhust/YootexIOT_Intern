import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;
    const startTime = Date.now();

    // Event listener triggered once the response loop is completed
    response.on('finish', () => {
      const { statusCode } = response;
      const duration = Date.now() - startTime;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} - Completed in ${duration}ms`,
      );
    });

    next();
  }
}