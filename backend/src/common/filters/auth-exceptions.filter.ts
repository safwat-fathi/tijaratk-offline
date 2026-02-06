// common/filters/auth-exceptions.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const responseBody = {
      statusCode: status,
      message: exception.message || 'Error',
      error: exception.name,
    };

    // If it's a Validation error (BadRequest), exception.getResponse() might contain more details
    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'object') {
      Object.assign(responseBody, exceptionResponse);
    }

    response.status(status).json(responseBody);
  }
}
