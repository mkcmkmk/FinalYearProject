import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import AdminLayout from "../components/AdminLayout";
import { useNavigate } from "react-router-dom";

const AdminTeachers = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/users/teachers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setTeachers(data.teachers);
        } else {
          setError(data.message || "Failed to fetch teachers.");
        }
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setError("Network error fetching teachers.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTeachers();
    }
  }, [token]);

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[2rem] overflow-hidden shadow-sm">
        <header className="min-h-[70px] bg-white/76 border-b border-[#6366f11f] flex items-center justify-between px-5 py-3 rounded-t-[1.25rem]">
          <div>
            <h1 className="text-xl font-bold m-0 text-gray-800">Registered Teachers</h1>
            <p className="text-sm text-gray-500 m-0">Manage all teachers on the platform</p>
          </div>
        </header>

        <div className="p-5 overflow-auto flex-1 bg-gray-50/50">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 font-medium animate-pulse">Loading teachers...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[860px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Teacher</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Expertise</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Groups</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Students</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 font-bold flex items-center justify-center shrink-0">
                            {teacher.name.charAt(0)}
                          </div>
                          <div>
                            <p className="m-0 font-bold text-gray-800 text-sm group-hover:text-green-600 transition-colors">
                              {teacher.name}
                            </p>
                            <p className="m-0 text-xs text-gray-500">{teacher.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {teacher.instrumentExpertise || "N/A"}
                        </span>
                        <p className="m-0 mt-1 text-[11px] text-gray-400">
                          {teacher.yearsOfExperience ? `${teacher.yearsOfExperience} yrs exp` : ""}
                        </p>
                      </td>
                      <td className="p-4 align-middle text-sm text-gray-700 font-medium">
                        {teacher.summary?.groups || 0}
                      </td>
                      <td className="p-4 align-middle text-sm text-gray-700 font-medium">
                        {teacher.summary?.assignedStudents || 0}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                          <span className="text-sm font-bold text-gray-700">
                            {teacher.ratings?.averageRating > 0 ? teacher.ratings.averageRating : "-"}
                          </span>
                          <span className="text-xs text-gray-400">({teacher.ratings?.totalRatings || 0})</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <button 
                          onClick={() => navigate(`/teachers/${teacher.id}`)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:border-green-500 hover:text-green-600 transition-all shadow-sm"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && !loading && !error && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500 text-sm">
                        No teachers found.
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

export default AdminTeachers;
