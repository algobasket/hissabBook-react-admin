"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import { booksApi, transactionsApi, usersApi, Book, Transaction, EndUser } from "../../utils/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params?.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<EndUser[]>([]);
  const [bookUsers, setBookUsers] = useState<EndUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    if (bookId) {
      fetchBook();
      fetchTransactions();
      fetchUsers();
    }
  }, [router, bookId]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await booksApi.getById(bookId);
      setBook(response.book);
    } catch (err: any) {
      console.error("Error fetching book:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to load book";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const response = await transactionsApi.getByBookId(bookId, { limit: 100 });
      setTransactions(response.transactions || []);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      // Fetch all users for the dropdown
      const allUsersResponse = await usersApi.getAllUsers();
      setUsers(allUsersResponse.users || []);
      
      // Fetch users associated with this book
      const bookUsersResponse = await booksApi.getUsers(bookId);
      setBookUsers(bookUsersResponse.users || []);
    } catch (err: any) {
      console.error("Error fetching users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserId) return;

    setAddingUser(true);
    try {
      const response = await booksApi.addUser(bookId, { userId: selectedUserId });
      // Refresh the book users list
      const bookUsersResponse = await booksApi.getUsers(bookId);
      setBookUsers(bookUsersResponse.users || []);
      setShowAddUserModal(false);
      setSelectedUserId("");
    } catch (err: any) {
      console.error("Error adding user to book:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to add user to book";
      alert(errorMessage);
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this user from the book?")) {
      return;
    }

    try {
      await booksApi.removeUser(bookId, userId);
      // Refresh the book users list
      const bookUsersResponse = await booksApi.getUsers(bookId);
      setBookUsers(bookUsersResponse.users || []);
    } catch (err: any) {
      console.error("Error removing user from book:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to remove user from book";
      alert(errorMessage);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      credit: "bg-emerald-100 text-emerald-800",
      debit: "bg-red-100 text-red-800",
      transfer: "bg-blue-100 text-blue-800",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          colors[type as keyof typeof colors] || "bg-slate-100 text-slate-800"
        }`}
      >
        {type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: "bg-emerald-100 text-emerald-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          colors[status as keyof typeof colors] || "bg-slate-100 text-slate-800"
        }`}
      >
        {status}
      </span>
    );
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Header />
          <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
              <p className="text-slate-600">Loading book details...</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Header />
          <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error || "Book not found"}
              </div>
              <button
                onClick={() => router.push("/cashbooks")}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Back to Cashbooks
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
          {/* Book Header */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <button
                    onClick={() => router.push("/cashbooks")}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    ← Back
                  </button>
                </div>
                <h1 className="text-3xl font-semibold text-dark">{book.name}</h1>
                {book.description && (
                  <p className="mt-2 text-slate-600">{book.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Balance</p>
                <p
                  className={`text-2xl font-bold ${
                    book.totalBalance >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(book.totalBalance, book.currencyCode)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Transactions
                </p>
                <p className="mt-1 text-2xl font-semibold text-dark">{book.transactionCount}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</p>
                <p className="mt-1 text-sm font-medium text-dark">{book.ownerName}</p>
                <p className="text-xs text-slate-500">{book.ownerEmail}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </p>
                <p className="mt-1 text-sm font-medium text-dark">
                  {new Date(book.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Book Users Section */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-dark">People in this Book</h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                + Add People
              </button>
            </div>

            {bookUsers.length === 0 ? (
              <p className="text-sm text-slate-500">No people added to this book yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bookUsers.map((user) => (
                  <div
                    key={user.id}
                    className="group relative rounded-lg border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition-colors"
                  >
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="absolute right-2 top-2 hidden rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200 group-hover:block transition-colors"
                      title="Remove user"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="font-medium text-dark pr-6">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transactions Section */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <h2 className="mb-6 text-xl font-semibold text-dark">Transactions</h2>

            {transactionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Loading transactions...</div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p>No transactions found for this book.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(transaction.occurredAt)}
                        </td>
                        <td className="px-4 py-3">{getTypeBadge(transaction.type)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <div>
                            <div className="font-medium">{transaction.userFullName}</div>
                            {transaction.userEmail && (
                              <div className="text-xs text-slate-500">{transaction.userEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {transaction.description || "-"}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(transaction.status)}</td>
                        <td
                          className={`px-4 py-3 text-right text-sm font-semibold ${
                            transaction.type === "credit"
                              ? "text-emerald-600"
                              : transaction.type === "debit"
                              ? "text-red-600"
                              : "text-slate-600"
                          }`}
                        >
                          {transaction.type === "debit" ? "-" : "+"}
                          {formatCurrency(Math.abs(transaction.amount), transaction.currencyCode)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-dark">Add People to Book</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a user...</option>
                {users
                  .filter((u) => !bookUsers.find((bu) => bu.id === u.id))
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddUser}
                disabled={!selectedUserId || addingUser}
                className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingUser ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setSelectedUserId("");
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

