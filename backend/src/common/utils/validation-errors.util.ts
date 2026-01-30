import { ValidationError } from 'class-validator';

interface TransformedError {
  property: string;
  messages: string[];
}

export function extractValidationErrors(
  errors: ValidationError[],
  parentProperty = '',
): TransformedError[] {
  let transformedErrors: TransformedError[] = [];

  errors.forEach((error) => {
    const propertyPath = parentProperty
      ? `${parentProperty}.${error.property}`
      : error.property;

    if (error.constraints) {
      transformedErrors.push({
        property: propertyPath,
        messages: Object.values(error.constraints),
      });
    }

    if (error.children && error.children.length > 0) {
      transformedErrors = transformedErrors.concat(
        extractValidationErrors(error.children, propertyPath),
      );
    }
  });

  return transformedErrors;
}
