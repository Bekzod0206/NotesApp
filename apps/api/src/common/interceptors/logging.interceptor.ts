import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, timestamp } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const method = req.method;
    const url = req.originalUrl || req.url;
    const requestId = req.requestId;
    const userId = req.user?.sub;
    const ip = req.ip;

    return next
      .handle()
      .pipe(
        tap({
          next: () => {
            const durationMs = Date.now() - start;
            const status = res.statusCode;
            console.log(
              JSON.stringify({
                level: 'info',
                timestamp: new Date().toISOString(),
                requestId,
                method,
                url,
                status,
                durationMs,
                userId,
                ip
              })
            );
          },
          error: (error) => {}
        }),
      );
  }
}
