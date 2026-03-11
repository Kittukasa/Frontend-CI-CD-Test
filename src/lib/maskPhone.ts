export const maskPhoneNumber = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length <= 3) {
    return value;
  }

  const digitsToMask = digitsOnly.length - 3;
  let digitsProcessed = 0;

  const masked = value
    .split('')
    .map(character => {
      if (/\d/.test(character)) {
        if (digitsProcessed < digitsToMask) {
          digitsProcessed += 1;
          return '*';
        }
        digitsProcessed += 1;
        return character;
      }
      return character;
    })
    .join('');

  return masked;
};
