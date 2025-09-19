'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { verifyStudent, StudentVerificationData, VerificationResult } from '@/lib/studentVerification';

interface StudentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (result: VerificationResult) => void;
}

export default function StudentVerificationModal({
  isOpen,
  onClose,
  onVerificationComplete
}: StudentVerificationModalProps) {
  const [formData, setFormData] = useState<StudentVerificationData>({
    studentId: '',
    instituteName: '',
    graduationYear: new Date().getFullYear() + 1
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'graduationYear' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyStudent(formData);
      onVerificationComplete(result);
      if (result.isVerified) {
        onClose();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Student Verification</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Description */}
        <p className="text-white/80 text-sm mb-6">
          Verify your student status to receive a 15% discount on your booking.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Student ID
            </label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your student ID"
              required
            />
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Institution Name
            </label>
            <input
              type="text"
              name="instituteName"
              value={formData.instituteName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your college/university name"
              required
            />
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Expected Graduation Year
            </label>
            <select
              name="graduationYear"
              value={formData.graduationYear}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() + i;
                return (
                  <option key={year} value={year} className="bg-purple-900">
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Verify Student Status'}
          </button>
        </form>

        <p className="text-white/60 text-xs mt-4 text-center">
          Your information is secure and only used for verification purposes.
        </p>
      </div>
    </div>
  );
}