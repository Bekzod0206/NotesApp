import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";

const isDev = process.env.NODE_ENV !== 'production';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const requestId = (req.headers?.["x-request-id"] as string) || (req as any).requestId;
    const method = req.method;
    const path = req.originalUrl || req.url;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let message: string | string[] = 'An unexpected error occurred';

    if(exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse() as
        | string
        | { message?: any; error?: string; statusCode?: number; code?: string };

      if(typeof resp === 'string') {
        message = resp;
        error = HttpStatus[status] ?? error;
      } else {
        const rawMsg = resp.message;
        error = resp.error ?? HttpStatus[status] ?? error;

        if(Array.isArray(rawMsg)) {
          message = rawMsg;
        } else if(typeof rawMsg === 'string') {
          message = rawMsg;
        } else if(rawMsg) {
          try {
            message = JSON.stringify(rawMsg);
          } catch (error) {
            message = 'Validation error';
          }
        }
        code = resp.code ?? this.mapStatusToCode(status);
      }
    }else if(isPrismaKnownError(exception)) {
      const e = exception as Prisma.PrismaClientKnownRequestError;

      switch (e.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          code = 'PRISMA_P2002';
          const fields = (e.meta?.target as string[])?.join(', ') || 'unique field';
          message = `Duplicate value for ${fields}`;
          error = httpStatusName(status) ?? 'Conflict';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          code = `PRISMA_${e.code}`;
          message = 'Database error';
          error = httpStatusName(status) ?? 'Bad Request';
          break;
        }
      }
    } else if(exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_SERVER_ERROR';
      message = exception.message || message;
      error = httpStatusName(status) ?? error;
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
      statusCode: status,
      error,
      message,
      code,
      timestamp: new Date().toISOString(),
      path,
      ...(requestId ? { requestId } : {}),
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
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'ERROR';
    }
  }
}

function isPrismaKnownError(err: any): err is Prisma.PrismaClientKnownRequestError {
  return typeof err === 'object' && err !== null && (err as any).code && (err as any).clientVersion;
}

function httpStatusName (status: number): string | undefined {
  const name = (HttpStatus as any)[status];
  return typeof name === 'string' ? name.replace(/_/g, ' ') : undefined;
}