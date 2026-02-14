import { BadRequestException, ValidationError } from '@nestjs/common';

type FormattedValidationError = {
  field: string;
  message: string;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const joinFieldPath = (parentPath: string, property?: string): string => {
  if (!property) {
    return parentPath || 'request';
  }

  return parentPath ? `${parentPath}.${property}` : property;
};

const flattenValidationErrors = (
  errors: ValidationError[],
  parentPath = '',
): FormattedValidationError[] => {
  const formatted: FormattedValidationError[] = [];

  for (const error of errors) {
    const field = joinFieldPath(parentPath, error.property);
    const constraintMessages = Object.values(error.constraints || {}).filter(
      isNonEmptyString,
    );

    for (const message of constraintMessages) {
      formatted.push({ field, message });
    }

    if (Array.isArray(error.children) && error.children.length > 0) {
      formatted.push(...flattenValidationErrors(error.children, field));
    }
  }

  return formatted;
};

export const validationExceptionFactory = (errors: ValidationError[]) => {
  const formattedErrors = flattenValidationErrors(errors);
  const normalizedErrors =
    formattedErrors.length > 0
      ? formattedErrors
      : [{ field: 'request', message: 'Validation failed' }];

  return new BadRequestException({
    message: normalizedErrors[0].message,
    errors: normalizedErrors,
  });
};
