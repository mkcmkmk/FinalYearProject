import { useState, useEffect, useMemo } from "react";
import AdminLayout from "../components/AdminLayout";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toLocaleString()}`;

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const statusStyles = {
  active: "bg-neutral-800 text-white",
  pending: "bg-neutral-200 text-neutral-800",
  expired: "bg-neutral-100 text-neutral-600 border border-neutral-300",
  none: "bg-neutral-50 text-neutral-500",
};

const periodOptions = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

const AdminPayments = () => {
  const token = localStorage.getItem("token");
  const [subscriptions, setSubscriptions] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("month");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE}/api/admin/subscriptions?period=${period}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        if (data.success) {
          setSubscriptions(data.subscriptions);
          setTotalRevenue(data.totalRevenue);
        } else {
          setError(data.message || "Failed to fetch subscriptions.");
        }
      } catch (err) {
        console.error("Error fetching subscriptions:", err);
        setError("Network error fetching subscriptions.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchSubscriptions();
  }, [token, period]);

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subscriptions;

    return subscriptions.filter((sub) =>
      [sub.userName, sub.userEmail, sub.teacherName, sub.instrument, sub.plan, sub.status, sub.groupName]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [subscriptions, search]);

  const displayRevenue = useMemo(() => {
    if (!search.trim()) return totalRevenue;
    return filteredSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  }, [filteredSubscriptions, search, totalRevenue]);

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[2rem] overflow-hidden shadow-sm border border-neutral-200">
        <header className="min-h-[70px] bg-white border-b border-neutral-200 flex items-center justify-between px-5 py-3 rounded-t-[1.25rem]">
          <div>
            <h1 className="text-xl font-bold m-0 text-neutral-900">Payments & Subscriptions</h1>
            <p className="text-sm text-neutral-500 m-0">
              All subscription records and revenue by period
            </p>
          </div>
          {!loading && (
            <span className="text-sm font-medium text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-200">
              {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? "s" : ""}
            </span>
          )}
        </header>

        <div className="p-5 overflow-auto flex-1 bg-neutral-50 flex flex-col">
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="search"
              placeholder="Search by student, teacher, instrument..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2.5 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-500"
            />
            <div className="flex gap-2 flex-wrap">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    period === option.value
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-neutral-100 text-neutral-800 border border-neutral-300 p-3 rounded-xl mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center flex-1 min-h-[200px]">
              <p className="text-gray-500 font-medium animate-pulse">Loading subscriptions...</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Student</th>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Instrument</th>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Teacher</th>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Group</th>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-4 align-middle">
                          <p className="m-0 font-bold text-gray-800 text-sm">{sub.userName}</p>
                          <p className="m-0 text-xs text-gray-500">{sub.userEmail}</p>
                        </td>
                        <td className="p-4 align-middle">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200 capitalize">
                            {sub.plan}
                          </span>
                          <p className="m-0 mt-1 text-[11px] text-gray-400 capitalize">{sub.level}</p>
                        </td>
                        <td className="p-4 align-middle text-sm text-gray-700 font-medium">
                          {sub.instrument}
                        </td>
                        <td className="p-4 align-middle text-sm text-gray-600">
                          {sub.teacherName}
                        </td>
                        <td className="p-4 align-middle text-sm text-gray-600">
                          {sub.groupName || "—"}
                        </td>
                        <td className="p-4 align-middle">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                              statusStyles[sub.status] || "bg-gray-50 text-gray-700"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-sm font-bold text-gray-800">
                          {formatCurrency(sub.amount)}
                        </td>
                        <td className="p-4 align-middle text-sm text-gray-600">
                          {formatDate(sub.paidAt || sub.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {filteredSubscriptions.length === 0 && !error && (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-gray-500 text-sm">
                          No subscriptions found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 bg-neutral-900 rounded-2xl px-6 py-5 flex items-center justify-between border border-neutral-800">
                <div>
                  <p className="m-0 text-sm font-medium text-neutral-300">
                    Total Revenue — {periodOptions.find((o) => o.value === period)?.label}
                    {search.trim() ? " (filtered)" : ""}
                  </p>
                  <p className="m-0 text-xs text-neutral-500 mt-0.5">
                    Based on {filteredSubscriptions.length} subscription
                    {filteredSubscriptions.length !== 1 ? "s" : ""} shown
                  </p>
                </div>
                <p className="m-0 text-3xl font-extrabold text-white tracking-tight">
                  {formatCurrency(displayRevenue)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
