export const formatPhoneNumber = (phone: string): string => {
  // 1. Remove non-numeric characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // 2. Already in E.164 format for Egypt (+20...)
  if (cleaned.startsWith('+20')) {
    return cleaned;
  }

  // 3. Starts with 20... (missing +)
  if (cleaned.startsWith('20') && cleaned.length >= 12) {
    return `+${cleaned}`;
  }

  // 4. Egyptian mobile number starting with 01... (11 digits: 01xxxxxxxxx)
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return `+20${cleaned.substring(1)}`;
  }

  // 5. Fallback: return as is (could be international or invalid)
  return cleaned;
};
