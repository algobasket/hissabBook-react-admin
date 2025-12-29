"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { payoutRequestsApi, PayoutRequest } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function ApprovalsPage() {
  const router = useRouter();
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<PayoutRequest | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    utr: '',
    remarks: '',
    proof: null as string | null,
  });
  const [uploadingProof, setUploadingProof] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPayoutRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await payoutRequestsApi.getAll(selectedStatus, currentPage, itemsPerPage);
      console.log('Payout requests response:', response);
      if (response.payoutRequests && response.payoutRequests.length > 0) {
        console.log('First payout request:', response.payoutRequests[0]);
        console.log('Proof filename in first request:', response.payoutRequests[0].proofFilename);
        console.log('All keys in first request:', Object.keys(response.payoutRequests[0]));
      }
      setPayoutRequests(response.payoutRequests || []);
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      }
    } catch (err: any) {
      console.error("Error fetching payout requests:", {
        message: err?.message,
        status: err?.status,
        error: err?.error,
        fullError: err,
      });
      
      let errorMessage = err?.message || err?.error?.message || err?.error?.raw || `Failed to load payout requests (${err?.status || "Unknown error"})`;
      
      // If unauthorized, redirect to login
      if (err?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchPayoutRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, selectedStatus, mounted, currentPage, itemsPerPage]);

  // Reset to page 1 when status changes
  useEffect(() => {
    if (mounted) {
      setCurrentPage(1);
    }
  }, [selectedStatus, mounted]);

  const handleStatusUpdate = async (id: string, status: "accepted" | "rejected") => {
    if (processingId) return;

    setProcessingId(id);
    setError(null); // Clear previous errors
    try {
      await payoutRequestsApi.updateStatus(id, {
        status,
        notes: status === "accepted" ? "Approved by admin" : "Rejected by admin",
      });

      // Refresh the list
      await fetchPayoutRequests();
    } catch (err: any) {
      console.error("Error updating payout request status:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to update request status";
      setError(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (processingId) return;

    // Confirm deletion
    if (!confirm("Are you sure you want to delete this payout request? This action cannot be undone.")) {
      return;
    }

    setProcessingId(id);
    setError(null);
    try {
      await payoutRequestsApi.delete(id);

      // Refresh the list
      await fetchPayoutRequests();
    } catch (err: any) {
      console.error("Error deleting payout request:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to delete request";
      setError(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (request: PayoutRequest) => {
    setEditingRequest(request);
    setEditFormData({
      amount: request.amount.toString(),
      utr: request.utr || '',
      remarks: request.remarks || '',
      proof: null, // Don't pre-fill proof, user can upload new one if needed
    });
  };

  const handleEditSubmit = async () => {
    if (!editingRequest) return;
    if (processingId) return;

    setProcessingId(editingRequest.id);
    setError(null);
    setUploadingProof(false);

    try {
      const updateData: { amount: number; utr: string; remarks: string; proof?: string } = {
        amount: parseFloat(editFormData.amount),
        utr: editFormData.utr.trim(),
        remarks: editFormData.remarks.trim(),
      };

      // Only include proof if a new one was uploaded
      if (editFormData.proof) {
        updateData.proof = editFormData.proof;
        setUploadingProof(true);
      }

      await payoutRequestsApi.update(editingRequest.id, updateData);

      // Refresh the list
      await fetchPayoutRequests();
      
      // Close modal
      setEditingRequest(null);
      setEditFormData({ amount: '', utr: '', remarks: '', proof: null });
    } catch (err: any) {
      console.error("Error updating payout request:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to update request";
      setError(errorMessage);
    } finally {
      setProcessingId(null);
      setUploadingProof(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Format: DD-MM-YY H:MMam/pm (like 02-11-98 5:30pm)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${day}-${month}-${year} ${hours}:${minutes}${ampm}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: "bg-amber-100", text: "text-amber-600", label: "Pending" },
      accepted: { bg: "bg-emerald-100", text: "text-emerald-600", label: "Accepted" },
      rejected: { bg: "bg-rose-100", text: "text-rose-600", label: "Rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-semibold`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex w-full flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-dark">Payout Requests</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <label>Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <label>Per Page</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600">Loading payout requests...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Request #</th>
                      <th className="px-4 py-3">Submitted By</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">UTR / Reference</th>
                      <th className="px-4 py-3">Screenshot</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created At</th>
                      <th className="px-4 py-3">Updated</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {payoutRequests.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                          No payout requests found
                        </td>
                      </tr>
                    ) : (
                      payoutRequests.map((request) => {
                        // Check for proofFilename in multiple possible field names
                        const proofFilename = request.proofFilename || (request as any).proof_filename || null;
                        
                        // Construct proof URL - handle R2 URLs and local filenames
                        let proofUrl = null;
                        if (proofFilename) {
                          // Check if it's already a full URL (R2 URL)
                          if (proofFilename.startsWith('http://') || proofFilename.startsWith('https://')) {
                            // It's an R2 URL, use it directly
                            proofUrl = proofFilename;
                          } else {
                            // It's a local filename, construct the URL
                            let filename = proofFilename;
                            // Remove any existing /uploads/ or /backend/uploads/ prefix
                            filename = filename.replace(/^\/?(backend\/)?uploads\//, '');
                            // Normalize API_BASE (remove trailing slash)
                            const apiBaseNormalized = API_BASE.replace(/\/$/, '');
                            proofUrl = `${apiBaseNormalized}/uploads/${filename}`;
                          }
                          
                          // Debug logging (remove in production if needed)
                          if (process.env.NODE_ENV === 'development') {
                            console.log('Payout proof URL construction:', {
                              original: proofFilename,
                              isR2Url: proofFilename.startsWith('http'),
                              finalUrl: proofUrl
                            });
                          }
                        }
                        

                        return (
                          <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 font-semibold text-dark">{request.reference}</td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-dark">{request.submittedBy}</span>
                                {request.userEmail && (
                                  <span className="text-xs text-slate-500">{request.userEmail}</span>
                                )}
                                {request.userPhone && (
                                  <span className="text-xs text-slate-500">{request.userPhone}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-semibold text-dark">
                              {formatAmount(request.amount)}
                            </td>
                            <td className="px-4 py-4">{request.utr}</td>
                            <td className="px-4 py-4">
                              {proofFilename ? (
                                <button
                                  onClick={() => setSelectedImage(proofUrl)}
                                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline transition-colors font-medium"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                  </svg>
                                  Attachment
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">No attachment</span>
                              )}
                            </td>
                            <td className="px-4 py-4">{getStatusBadge(request.status)}</td>
                            <td className="px-4 py-4 text-slate-500">
                              {formatDate(request.createdAt)}
                            </td>
                            <td className="px-4 py-4 text-slate-500">
                              {formatDate(request.updatedAt)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEdit(request)}
                                  disabled={processingId === request.id}
                                  className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Edit payout request"
                                >
                                  Edit
                                </button>
                                {request.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() => handleStatusUpdate(request.id, "accepted")}
                                      disabled={processingId === request.id}
                                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {processingId === request.id ? "Processing..." : "Accept"}
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(request.id, "rejected")}
                                      disabled={processingId === request.id}
                                      className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {processingId === request.id ? "Processing..." : "Reject"}
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDelete(request.id)}
                                  disabled={processingId === request.id}
                                  className="rounded-lg bg-slate-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Delete payout request"
                                >
                                  {processingId === request.id ? "Processing..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && payoutRequests.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} requests
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-primary text-white'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Attachment Preview</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedImage) {
                      const link = document.createElement('a');
                      link.href = selectedImage;
                      link.download = selectedImage.split('/').pop() || 'attachment';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm"
                  aria-label="Download attachment"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="rounded-lg bg-white p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200"
                  aria-label="Close modal"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Image Container */}
            <div className="p-6 bg-slate-50">
              <img
                src={selectedImage || ''}
                alt="Attachment"
                className="max-h-[75vh] max-w-full mx-auto rounded-lg shadow-lg object-contain bg-white"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  console.error('Failed to load payout proof image:', {
                    url: selectedImage,
                    apiBase: API_BASE,
                    timestamp: new Date().toISOString()
                  });
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%236b7280"%3EImage not found%3C/text%3E%3C/svg%3E';
                }}
                onLoad={() => {
                  console.log('Successfully loaded payout proof image:', selectedImage);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Payout Request Modal */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Edit Payout Request</h3>
              <button
                onClick={() => {
                  setEditingRequest(null);
                  setEditFormData({ amount: '', utr: '', remarks: '', proof: null });
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  UTR / Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.utr}
                  onChange={(e) => setEditFormData({ ...editFormData, utr: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter UTR or reference number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={editFormData.remarks}
                  onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter remarks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Proof Screenshot (Optional - leave empty to keep existing)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file type
                      const isValidImage = file.type.startsWith('image/');
                      const isValidPdf = file.type === 'application/pdf';
                      if (!isValidImage && !isValidPdf) {
                        alert(`${file.name} is not a valid image or PDF file`);
                        return;
                      }

                      // Validate file size (max 10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        alert(`${file.name} is too large. Maximum size is 10MB`);
                        return;
                      }

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        setEditFormData({ ...editFormData, proof: result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {editFormData.proof && (
                  <p className="mt-2 text-xs text-emerald-600">New proof file selected</p>
                )}
                {editingRequest.proofFilename && !editFormData.proof && (
                  <p className="mt-2 text-xs text-slate-500">Current proof will be kept</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => {
                  setEditingRequest(null);
                  setEditFormData({ amount: '', utr: '', remarks: '', proof: null });
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={processingId === editingRequest.id || uploadingProof || !editFormData.amount || !editFormData.utr || !editFormData.remarks}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {processingId === editingRequest.id || uploadingProof ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
