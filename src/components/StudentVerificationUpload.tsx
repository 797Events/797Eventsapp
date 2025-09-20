'use client';

import React, { useState, useRef } from 'react';
import { Upload, Check, AlertCircle, FileText, Camera } from 'lucide-react';
import { studentVerificationService, type VerificationResult } from '@/lib/studentVerification';

interface StudentVerificationUploadProps {
  onVerificationComplete: (result: VerificationResult) => void;
  onDiscountApplied: (discountPercentage: number, code: string) => void;
  disabled?: boolean;
}

export default function StudentVerificationUpload({
  onVerificationComplete,
  onDiscountApplied,
  disabled = false
}: StudentVerificationUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file
    const validation = studentVerificationService.validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Set file and create preview
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setIsUploading(true);
  };

  const handleVerifyID = async () => {
    if (!uploadedFile) {
      setError('Please select a file first');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await studentVerificationService.verifyStudentWithOCR(uploadedFile);
      setVerificationResult(result);
      onVerificationComplete(result);

      if (result.isVerified) {
        // Apply discount automatically
        onDiscountApplied(result.discountPercentage, `STUDENT-${Date.now()}`);
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    setUploadedFile(null);
    setPreviewUrl('');
    setVerificationResult(null);
    setError('');
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    setVerificationResult(null);
    setError('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">
          Student ID Verification
        </h3>
      </div>

      {/* Upload Area */}
      {!uploadedFile && (
        <div
          className={`border-2 border-dashed border-purple-400 rounded-lg p-6 text-center transition-colors hover:border-purple-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />

          <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">Upload Your Student ID</p>
          <p className="text-gray-300 text-sm mb-4">
            Get 10% student discount by verifying your student ID
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Supports JPG, PNG formats</p>
            <p>• Maximum file size: 5MB</p>
            <p>• Make sure ID is clearly visible</p>
          </div>
        </div>
      )}

      {/* File Preview */}
      {uploadedFile && previewUrl && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Student ID Preview"
              className="w-full max-h-64 object-contain rounded-lg border border-purple-400"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              disabled={isVerifying}
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-400" />
              <span className="text-sm text-white truncate">
                {uploadedFile.name}
              </span>
              <span className="text-xs text-gray-400">
                ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Verification Button */}
      {uploadedFile && !verificationResult && (
        <button
          onClick={handleVerifyID}
          disabled={isVerifying || disabled}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Verifying Student ID...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Verify Student ID
            </>
          )}
        </button>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div className={`p-4 rounded-lg border ${
          verificationResult.isVerified
            ? 'bg-green-500/10 border-green-500'
            : 'bg-red-500/10 border-red-500'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {verificationResult.isVerified ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <span className={`font-medium ${
              verificationResult.isVerified ? 'text-green-400' : 'text-red-400'
            }`}>
              {verificationResult.isVerified ? 'Verification Successful!' : 'Verification Failed'}
            </span>
          </div>

          <p className={`text-sm mb-3 ${
            verificationResult.isVerified ? 'text-green-300' : 'text-red-300'
          }`}>
            {verificationResult.message}
          </p>

          {verificationResult.isVerified && (
            <div className="bg-purple-600/20 p-3 rounded border border-purple-400">
              <p className="text-white text-sm font-medium">
                🎉 {verificationResult.discountPercentage}% Student Discount Applied!
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Your student discount has been automatically applied to this booking.
              </p>
            </div>
          )}

          {verificationResult.extractedData && (
            <div className="mt-3 text-xs text-gray-300 space-y-1">
              <p><strong>Detected Data:</strong></p>
              {verificationResult.extractedData.collegeName && (
                <p>• College: {verificationResult.extractedData.collegeName}</p>
              )}
              {verificationResult.extractedData.department && (
                <p>• Department: {verificationResult.extractedData.department}</p>
              )}
              <p>• Confidence: {verificationResult.extractedData.confidence}%</p>
            </div>
          )}

          {!verificationResult.isVerified && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleRetry}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleClear}
                className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors"
              >
                Upload Different ID
              </button>
            </div>
          )}
        </div>
      )}

      {/* Guidelines */}
      <div className="text-xs text-gray-400 mt-4">
        <p className="font-medium mb-2">For best results:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Ensure the ID is well-lit and clearly visible</li>
          <li>All text should be readable without blur</li>
          <li>Include the complete ID card in the photo</li>
          <li>Avoid shadows or glare on the ID</li>
        </ul>
      </div>
    </div>
  );
}