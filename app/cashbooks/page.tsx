"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { isAuthenticated } from "../utils/auth";
import { booksApi, Book } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function CashbooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchBooks();
  }, [router, mounted, selectedStatus, searchQuery]);

  const fetchBooks = () => {
    setLoading(true);
    setError(null);

    booksApi
      .getAll({
        status: selectedStatus,
        search: searchQuery,
      })
      .then((response) => {
        setBooks(response.books);
      })
      .catch((err: any) => {
        console.error("Error fetching books:", err);
        const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to load cashbooks";
        setError(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  };


  const formatDateAgo = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    
    // Calculate calendar day difference (not just 24-hour periods)
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffInDays = Math.floor((nowStart.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Created today";
    } else if (diffInDays === 1) {
      return "Created 1 day ago";
    } else if (diffInDays < 7) {
      return `Created ${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Created ${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `Created ${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `Created ${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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

  const quickBookTemplates = [
    "November Expenses",
    "Account Book",
    "Staff Salary",
    "Receivable Book",
  ];

  const handleQuickBook = (template: string) => {
    router.push(`/add-new-cashbook?name=${encodeURIComponent(template)}`);
  };

  const handleDeleteBook = async (bookId: string, bookName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!window.confirm(`Are you sure you want to delete "${bookName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingBookId(bookId);
      await booksApi.delete(bookId);
      // Refresh the books list
      fetchBooks();
    } catch (err: any) {
      console.error("Error deleting book:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to delete book";
      alert(errorMessage);
    } finally {
      setDeletingBookId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-7xl flex-col gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6 py-4 sm:py-6 md:py-10">
          {/* Search and Add Button Section */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 w-full sm:min-w-[200px]">
              <input
                type="text"
                placeholder="Search by book name..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 sm:py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              onClick={() => router.push("/add-new-cashbook")}
              className="w-full sm:w-auto rounded-full bg-primary px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              + Add New Book
            </button>
          </div>

          {/* Cashbooks Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-600">Loading cashbooks...</div>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-slate-600 mb-2">No cashbooks found</p>
              <p className="text-sm text-slate-500">Create your first cashbook to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {books.map((book) => {
                const isDeleting = deletingBookId === book.id;
                return (
                  <div
                    key={book.id}
                    className="group relative rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      if (!isDeleting) {
                        router.push(`/cashbooks/${book.id}`);
                      }
                    }}
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteBook(book.id, book.name, e)}
                      disabled={isDeleting}
                      className="absolute right-2 sm:right-3 top-2 sm:top-3 z-10 rounded-lg bg-red-50 p-1.5 sm:p-2 text-red-600 opacity-100 sm:opacity-0 transition-opacity hover:bg-red-100 group-hover:opacity-100 disabled:opacity-50"
                      title="Delete Book"
                    >
                      {isDeleting ? (
                        <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600"></div>
                      ) : (
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>

                    {/* Book Image */}
                    <div className="mb-3 sm:mb-4 flex h-24 sm:h-32 w-full items-center justify-center overflow-hidden rounded-lg sm:rounded-xl bg-slate-50">
                      <Image
                        src="/images/1.png"
                        alt={book.name}
                        width={120}
                        height={120}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-semibold text-dark mb-1.5 sm:mb-2 pr-8 sm:pr-10">{book.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mb-2 sm:mb-4">{formatDateAgo(book.createdAt)}</p>
                    {book.description && (
                      <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-4 line-clamp-2">{book.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{book.transactionCount}</span> transactions
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-semibold ${
                          book.totalBalance >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(book.totalBalance, book.currencyCode)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Add Section */}
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-dark mb-2">Add New Book</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">Click to quickly add books for</p>
            <div className="flex flex-wrap gap-2">
              {quickBookTemplates.map((template) => (
                <button
                  key={template}
                  onClick={() => handleQuickBook(template)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
