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
    let code = (exception as any).code;

    // Handle specific Postgres error codes
    if (exception instanceof QueryFailedError) {
      if (code === '23505') {
        // Unique violation
        status = HttpStatus.CONFLICT;
        // Extract the key that failed: "Key (phone)=(+20123...) already exists."
        const detail = (exception as any).detail;
        if (detail) {
          // Simplified message: "phone already exists"
          const match = detail.match(/Key \((.*?)\)=\(.*?\)/);
          if (match && match[1]) {
            message = `${match[1]} already exists`;
          } else {
            message = detail;
          }
        } else {
          message = 'Duplicate entry';
        }
      } else if (code === '23503') {
        // Foreign key violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint violation';
      } else if (code === '22P02') {
        // Invalid text representation
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid input syntax for database query';
      }
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
}
