"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, clearAuth } from "../utils/auth";
import { authApi, businessesApi, Business } from "../utils/api";

export default function Header() {
  const router = useRouter();
  const user = getUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessSearch, setBusinessSearch] = useState("");
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const businessDropdownRef = useRef<HTMLDivElement>(null);

  const userInitials = user?.email
    ?.split("@")[0]
    .substring(0, 2)
    .toUpperCase() || "AD";

  // Fetch businesses on mount
  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoadingBusinesses(true);
      const response = await businessesApi.getAll();
      setBusinesses(response.businesses || []);
      // Set first business as selected by default
      if (response.businesses && response.businesses.length > 0) {
        setSelectedBusiness(response.businesses[0]);
        // Store in localStorage for persistence
        localStorage.setItem('selectedBusinessId', response.businesses[0].id);
      }
    } catch (err) {
      console.error("Error fetching businesses:", err);
    } finally {
      setLoadingBusinesses(false);
    }
  };

  // Load selected business from localStorage on mount
  useEffect(() => {
    const savedBusinessId = localStorage.getItem('selectedBusinessId');
    if (savedBusinessId && businesses.length > 0) {
      const business = businesses.find(b => b.id === savedBusinessId);
      if (business) {
        setSelectedBusiness(business);
      }
    }
  }, [businesses]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (businessDropdownRef.current && !businessDropdownRef.current.contains(event.target as Node)) {
        setShowBusinessDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    localStorage.setItem('selectedBusinessId', business.id);
    setShowBusinessDropdown(false);
    setBusinessSearch("");
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(businessSearch.toLowerCase())
  );

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-dark">Finance Control Center</h1>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          Live
        </span>
      </div>
      <div className="flex items-center gap-4">
        {/* Business Selector */}
        <div className="relative" ref={businessDropdownRef}>
          <button
            onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 hover:border-primary transition-colors"
          >
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">
              {selectedBusiness ? selectedBusiness.name : loadingBusinesses ? "Loading..." : "Select Business"}
            </span>
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showBusinessDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg z-50">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search Business"
                  value={businessSearch}
                  onChange={(e) => setBusinessSearch(e.target.value)}
                  className="w-full rounded-lg border border-primary px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredBusinesses.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">
                    {businessSearch ? "No businesses found" : "No businesses"}
                  </div>
                ) : (
                  filteredBusinesses.map((business) => (
                    <button
                      key={business.id}
                      onClick={() => handleBusinessSelect(business)}
                      className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                        selectedBusiness?.id === business.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          selectedBusiness?.id === business.id 
                            ? 'border-primary bg-primary' 
                            : 'border-slate-300'
                        }`}>
                          {selectedBusiness?.id === business.id && (
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{business.name}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-slate-200 p-2">
                <button
                  onClick={() => {
                    setShowBusinessDropdown(false);
                    router.push("/add-new-business");
                  }}
                  className="w-full flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Business
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <button className="rounded-full border border-slate-200 px-4 py-2 hover:border-primary hover:text-primary transition-colors">
            Audit Trail
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 hover:border-primary transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {userInitials}
              </span>
              <span>{user?.email || "Admin"}</span>
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="py-2">
                  <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100">
                    {user?.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

