import { registerDecorator, ValidationOptions } from 'class-validator';
import { parsePhoneNumberWithError, CountryCode } from 'libphonenumber-js';

/**
 * Options for phone number validation.
 */
export interface IsPhoneNumberOptions {
  /**
   * List of allowed country codes. If provided, only phone numbers
   * from these countries will be accepted.
   * Default is ['EG']
   * @example ['EG', 'SA', 'AE']
   */
  allowedCountries?: CountryCode[];
}

/**
 * Validates that a string is a valid phone number.
 * By default, it validates Egyptian numbers (Accepts both 01xxxxxxxxx and +201xxxxxxxxx).
 *
 * @param options - Validation options including allowed countries
 * @param validationOptions - class-validator options
 *
 * @example
 * // Accept valid Egyptian phone number
 * @IsPhoneNumber()
 * phone: string;
 *
 * @example
 * // Only accept phone numbers from Saudi Arabia and UAE
 * @IsPhoneNumber({ allowedCountries: ['SA', 'AE'] })
 * phone: string;
 */
export function IsPhoneNumber(
  options?: IsPhoneNumberOptions,
  validationOptions?: ValidationOptions,
) {
  const allowedCountries = options?.allowedCountries || ['EG'];

  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsPhoneNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [allowedCountries],
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }

          // Strategy: Try parsing as local number for each allowed country
          // This handles both international format (+20...) and local format (01...)
          // if the local format is valid for that country.
          for (const country of allowedCountries) {
            try {
              const phoneNumber = parsePhoneNumberWithError(value, country);
              if (phoneNumber?.isValid() && phoneNumber.country === country) {
                return true;
              }
            } catch {
              continue;
            }
          }

          return false;
        },
        defaultMessage() {
          return `Phone number must be a valid number from one of these countries: ${allowedCountries.join(', ')}`;
        },
      },
    });
  };
}
