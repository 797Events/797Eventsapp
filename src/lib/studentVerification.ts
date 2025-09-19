export interface StudentVerificationData {
  studentId: string;
  instituteName: string;
  graduationYear: number;
  verificationDocument?: File;
}

export interface VerificationResult {
  isVerified: boolean;
  discountPercentage: number;
  message: string;
}

export async function verifyStudent(data: StudentVerificationData): Promise<VerificationResult> {
  // Mock verification logic - in real implementation, this would integrate with
  // student verification APIs like SheerID, UNiDAYS, or custom verification service

  try {
    // Basic validation
    if (!data.studentId || !data.instituteName || !data.graduationYear) {
      return {
        isVerified: false,
        discountPercentage: 0,
        message: 'Please provide all required information'
      };
    }

    // Check if graduation year is reasonable (current year or future)
    const currentYear = new Date().getFullYear();
    if (data.graduationYear < currentYear || data.graduationYear > currentYear + 10) {
      return {
        isVerified: false,
        discountPercentage: 0,
        message: 'Please provide a valid graduation year'
      };
    }

    // Mock verification success - in production, this would call actual verification APIs
    const isVerified = Math.random() > 0.3; // 70% success rate for demo

    if (isVerified) {
      return {
        isVerified: true,
        discountPercentage: 15, // 15% student discount
        message: 'Student status verified successfully! You qualify for a 15% discount.'
      };
    } else {
      return {
        isVerified: false,
        discountPercentage: 0,
        message: 'Unable to verify student status. Please check your information and try again.'
      };
    }
  } catch (error) {
    console.error('Error in student verification:', error);
    return {
      isVerified: false,
      discountPercentage: 0,
      message: 'Verification service temporarily unavailable. Please try again later.'
    };
  }
}

export function calculateStudentDiscount(originalPrice: number, discountPercentage: number): number {
  return Math.round(originalPrice * (1 - discountPercentage / 100));
}

export function isStudentEligible(data: Partial<StudentVerificationData>): boolean {
  return !!(data.studentId && data.instituteName && data.graduationYear);
}

// Service object for consistency with imports
export const studentVerificationService = {
  verifyStudent,
  calculateStudentDiscount,
  isStudentEligible
};