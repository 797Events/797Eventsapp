import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
  'image/webp'
];

// Authentication helper
function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return null;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as any;
    return payload;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Student ID file upload request received');

    // Authentication check
    const user = verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'user')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const verificationId = formData.get('verificationId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!verificationId) {
      return NextResponse.json(
        { success: false, error: 'Verification ID required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only JPG, PNG, PDF files are allowed' },
        { status: 400 }
      );
    }

    // Create secure filename
    const fileExtension = path.extname(file.name);
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const secureFileName = `student_id_${verificationId}_${timestamp}_${randomHash}${fileExtension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'student-ids');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, secureFileName);

    await writeFile(filePath, buffer);

    console.log(`✅ Student ID file uploaded: ${secureFileName}`);

    // Return the file path (relative to uploads directory)
    const relativePath = `uploads/student-ids/${secureFileName}`;

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      fileName: secureFileName,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Student ID file upload error:', error);
    return NextResponse.json(
      { success: false, error: 'File upload failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to serve uploaded files (with authentication)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'File name required' },
        { status: 400 }
      );
    }

    // Basic security: only allow alphanumeric and safe characters
    if (!/^[a-zA-Z0-9_.-]+$/.test(fileName)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file name' },
        { status: 400 }
      );
    }

    // Authentication check for file access
    const user = verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 401 }
      );
    }

    const filePath = path.join(process.cwd(), 'uploads', 'student-ids', fileName);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file and return as response
    const { readFile } = await import('fs/promises');
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600'
      }
    });

  } catch (error) {
    console.error('❌ File serving error:', error);
    return NextResponse.json(
      { success: false, error: 'File serving failed' },
      { status: 500 }
    );
  }
}