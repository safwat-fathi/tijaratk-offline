import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError, TypeORMError } from 'typeorm';

@Catch(TypeORMError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database operation failed';
    const code = (exception as TypeORMError & { code?: string }).code;

    if (exception instanceof QueryFailedError) {
      const result = this.handleQueryFailedError(exception, code as string);
      status = result.status;
      message = result.message;
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Database Error [${code}]: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      success: false,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private handleQueryFailedError(
    exception: QueryFailedError,
    code?: string,
  ): { status: number; message: string } {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database operation failed';

    if (code === '23505') {
      status = HttpStatus.CONFLICT;
      const detail = (exception as QueryFailedError & { detail?: string })
        .detail;
      if (detail) {
        const match = /Key \((.*?)\)=\(.*?\)/.exec(detail);
        message = match && match[1] ? `${match[1]} already exists` : detail;
      } else {
        message = 'Duplicate entry';
      }
    } else if (code === '23503') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Foreign key constraint violation';
    } else if (code === '22P02') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid input syntax for database query';
    }

    return { status, message };
  }
}
