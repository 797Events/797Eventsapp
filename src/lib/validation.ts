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
  const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
  const isValid = phoneRegex.test(phone);

  return {
    isValid,
    errors: isValid ? [] : ['Please enter a valid phone number']
  };
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