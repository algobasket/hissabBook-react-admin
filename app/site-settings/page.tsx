"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { settingsApi } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function SiteSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Site settings form fields
  const [siteName, setSiteName] = useState<string>("");
  const [siteDescription, setSiteDescription] = useState<string>("");
  const [siteEmail, setSiteEmail] = useState<string>("");
  const [sitePhone, setSitePhone] = useState<string>("");
  const [siteAddress, setSiteAddress] = useState<string>("");
  
  // Logo upload states
  const [siteLogo, setSiteLogo] = useState<File | null>(null);
  const [siteLogoPreview, setSiteLogoPreview] = useState<string | null>(null);
  const [siteLogoUrl, setSiteLogoUrl] = useState<string | null>(null);
  const [siteLogoError, setSiteLogoError] = useState<boolean>(false);
  
  const [smallLogo, setSmallLogo] = useState<File | null>(null);
  const [smallLogoPreview, setSmallLogoPreview] = useState<string | null>(null);
  const [smallLogoUrl, setSmallLogoUrl] = useState<string | null>(null);
  const [smallLogoError, setSmallLogoError] = useState<boolean>(false);
  
  const [bigLogo, setBigLogo] = useState<File | null>(null);
  const [bigLogoPreview, setBigLogoPreview] = useState<string | null>(null);
  const [bigLogoUrl, setBigLogoUrl] = useState<string | null>(null);
  const [bigLogoError, setBigLogoError] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchSiteSettings();
  }, [router, mounted]);

  const fetchSiteSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.getSiteSettings();
      setSiteName(data.siteName || "");
      setSiteDescription(data.siteDescription || "");
      setSiteEmail(data.siteEmail || "");
      setSitePhone(data.sitePhone || "");
      setSiteAddress(data.siteAddress || "");
      
      // Construct full URLs for logos if filenames are provided
      setSiteLogoUrl(data.siteLogoUrl ? (data.siteLogoUrl.startsWith('http') ? data.siteLogoUrl : `${API_BASE}/uploads/${data.siteLogoUrl}`) : null);
      setSmallLogoUrl(data.smallLogoUrl ? (data.smallLogoUrl.startsWith('http') ? data.smallLogoUrl : `${API_BASE}/uploads/${data.smallLogoUrl}`) : null);
      setBigLogoUrl(data.bigLogoUrl ? (data.bigLogoUrl.startsWith('http') ? data.bigLogoUrl : `${API_BASE}/uploads/${data.bigLogoUrl}`) : null);
      // Reset error states when fetching new data
      setSiteLogoError(false);
      setSmallLogoError(false);
      setBigLogoError(false);
    } catch (err: any) {
      console.error("Error fetching site settings:", err);
      // Don't show error if it's just that no settings exist yet (404)
      if (err?.status === 404) {
        // Settings don't exist yet, that's okay - use defaults
        setSiteName("");
        setSiteDescription("");
        setSiteEmail("");
        setSitePhone("");
        setSiteAddress("");
        setSiteLogoUrl(null);
        setSmallLogoUrl(null);
        setBigLogoUrl(null);
        setSiteLogoError(false);
        setSmallLogoError(false);
        setBigLogoError(false);
      } else {
        setError(err?.message || "Failed to load site settings. Please check if the backend server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (
    file: File | null,
    setPreview: (preview: string | null) => void,
    setFile: (file: File | null) => void,
    resetError?: () => void
  ) => {
    if (!file) {
      setPreview(null);
      setFile(null);
      if (resetError) resetError();
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    try {
      // Compress image before uploading
      const compressedFile = await compressImage(file, 1920, 1920, 0.85);
      
      // Read compressed file as base64 for preview and upload
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setPreview(base64String);
        setFile(compressedFile);
        setError(null);
        if (resetError) resetError();
      };
      reader.onerror = () => {
        setError("Failed to read image file");
      };
      reader.readAsDataURL(compressedFile);
    } catch (err: any) {
      console.error("Error compressing image:", err);
      setError(err?.message || "Failed to process image");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Convert files to base64 if they exist
      const siteLogoBase64 = siteLogo ? await fileToBase64(siteLogo) : null;
      const smallLogoBase64 = smallLogo ? await fileToBase64(smallLogo) : null;
      const bigLogoBase64 = bigLogo ? await fileToBase64(bigLogo) : null;

      // Only send logos if new ones were uploaded
      await settingsApi.updateSiteSettings({
        siteName,
        siteDescription,
        siteEmail,
        sitePhone,
        siteAddress,
        siteLogo: siteLogoBase64,
        smallLogo: smallLogoBase64,
        bigLogo: bigLogoBase64,
      });
      
      setSuccess("Site settings updated successfully!");
      
      // Clear file inputs after successful save
      setSiteLogo(null);
      setSmallLogo(null);
      setBigLogo(null);
      setSiteLogoPreview(null);
      setSmallLogoPreview(null);
      setBigLogoPreview(null);
      // Reset error states
      setSiteLogoError(false);
      setSmallLogoError(false);
      setBigLogoError(false);
      
      // Switch back to view mode after successful save
      setIsEditMode(false);
      
      // Refresh data from API to get the actual URLs
      await fetchSiteSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error updating site settings:", err);
      setError(err?.message || "Failed to update site settings");
    } finally {
      setSaving(false);
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

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-dark">Site Settings</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {isEditMode 
                    ? "Configure general site settings and information. These settings will be used across the application."
                    : "View and manage general site settings and information."}
                </p>
              </div>
              {!isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Edit
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                {success}
              </div>
            )}

            {loading ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary"></div>
                Loading site settings...
              </div>
            ) : isEditMode ? (
              <div className="mt-6 space-y-6">
                <div>
                  <label htmlFor="siteName" className="block text-sm font-medium text-slate-700 mb-2">
                    Site Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter site name"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label htmlFor="siteDescription" className="block text-sm font-medium text-slate-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    id="siteDescription"
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    rows={4}
                    className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter site description"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label htmlFor="siteEmail" className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="siteEmail"
                    value={siteEmail}
                    onChange={(e) => setSiteEmail(e.target.value)}
                    className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="contact@example.com"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label htmlFor="sitePhone" className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="sitePhone"
                    value={sitePhone}
                    onChange={(e) => setSitePhone(e.target.value)}
                    className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="+1 234 567 8900"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label htmlFor="siteAddress" className="block text-sm font-medium text-slate-700 mb-2">
                    Site Address
                  </label>
                  <textarea
                    id="siteAddress"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    rows={3}
                    className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter site address"
                    disabled={saving}
                  />
                </div>

                {/* Logo Upload Section */}
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <h3 className="text-base font-semibold text-dark mb-4">Logo Settings</h3>
                  
                  <div className="space-y-6">
                    {/* Site Logo */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Site Logo
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="relative flex w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-primary hover:bg-slate-100">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              onChange={(e) => handleLogoUpload(e.target.files?.[0] || null, setSiteLogoPreview, setSiteLogo, () => setSiteLogoError(false))}
                              disabled={saving}
                            />
                            <div className="pointer-events-none">
                              <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="mt-2 text-sm font-medium text-slate-700">
                                {siteLogo ? siteLogo.name : "Click to upload site logo"}
                              </p>
                              <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                            </div>
                          </div>
                        </div>
                        {((siteLogoPreview && siteLogoPreview.trim() !== '' && !siteLogoError) || (siteLogoUrl && siteLogoUrl.trim() !== '' && !siteLogoError)) ? (
                          <div className="flex-shrink-0">
                            <div className="relative h-24 w-24 rounded-lg border border-slate-200 bg-white p-2">
                              <img
                                src={siteLogoPreview || siteLogoUrl || ""}
                                alt="Site Logo Preview"
                                className="h-full w-full object-contain"
                                onError={() => {
                                  setSiteLogoError(true);
                                }}
                              />
                            </div>
                          </div>
                        ) : (siteLogoPreview || siteLogoUrl) ? (
                          <div className="flex-shrink-0">
                            <div className="relative h-24 w-24 rounded-lg border border-slate-200 bg-white p-2 flex items-center justify-center">
                              <p className="text-xs text-slate-400">No Logo</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Small Logo */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Small Logo
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="relative flex w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-primary hover:bg-slate-100">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              onChange={(e) => handleLogoUpload(e.target.files?.[0] || null, setSmallLogoPreview, setSmallLogo, () => setSmallLogoError(false))}
                              disabled={saving}
                            />
                            <div className="pointer-events-none">
                              <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="mt-2 text-sm font-medium text-slate-700">
                                {smallLogo ? smallLogo.name : "Click to upload small logo"}
                              </p>
                              <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                            </div>
                          </div>
                        </div>
                        {((smallLogoPreview && smallLogoPreview.trim() !== '' && !smallLogoError) || (smallLogoUrl && smallLogoUrl.trim() !== '' && !smallLogoError)) ? (
                          <div className="flex-shrink-0">
                            <div className="relative h-24 w-24 rounded-lg border border-slate-200 bg-white p-2">
                              <img
                                src={smallLogoPreview || smallLogoUrl || ""}
                                alt="Small Logo Preview"
                                className="h-full w-full object-contain"
                                onError={() => {
                                  setSmallLogoError(true);
                                }}
                              />
                            </div>
                          </div>
                        ) : (smallLogoPreview || smallLogoUrl) ? (
                          <div className="flex-shrink-0">
                            <div className="relative h-24 w-24 rounded-lg border border-slate-200 bg-white p-2 flex items-center justify-center">
                              <p className="text-xs text-slate-400">No Logo</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Big Logo */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Big Logo
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="relative flex w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-primary hover:bg-slate-100">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              onChange={(e) => handleLogoUpload(e.target.files?.[0] || null, setBigLogoPreview, setBigLogo, () => setBigLogoError(false))}
                              disabled={saving}
                            />
                            <div className="pointer-events-none">
                              <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="mt-2 text-sm font-medium text-slate-700">
                                {bigLogo ? bigLogo.name : "Click to upload big logo"}
                              </p>
                              <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                            </div>
                          </div>
                        </div>
                        {((bigLogoPreview && bigLogoPreview.trim() !== '' && !bigLogoError) || (bigLogoUrl && bigLogoUrl.trim() !== '' && !bigLogoError)) ? (
                          <div className="flex-shrink-0">
                            <div className="relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                              <div className="relative h-32 w-32">
                                <img
                                  src={bigLogoPreview || bigLogoUrl || ""}
                                  alt="Big Logo Preview"
                                  className="h-full w-full object-contain"
                                  onError={() => {
                                    setBigLogoError(true);
                                  }}
                                />
                              </div>
                              <p className="mt-2 text-xs text-center text-slate-500">Preview</p>
                            </div>
                          </div>
                        ) : (bigLogoPreview || bigLogoUrl) ? (
                          <div className="flex-shrink-0">
                            <div className="relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                              <div className="relative h-32 w-32 flex items-center justify-center">
                                <p className="text-xs text-slate-400">No Logo</p>
                              </div>
                              <p className="mt-2 text-xs text-center text-slate-500">Preview</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading || saving}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      // Reset form to original values
                      fetchSiteSettings();
                    }}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* View Mode - Display Site Settings */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Site Name
                    </label>
                    <p className="text-sm font-medium text-slate-900">
                      {siteName || <span className="text-slate-400">Not set</span>}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Site Description
                    </label>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {siteDescription || <span className="text-slate-400">Not set</span>}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Contact Email
                    </label>
                    <p className="text-sm font-medium text-slate-900">
                      {siteEmail || <span className="text-slate-400">Not set</span>}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Contact Phone
                    </label>
                    <p className="text-sm font-medium text-slate-900">
                      {sitePhone || <span className="text-slate-400">Not set</span>}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Site Address
                    </label>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {siteAddress || <span className="text-slate-400">Not set</span>}
                    </p>
                  </div>

                  {/* Logo Display Section */}
                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <h3 className="text-base font-semibold text-dark mb-4">Logo Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Site Logo */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                          Site Logo
                        </label>
                        {(siteLogoUrl || siteLogoPreview) ? (
                          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="relative h-32 w-full">
                              <img
                                src={siteLogoUrl || siteLogoPreview || ""}
                                alt="Site Logo"
                                className="h-full w-full object-contain"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">No logo uploaded</p>
                        )}
                      </div>

                      {/* Small Logo */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                          Small Logo
                        </label>
                        {((smallLogoUrl && smallLogoUrl.trim() !== '' && !smallLogoError) || (smallLogoPreview && smallLogoPreview.trim() !== '' && !smallLogoError)) ? (
                          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="relative h-32 w-full">
                              <img
                                src={smallLogoUrl || smallLogoPreview || ""}
                                alt="Small Logo"
                                className="h-full w-full object-contain"
                                onError={() => {
                                  setSmallLogoError(true);
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="relative h-32 w-full flex items-center justify-center">
                              <p className="text-sm text-slate-400">No Logo</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Big Logo */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                          Big Logo
                        </label>
                        {((bigLogoUrl && bigLogoUrl.trim() !== '' && !bigLogoError) || (bigLogoPreview && bigLogoPreview.trim() !== '' && !bigLogoError)) ? (
                          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="relative h-32 w-full">
                              <img
                                src={bigLogoUrl || bigLogoPreview || ""}
                                alt="Big Logo"
                                className="h-full w-full object-contain"
                                onError={() => {
                                  setBigLogoError(true);
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="relative h-32 w-full flex items-center justify-center">
                              <p className="text-sm text-slate-400">No Logo</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

