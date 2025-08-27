import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

const isDev = process.env.NODE_ENV !== 'production';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const requestId = req.requestId;
    const method = req.method;
    const path = req.originalUrl || req.url;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';

    if(exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse() as
        | string
        | { message?: any; error?: string; statusCode?: number; code?: string };

      if(typeof resp === 'string') {
        message = resp;
        error = HttpStatus[status] || error;
      } else {
        const rawMsg = resp.message;
        error = resp.error ?? HttpStatus[status] ?? error;

        if(Array.isArray(rawMsg)) {
          message = rawMsg.join(', ');
        } else if(typeof rawMsg === 'string') {
          message = rawMsg;
        } else if(rawMsg) {
          message = JSON.stringify(rawMsg);
        }

        if(resp.code) {
          code = resp.code;
        }else{
          code = this.mapStatusToCode(status);
        }

      }
    }else if(exception instanceof Error) {
      message = exception.message || message;
    }

    console.error(
      JSON.stringify({
        level: status >= 500 ? 'error' : 'warn',
        timestamp: new Date().toISOString(),
        requestId,
        method,
        path,
        status,
        code,
        err:
          isDev && exception instanceof Error
            ? { name: exception.name, message: exception.message, stack: exception.stack }
            : { name: exception instanceof Error ? exception.name : 'Unknown' },
      }),
    );

    res.status(status).json({
      error,
      message,
      code,
      requestId,
    });

  }

  private mapStatusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'AUTH_REQUIRED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'ERROR';
    }
  }
}