export interface StudentVerificationData {
  studentId: string;
  instituteName: string;
  graduationYear: number;
  verificationDocument?: File;
}

export interface StudentIDData {
  collegeName?: string;
  studentName?: string;
  enrollmentNumber?: string;
  department?: string;
  bloodGroup?: string;
  mobileNumber?: string;
  isValid: boolean;
  confidence: number;
  verificationErrors: string[];
}

export interface VerificationResult {
  isVerified: boolean;
  discountPercentage: number;
  message: string;
  extractedData?: StudentIDData;
}

// Known college patterns for verification - expanded for testing
const VALID_COLLEGES = [
  'genba sopanrao moze college of engineering',
  'gsmcoe',
  'pune',
  'balewadi',
  'engineering',
  'college',
  'university',
  'institute',
  'school',
  'iit',
  'nit',
  'vit',
  'mit',
  'bits',
  'manipal',
  'srm',
  'amrita',
  'education',
  'academy',
  'polytechnic'
];

const VALID_DEPARTMENTS = [
  'information technology',
  'computer science',
  'mechanical',
  'electrical',
  'civil',
  'electronics',
  'it',
  'cse',
  'mech',
  'eee',
  'ece'
];

// Blood group validation
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Phone number pattern (Indian format)
const PHONE_PATTERN = /^(\+91|91)?[\s-]?[6-9]\d{9}$/;

// Enrollment number patterns
const ENROLLMENT_PATTERNS = [
  /^\d{10}$/, // 10 digit enrollment like in your sample
  /^\d{8}$/, // 8 digit enrollment
  /^[A-Z]{2}\d{8}$/, // State code + 8 digits
];

export async function verifyStudentWithOCR(idFile: File): Promise<VerificationResult> {
  try {
    // Validate image file first
    const validation = validateImageFile(idFile);
    if (!validation.isValid) {
      return {
        isVerified: false,
        discountPercentage: 0,
        message: validation.error || 'Invalid file'
      };
    }

    // For now, simulate OCR processing based on your ID structure
    // In production, you would use actual OCR here
    const mockOCRResult = await simulateOCRProcessing(idFile);

    if (mockOCRResult.isValid) {
      return {
        isVerified: true,
        discountPercentage: 10, // 10% student discount for verified IDs
        message: 'Student ID verified successfully! You qualify for a 10% student discount.',
        extractedData: mockOCRResult
      };
    } else {
      return {
        isVerified: false,
        discountPercentage: 0,
        message: `ID verification failed: ${mockOCRResult.verificationErrors.join(', ')}`,
        extractedData: mockOCRResult
      };
    }

  } catch (error) {
    console.error('OCR verification failed:', error);
    return {
      isVerified: false,
      discountPercentage: 0,
      message: 'ID verification service temporarily unavailable. Please try again later.'
    };
  }
}

// Simulate OCR processing based on your uploaded ID structure
async function simulateOCRProcessing(file: File): Promise<StudentIDData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate realistic verification based on your ID
      const result: StudentIDData = {
        collegeName: 'Genba Sopanrao Moze College of Engineering',
        studentName: 'Sample Student Name',
        enrollmentNumber: '1234567890',
        department: 'Information Technology',
        bloodGroup: 'A+',
        mobileNumber: '+91 9876543210',
        isValid: true,
        confidence: 85,
        verificationErrors: []
      };

      // Add some realistic validation
      if (file.size < 10000) {
        result.verificationErrors.push('Image quality too low');
        result.isValid = false;
      }

      if (file.size > 5 * 1024 * 1024) {
        result.verificationErrors.push('File size too large');
        result.isValid = false;
      }

      // Simulate 90% success rate for valid files
      if (Math.random() < 0.1) {
        result.verificationErrors.push('Unable to extract clear text from ID');
        result.isValid = false;
      }

      resolve(result);
    }, 2000); // Simulate processing time
  });
}

export async function verifyStudent(data: StudentVerificationData): Promise<VerificationResult> {
  // If verification document provided, use OCR verification
  if (data.verificationDocument) {
    return await verifyStudentWithOCR(data.verificationDocument);
  }

  // Fallback to basic verification
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

    // Basic verification success
    return {
      isVerified: true,
      discountPercentage: 10, // 10% for basic verification
      message: 'Student status verified! You qualify for a 10% discount.'
    };

  } catch (error) {
    console.error('Error in student verification:', error);
    return {
      isVerified: false,
      discountPercentage: 0,
      message: 'Verification service temporarily unavailable. Please try again later.'
    };
  }
}

// Validate uploaded image before processing
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'File size too large (max 5MB)' };
  }

  // Check minimum file size
  if (file.size < 1000) {
    return { isValid: false, error: 'File size too small' };
  }

  // Check file type
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Please upload JPG or PNG' };
  }

  return { isValid: true };
}

// Generate student discount code
export function generateStudentDiscount(verificationData: StudentIDData): {
  discountCode: string;
  discountPercentage: number;
  validUntil: string;
} | null {
  if (!verificationData.isValid) {
    return null;
  }

  // Generate unique discount code
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const collegeCode = 'GSMCOE'; // Based on the ID shown

  return {
    discountCode: `STUDENT-${collegeCode}-${timestamp}-${random}`.toUpperCase(),
    discountPercentage: 10, // 10% student discount
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };
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
  verifyStudentWithOCR,
  calculateStudentDiscount,
  isStudentEligible,
  validateImageFile,
  generateStudentDiscount
};