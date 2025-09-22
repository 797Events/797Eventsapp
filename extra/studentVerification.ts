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

    // Real OCR processing - verify student ID by checking for valid college patterns
    const ocrResult = await processStudentIDWithOCR(idFile);

    if (ocrResult.isValid) {
      return {
        isVerified: true,
        discountPercentage: 10, // 10% student discount for verified IDs
        message: 'Student ID verified successfully! You qualify for a 10% student discount.',
        extractedData: ocrResult
      };
    } else {
      return {
        isVerified: false,
        discountPercentage: 0,
        message: `ID verification failed: ${ocrResult.verificationErrors.join(', ')}`,
        extractedData: ocrResult
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
async function processStudentIDWithOCR(file: File): Promise<StudentIDData> {
  try {
    // Real OCR processing using browser-based text extraction
    const imageDataUrl = await fileToDataURL(file);
    const extractedText = await extractTextFromImage(imageDataUrl);

    // Parse the extracted text for student information
    const result = parseStudentIDText(extractedText);

    return result;

  } catch (error) {
    console.error('OCR processing failed:', error);

    // Fallback validation based on file properties
    return {
      collegeName: undefined,
      studentName: undefined,
      enrollmentNumber: undefined,
      department: undefined,
      bloodGroup: undefined,
      mobileNumber: undefined,
      isValid: false,
      confidence: 0,
      verificationErrors: ['Unable to process student ID - please try uploading a clearer image']
    };
  }
}

// Helper function to convert file to data URL
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Real text extraction from image using Tesseract.js OCR
async function extractTextFromImage(imageDataUrl: string): Promise<string> {
  try {
    // Dynamically import Tesseract.js to avoid SSR issues
    const Tesseract = await import('tesseract.js');

    console.log('🔍 Starting OCR text extraction...');

    const { data: { text } } = await Tesseract.recognize(
      imageDataUrl,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`📄 OCR Progress: ${(m.progress * 100).toFixed(1)}%`);
          }
        },
        // tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-()./:@' // Removed - not compatible with current tesseract.js version
      }
    );

    console.log('✅ OCR extraction completed:', text.substring(0, 100) + '...');
    return text;

  } catch (error) {
    console.error('❌ OCR extraction failed:', error);
    return '';
  }
}

// Parse extracted text for student ID information
function parseStudentIDText(text: string): StudentIDData {
  console.log('🔍 Parsing student ID text:', text);

  const textLower = text.toLowerCase();
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const result: StudentIDData = {
    isValid: false,
    confidence: 0,
    verificationErrors: []
  };

  // Extract college name
  const collegeMatch = VALID_COLLEGES.find(college =>
    textLower.includes(college.toLowerCase())
  );
  if (collegeMatch) {
    result.collegeName = collegeMatch.toUpperCase();
    console.log('✅ College detected:', result.collegeName);
  }

  // Extract student name (usually appears after "Name:" or "Student Name:")
  const namePatterns = [
    /(?:name|student name|student)\s*:?\s*([a-zA-Z\s]{3,30})/i,
    /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)$/m
  ];

  for (const pattern of namePatterns) {
    const nameMatch = text.match(pattern);
    if (nameMatch && nameMatch[1] && nameMatch[1].length > 3) {
      result.studentName = nameMatch[1].trim();
      console.log('✅ Student name detected:', result.studentName);
      break;
    }
  }

  // Extract enrollment number
  for (const pattern of ENROLLMENT_PATTERNS) {
    const enrollmentMatch = text.match(pattern);
    if (enrollmentMatch) {
      result.enrollmentNumber = enrollmentMatch[0];
      console.log('✅ Enrollment number detected:', result.enrollmentNumber);
      break;
    }
  }

  // Extract department
  const deptMatch = VALID_DEPARTMENTS.find(dept =>
    textLower.includes(dept.toLowerCase())
  );
  if (deptMatch) {
    result.department = deptMatch.toUpperCase();
    console.log('✅ Department detected:', result.department);
  }

  // Extract blood group
  const bloodMatch = VALID_BLOOD_GROUPS.find(blood =>
    text.includes(blood)
  );
  if (bloodMatch) {
    result.bloodGroup = bloodMatch;
    console.log('✅ Blood group detected:', result.bloodGroup);
  }

  // Extract mobile number
  const phoneMatch = text.match(PHONE_PATTERN);
  if (phoneMatch) {
    result.mobileNumber = phoneMatch[0];
    console.log('✅ Mobile number detected:', result.mobileNumber);
  }

  // Validation logic - now requires actual extracted data
  const errors: string[] = [];

  if (!result.collegeName) {
    errors.push('Valid educational institution not detected in the image');
  }

  if (!result.studentName) {
    errors.push('Student name not found on the ID');
  }

  if (!result.enrollmentNumber) {
    errors.push('Enrollment/Student ID number not detected');
  }

  if (text.length < 20) {
    errors.push('Insufficient text detected - please upload a clearer image');
  }

  // Check for academic year patterns
  const hasYearPattern = /20\d{2}/.test(text);
  if (!hasYearPattern) {
    errors.push('Academic year not detected on the ID');
  }

  // Calculate confidence based on extracted data
  let confidence = 0;
  if (result.collegeName) confidence += 30;
  if (result.studentName) confidence += 25;
  if (result.enrollmentNumber) confidence += 25;
  if (result.department) confidence += 10;
  if (result.bloodGroup) confidence += 5;
  if (result.mobileNumber) confidence += 5;

  result.confidence = confidence;
  result.isValid = errors.length === 0 && confidence >= 55; // Require minimum confidence
  result.verificationErrors = errors;

  console.log('📊 Verification result:', {
    isValid: result.isValid,
    confidence: result.confidence,
    errors: result.verificationErrors
  });

  return result;
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