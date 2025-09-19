'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  Mail,
  Phone,
  School
} from 'lucide-react';

interface StudentVerification {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  collegeName: string;
  course: string;
  year: string;
  rollNumber: string;
  idCardUrl: string;
  promoCode: string;
  requestedDiscount: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  eventId?: string;
  eventTitle?: string;
}

export default function StudentVerificationTab() {
  const [verifications, setVerifications] = useState<StudentVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<StudentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedVerification, setSelectedVerification] = useState<StudentVerification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/student-verification');

      if (!response.ok) {
        throw new Error('Failed to fetch verifications');
      }

      const data = await response.json();

      // Transform the backend data to match frontend interface
      const transformedVerifications: StudentVerification[] = data.verifications.map((v: any) => ({
        id: v.id,
        studentName: v.student_name,
        studentEmail: v.student_email,
        studentPhone: v.student_phone || '',
        collegeName: v.institution_name,
        course: v.course,
        year: v.year_of_study,
        rollNumber: v.student_id,
        idCardUrl: v.document_url || '/demo-student-id.jpg',
        promoCode: `${v.institution_name.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 100)}`,
        requestedDiscount: 20, // Default discount
        status: v.verification_status,
        submittedAt: v.created_at,
        reviewedAt: v.updated_at,
        reviewedBy: v.verified_by,
        rejectionReason: v.verification_notes
      }));

      setVerifications(transformedVerifications);
      setFilteredVerifications(transformedVerifications);
    } catch (error) {
      console.error('Error loading verifications:', error);
      setVerifications([]);
      setFilteredVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter verifications based on search and status
  useEffect(() => {
    let filtered = verifications;

    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.promoCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    setFilteredVerifications(filtered);
  }, [searchTerm, statusFilter, verifications]);

  const handleApprove = async (verificationId: string) => {
    try {
      const response = await fetch(`/api/admin/student-verification?id=${verificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          notes: 'Student verification approved',
          verifiedBy: 'Admin User'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve verification');
      }

      // Reload verifications
      loadVerifications();
      alert('Student verification approved successfully!');
    } catch (error) {
      console.error('Error approving verification:', error);
      alert('Failed to approve verification');
    }
  };

  const handleReject = async (verificationId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/student-verification?id=${verificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          notes: reason,
          verifiedBy: 'Admin User'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject verification');
      }

      // Reload verifications
      loadVerifications();
      alert('Student verification rejected');
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Failed to reject verification');
    }
  };

  const openDetailModal = (verification: StudentVerification) => {
    setSelectedVerification(verification);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Clock size={12} />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle size={12} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle size={12} />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const pendingCount = verifications.filter(v => v.status === 'pending').length;
  const approvedCount = verifications.filter(v => v.status === 'approved').length;
  const rejectedCount = verifications.filter(v => v.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading student verifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-400/30">
            <GraduationCap className="text-blue-400" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Student Verification Management</h2>
            <p className="text-white/60">Review and approve student discount requests</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Requests</p>
              <p className="text-2xl font-bold text-white">{verifications.length}</p>
            </div>
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-purple-400" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-400" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-400">{approvedCount}</p>
            </div>
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-400" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-400">{rejectedCount}</p>
            </div>
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-400" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              placeholder="Search by name, email, college, or promo code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-white/40" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">College</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Promo Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredVerifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{verification.studentName}</div>
                      <div className="text-sm text-white/60">{verification.studentEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white">{verification.collegeName}</div>
                      <div className="text-sm text-white/60">{verification.course} - {verification.year}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">
                      {verification.promoCode}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-400 font-medium">{verification.requestedDiscount}%</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(verification.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white/60">
                      {new Date(verification.submittedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetailModal(verification)}
                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>

                      {verification.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(verification.id)}
                            className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) handleReject(verification.id, reason);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVerifications.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-white/40" />
            <h3 className="mt-2 text-sm font-medium text-white">No verification requests</h3>
            <p className="mt-1 text-sm text-white/60">
              {searchTerm || statusFilter !== 'all'
                ? 'No verifications match your search criteria.'
                : 'No student verification requests have been submitted yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Student Verification Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white/60 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Student Name</label>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-white/40" />
                    <span className="text-white">{selectedVerification.studentName}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-white/40" />
                    <span className="text-white">{selectedVerification.studentEmail}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-white/40" />
                    <span className="text-white">{selectedVerification.studentPhone}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">College</label>
                  <div className="flex items-center gap-2">
                    <School size={16} className="text-white/40" />
                    <span className="text-white">{selectedVerification.collegeName}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Course</label>
                  <span className="text-white">{selectedVerification.course}</span>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Year</label>
                  <span className="text-white">{selectedVerification.year}</span>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Roll Number</label>
                  <span className="text-white">{selectedVerification.rollNumber}</span>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Promo Code</label>
                  <code className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                    {selectedVerification.promoCode}
                  </code>
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Student ID Card</label>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-center h-48 bg-white/5 rounded border-2 border-dashed border-white/20">
                    <div className="text-center">
                      <Download className="mx-auto h-8 w-8 text-white/40 mb-2" />
                      <p className="text-white/60 text-sm">Click to view ID card image</p>
                      <p className="text-white/40 text-xs">{selectedVerification.idCardUrl}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Status</label>
                  {getStatusBadge(selectedVerification.status)}
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Requested Discount</label>
                  <span className="text-green-400 font-medium">{selectedVerification.requestedDiscount}%</span>
                </div>
              </div>

              {selectedVerification.status === 'rejected' && selectedVerification.rejectionReason && (
                <div>
                  <label className="block text-white/60 text-sm mb-1">Rejection Reason</label>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400">{selectedVerification.rejectionReason}</p>
                  </div>
                </div>
              )}

              {selectedVerification.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      handleApprove(selectedVerification.id);
                      setShowDetailModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 border border-green-400/30 rounded-lg hover:bg-green-500/30 transition-colors"
                  >
                    <CheckCircle className="inline mr-2" size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) {
                        handleReject(selectedVerification.id, reason);
                        setShowDetailModal(false);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 border border-red-400/30 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <XCircle className="inline mr-2" size={16} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}