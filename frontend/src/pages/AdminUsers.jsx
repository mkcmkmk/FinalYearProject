import { useState, useEffect, useMemo } from "react";
import AdminLayout from "../components/AdminLayout";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const roleStyles = {
  admin: "bg-neutral-800 text-white",
  teacher: "bg-neutral-200 text-neutral-800",
  student: "bg-neutral-100 text-neutral-700",
};

const AdminUsers = () => {
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        } else {
          setError(data.message || "Failed to fetch users.");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Network error fetching users.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchUsers();
  }, [token]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesSearch =
        !query ||
        [user.name, user.email, user.role, user.instrumentExpertise]
          .some((value) => String(value || "").toLowerCase().includes(query));
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts = { all: users.length, admin: 0, teacher: 0, student: 0 };
    users.forEach((user) => {
      if (counts[user.role] !== undefined) counts[user.role] += 1;
    });
    return counts;
  }, [users]);

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[2rem] overflow-hidden shadow-sm border border-neutral-200">
        <header className="min-h-[70px] bg-white border-b border-neutral-200 flex items-center justify-between px-5 py-3 rounded-t-[1.25rem]">
          <div>
            <h1 className="text-xl font-bold m-0 text-neutral-900">All Users</h1>
            <p className="text-sm text-neutral-500 m-0">
              View every registered user and their details
            </p>
          </div>
          {!loading && (
            <span className="text-sm font-medium text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-200">
              {filteredUsers.length} of {users.length} users
            </span>
          )}
        </header>

        <div className="p-5 overflow-auto flex-1 bg-neutral-50">
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="search"
              placeholder="Search by name, email, or instrument..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2.5 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-500"
            />
            <div className="flex gap-2 flex-wrap">
              {["all", "student", "teacher", "admin"].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    roleFilter === role
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {role === "all" ? "All" : role.charAt(0).toUpperCase() + role.slice(1)}
                  <span className="ml-1 opacity-70">({roleCounts[role]})</span>
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
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500 font-medium animate-pulse">Loading users...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">User</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Membership</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors group">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                                user.role === "admin"
                                  ? "bg-neutral-800 text-white"
                                  : user.role === "teacher"
                                    ? "bg-neutral-200 text-neutral-800"
                                    : "bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {user.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div>
                            <p className="m-0 font-bold text-neutral-900 text-sm group-hover:text-neutral-600 transition-colors">
                              {user.name}
                            </p>
                            <p className="m-0 text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                            roleStyles[user.role] || "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-sm text-gray-700">
                        {user.contactNumber || "—"}
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.isMember
                              ? "bg-neutral-800 text-white"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {user.isMember ? "Active member" : "Not a member"}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-sm text-gray-600">
                        {user.role === "teacher" ? (
                          <div>
                            <p className="m-0 font-medium text-gray-700">
                              {user.instrumentExpertise || "No instrument listed"}
                            </p>
                            {user.yearsOfExperience != null && (
                              <p className="m-0 text-xs text-gray-400">
                                {user.yearsOfExperience} yrs experience
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <p className="m-0 text-sm font-medium text-gray-700">
                          {formatDate(user.createdAt)}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && !error && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500 text-sm">
                        {users.length === 0 ? "No users registered yet." : "No users match your search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
