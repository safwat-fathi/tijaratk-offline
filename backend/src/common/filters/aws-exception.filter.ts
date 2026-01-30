import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

@Catch() // or narrow it down if you have specific AWS error types
export class AwsExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Check for AWS error codes
    if (exception && exception.code) {
      if (exception.code === 'AccessControlListNotSupported') {
        return response.status(400).json({
          success: false,
          message:
            'The bucket does not allow ACLs. Remove "acl" or enable ACLs in your bucket.',
        });
      }
      // ... other AWS codes
      return response.status(exception.statusCode || 500).json({
        success: false,
        message: exception.message || 'AWS error occurred',
      });
    }

    // If it's not actually AWS error, pass it along or handle otherwise
    return response.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
