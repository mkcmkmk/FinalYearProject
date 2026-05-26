import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";

const TASKS_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/tasks`
  : "http://localhost:3000/api/tasks";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const FILTER_OPTIONS = ["All", "To do", "In progress", "Done"];

const statusLabel = (value) =>
  STATUS_OPTIONS.find((option) => option.value === value)?.label || "To do";

const statusBadgeClass = (value) => {
  if (value === "done") return "bg-emerald-100 text-emerald-800";
  if (value === "in_progress") return "bg-amber-100 text-amber-800";
  return "bg-[#ded6ff] text-[#7a5cff]";
};

const formatDeadline = (dueDate) => {
  if (!dueDate) return "No deadline";
  const date = new Date(dueDate);
  const now = new Date();
  const isOverdue = date < now;
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return isOverdue ? `${formatted} (overdue)` : formatted;
};

const filterToStatus = (filter) => {
  if (filter === "To do") return "todo";
  if (filter === "In progress") return "in_progress";
  if (filter === "Done") return "done";
  return null;
};

const StudentTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const loadTasks = useCallback(async () => {
    if (!token) {
      setError("Please log in to view your tasks.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${TASKS_API}/student`, authHeaders);
      const list = Array.isArray(res.data?.tasks) ? res.data.tasks : [];
      setTasks(list);
      setSelectedId((current) => {
        if (current && list.some((task) => task.id === current)) return current;
        return list[0]?.id || null;
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load tasks.");
      setTasks([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    const statusValue = filterToStatus(filter);
    if (!statusValue) return tasks;
    return tasks.filter((task) => task.studentStatus === statusValue);
  }, [tasks, filter]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedId) || null,
    [tasks, selectedId]
  );

  const handleStatusChange = async (nextStatus) => {
    if (!selectedTask || selectedTask.studentStatus === nextStatus) return;

    try {
      setUpdating(true);
      setError("");
      setMessage("");

      const res = await axios.patch(
        `${TASKS_API}/${selectedTask.id}/status`,
        { status: nextStatus },
        authHeaders
      );

      const updated = res.data?.task;
      if (updated) {
        setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
        setMessage("Status updated successfully.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update task status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <StudentLayout>
      <div className="flex flex-col gap-4 h-full overflow-hidden pb-2">
        <section className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">My work</p>
            <h1 className="text-2xl font-extrabold text-gray-900">Group tasks</h1>
            <p className="text-sm text-gray-500 mt-1">
              View task details, deadlines, and update your progress.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/student-dashboard")}
            className="px-5 py-3 border-2 border-gray-100 rounded-[1.25rem] font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back to dashboard
          </button>
        </section>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-[1.25rem] text-sm font-semibold">{error}</div>
        )}
        {message && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-[1.25rem] text-sm font-semibold">{message}</div>
        )}

        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`px-5 py-2.5 rounded-[1.25rem] text-sm font-bold transition-colors ${
                filter === option
                  ? "bg-[#1e1e1e] text-white"
                  : "border-2 border-gray-100 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-white rounded-[2rem] text-gray-400 font-semibold text-sm">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[2rem] p-10 text-center gap-2">
            <p className="font-bold text-gray-500">No tasks found.</p>
            <p className="text-sm text-gray-400 max-w-md">
              {tasks.length === 0
                ? "Your teacher has not assigned tasks to your group yet."
                : "Try a different filter to see more tasks."}
            </p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0 overflow-hidden">
            <div className="lg:col-span-2 bg-white rounded-[2rem] p-5 shadow-sm flex flex-col overflow-hidden">
              <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">
                Task list ({filteredTasks.length})
              </h2>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedId(task.id)}
                    className={`w-full text-left p-4 rounded-[1.25rem] border-2 transition-colors ${
                      selectedId === task.id
                        ? "border-[#1e1e1e] bg-gray-50"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h3 className="font-bold text-[15px] text-gray-900 leading-snug">{task.title}</h3>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${statusBadgeClass(
                          task.studentStatus
                        )}`}
                      >
                        {statusLabel(task.studentStatus)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mb-1">
                      {task.groupName} • {task.instrument}
                    </p>
                    <p className="text-xs text-gray-500 font-semibold">{formatDeadline(task.dueDate)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 bg-white rounded-[2rem] p-7 shadow-sm flex flex-col overflow-hidden">
              {selectedTask ? (
                <>
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-5 border-b border-gray-100">
                    <div>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-3 ${statusBadgeClass(
                          selectedTask.studentStatus
                        )}`}
                      >
                        {statusLabel(selectedTask.studentStatus)}
                      </span>
                      <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
                        {selectedTask.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-2 font-medium">
                        {selectedTask.groupName} • {selectedTask.instrument}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-[#f8f9fb] rounded-[1.25rem] border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Deadline
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        {formatDeadline(selectedTask.dueDate)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#f8f9fb] rounded-[1.25rem] border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Assigned on
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        {selectedTask.createdAt
                          ? new Date(selectedTask.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Description
                    </p>
                    <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedTask.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-5 border-t border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Update status
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          disabled={updating}
                          onClick={() => handleStatusChange(option.value)}
                          className={`px-5 py-3 rounded-[1.25rem] text-sm font-bold transition-colors disabled:opacity-60 ${
                            selectedTask.studentStatus === option.value
                              ? "bg-[#1e1e1e] text-white"
                              : "border-2 border-gray-100 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {updating && (
                      <p className="text-xs text-gray-400 font-semibold mt-3">Saving status...</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 font-semibold text-sm">
                  Select a task to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentTasks;
