import { parsePhoneNumberWithError, CountryCode } from 'libphonenumber-js';

/**
 * Normalizes a phone number to E.164 format.
 * E.164 format: +[country code][subscriber number]
 * Example: +966501234567, +201234567890
 *
 * @param phone - The phone number to normalize
 * @param defaultCountry - Optional default country if phone doesn't include country code
 * @returns Normalized phone number in E.164 format
 * @throws Error if the phone number is invalid
 *
 * @example
 * normalizePhoneNumber('+966501234567') // Returns: '+966501234567'
 * normalizePhoneNumber('0501234567', 'SA') // Returns: '+966501234567'
 * normalizePhoneNumber('01234567890', 'EG') // Returns: '+201234567890'
 */
export function normalizePhoneNumber(
  phone: string,
  defaultCountry?: CountryCode,
): string {
  const phoneNumber = parsePhoneNumberWithError(phone, defaultCountry);

  if (!phoneNumber.isValid()) {
    throw new Error(`Invalid phone number: ${phone}`);
  }

  // Return in E.164 format (e.g., +966501234567)
  return phoneNumber.format('E.164');
}

/**
 * Safely normalizes a phone number, returning null if invalid.
 *
 * @param phone - The phone number to normalize
 * @param defaultCountry - Optional default country if phone doesn't include country code
 * @returns Normalized phone number in E.164 format, or null if invalid
 */
export function safeNormalizePhoneNumber(
  phone: string,
  defaultCountry?: CountryCode,
): string | null {
  try {
    return normalizePhoneNumber(phone, defaultCountry);
  } catch {
    return null;
  }
}
