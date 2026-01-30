import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Response } from 'express';

import { extractValidationErrors } from '../utils/validation-errors.util';

@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ValidationError[] | ValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Because sometimes Nest might wrap multiple ValidationErrors in an array
    const errorsArray = Array.isArray(exception) ? exception : [exception];
    const transformedErrors = extractValidationErrors(errorsArray);

    return response.status(400).json({
      success: false,
      errors: transformedErrors,
    });
  }
}
