import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class FBExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const ex = exception as {
      response?: {
        error?: {
          type?: string;
          message?: string;
          code?: string;
          fbtrace_id?: string;
        };
      };
    };
    const fbError = ex?.response?.error;

    if (fbError && fbError.type) {
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
