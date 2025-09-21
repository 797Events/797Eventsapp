export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  return {
    isValid,
    errors: isValid ? [] : ['Please enter a valid email address']
  };
}

export function validatePhone(phone: string): ValidationResult {
  // Remove all non-digits for validation
  const digitsOnly = phone.replace(/\D/g, '');

  // Check for valid Indian mobile formats
  const isValid =
    // 10 digit number starting with 6,7,8,9
    (/^[6-9]\d{9}$/.test(digitsOnly)) ||
    // 12 digit with +91 prefix
    (/^91[6-9]\d{9}$/.test(digitsOnly)) ||
    // 11 digit starting with 0
    (/^0[6-9]\d{9}$/.test(digitsOnly));

  return {
    isValid,
    errors: isValid ? [] : ['Please enter a valid Indian mobile number (10 digits starting with 6-9)']
  };
}

// Format phone number for Razorpay (returns 10-digit number)
export function formatPhoneForRazorpay(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    return digitsOnly.substring(2); // Remove +91
  }
  if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
    return digitsOnly.substring(1); // Remove leading 0
  }
  return digitsOnly.slice(-10); // Take last 10 digits
}

export function validateName(name: string): ValidationResult {
  const isValid = name.trim().length >= 2;

  return {
    isValid,
    errors: isValid ? [] : ['Name must be at least 2 characters long']
  };
}

export function validateRequired(value: string, fieldName: string): ValidationResult {
  const isValid = value.trim().length > 0;

  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} is required`]
  };
}

export function validateBookingForm(data: {
  name: string;
  email: string;
  phone: string;
  quantity: number;
}): ValidationResult {
  const errors: string[] = [];

  const nameValidation = validateName(data.name);
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  }

  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.isValid) {
    errors.push(...phoneValidation.errors);
  }

  if (data.quantity < 1) {
    errors.push('Quantity must be at least 1');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Alias for consistency with imports
export const validateBookingData = validateBookingForm;

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"']/g, '');
}