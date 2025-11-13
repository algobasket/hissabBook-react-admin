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
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInDays = Math.floor(diffInSeconds / 86400);

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

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
          {/* Search and Add Button Section */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[300px]">
              <input
                type="text"
                placeholder="Search by book name..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              onClick={() => router.push("/add-new-cashbook")}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors whitespace-nowrap"
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    router.push(`/cashbooks/${book.id}`);
                  }}
                >
                  {/* Book Image */}
                  <div className="mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                    <Image
                      src="/images/1.png"
                      alt={book.name}
                      width={120}
                      height={120}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-dark mb-2">{book.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{formatDateAgo(book.createdAt)}</p>
                  {book.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{book.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{book.transactionCount}</span> transactions
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        book.totalBalance >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(book.totalBalance, book.currencyCode)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Add Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-dark mb-2">Add New Book</h3>
            <p className="text-sm text-slate-600 mb-4">Click to quickly add books for</p>
            <div className="flex flex-wrap gap-2">
              {quickBookTemplates.map((template) => (
                <button
                  key={template}
                  onClick={() => handleQuickBook(template)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
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
