import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class FBExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception?.response?.error && exception?.response?.error?.type) {
      const fbError = exception.response.error;
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: `Facebook Error: ${fbError.message || 'Unknown error'}`,
        errorType: fbError.type,
        errorCode: fbError.code,
        fbtrace_id: fbError.fbtrace_id,
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
