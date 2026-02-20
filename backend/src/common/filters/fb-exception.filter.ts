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

    if (
      exception &&
      typeof exception === 'object' &&
      'response' in exception &&
      typeof (exception as any).response === 'object' &&
      (exception as any).response?.error?.type
    ) {
      const fbError = (exception as any).response.error as Record<
        string,
        unknown
      >;
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
