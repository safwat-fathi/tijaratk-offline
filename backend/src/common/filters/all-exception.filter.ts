import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Handle generic JS errors that might be thrown
    if (
      exception instanceof TypeError ||
      exception instanceof RangeError ||
      exception instanceof ReferenceError ||
      exception instanceof SyntaxError ||
      exception instanceof EvalError
    ) {
      this.logger.error(
        `Critical Error: ${exception.message}`,
        exception.stack,
      );
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Check if the exception is a validation error (class-validator)
    if (Array.isArray(exception) && exception[0] instanceof ValidationError) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: `Validation error for ${(exception[0] as ValidationError).property}`,
        errors: exception,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        (exceptionResponse as any).message
      ) {
        message = Array.isArray((exceptionResponse as any).message)
          ? (exceptionResponse as any).message.join(', ')
          : (exceptionResponse as any).message;
        errorDetails = (exceptionResponse as any).error;
      }
    } else if (
      exception instanceof QueryFailedError ||
      (exception as any).code
    ) {
      // Handle TypeORM / Postgres errors
      const code = (exception as any).code;
      if (code === '22P02') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid input syntax for database query';
      } else if (code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'Duplicate entry violation';
      } else {
        this.logger.error(
          `Database Error [${code}]: ${exception.message}`,
          (exception as any).stack,
        );
        message = 'Database operation failed';
      }
    } else {
      this.logger.error(
        `Unexpected Error: ${exception.message}`,
        typeof exception === 'object' ? JSON.stringify(exception) : exception,
      );
      message = 'An unexpected error occurred';
    }

    return response.status(status).json({
      success: false,
      message,
      errors: errorDetails,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
