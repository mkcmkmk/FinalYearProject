import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import TeacherLayout from "../components/TeacherLayout";
import "./TeacherTasks.css";

const API_BASE = "http://localhost:3000/api/teacher";
const TASKS_API = "http://localhost:3000/api/tasks";

const emptyTaskForm = {
  title: "",
  description: "",
  dueDate: "",
  groupId: "",
};

const TeacherTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");
      
      // Fetch teacher dashboard data to get their groups
      const dashboardRes = await axios.get(`${API_BASE}/dashboard`, authHeaders);
      setGroups(dashboardRes.data.groups || []);

      if (dashboardRes.data.groups?.length > 0 && !taskForm.groupId) {
        setTaskForm(prev => ({ ...prev, groupId: dashboardRes.data.groups[0]._id }));
      }

      // Fetch assigned tasks
      const tasksRes = await axios.get(`${TASKS_API}/teacher`, authHeaders);
      setTasks(tasksRes.data.tasks || []);
      
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load tasks data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignTask = async (event) => {
    event.preventDefault();
    setSavingTask(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        TASKS_API,
        taskForm,
        authHeaders
      );

      setMessage(res.data.message || "Task assigned successfully");
      setTaskForm(prev => ({ ...emptyTaskForm, groupId: prev.groupId }));
      await loadData(); // Reload tasks list
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to assign task");
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm text-center flex items-center justify-center h-full text-gray-400 font-bold text-sm">
          Loading tasks...
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="flex flex-col gap-4 h-full overflow-y-auto pt-4 pr-2 custom-scrollbar pb-6">
        {/* Header */}
        <header className="bg-white rounded-[2rem] p-7 shadow-sm flex flex-col gap-1 justify-center relative overflow-hidden border border-gray-50/50">
          <p className="text-[11px] font-bold text-purple-500 uppercase tracking-widest mb-1">Task Management</p>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-none">Assign Group Tasks</h1>
          <p className="text-xs text-gray-400 font-semibold mt-1 max-w-2xl leading-relaxed">
            Create tasks, assignments, or practice material and assign them to your active student groups.
          </p>
        </header>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-[1.25rem] text-xs font-bold">{error}</div>}
        {message && <div className="p-4 bg-green-50 text-green-600 rounded-[1.25rem] text-xs font-bold">{message}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Column 1: Task Assignment Form */}
          <article className="bg-white rounded-[2rem] p-7 shadow-sm flex flex-col gap-6 lg:col-span-1 border border-gray-50/50 h-fit">
            <div className="border-b border-gray-50 pb-3">
              <h2 className="text-xl font-extrabold text-gray-900">New Task</h2>
            </div>

            <form className="space-y-4" onSubmit={handleAssignTask}>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Group</label>
                <select
                  value={taskForm.groupId}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, groupId: event.target.value }))
                  }
                  className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold focus:outline-none focus:border-gray-200 cursor-pointer"
                  required
                >
                  <option value="" disabled>Select a group</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.groupName} ({group.instrument})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Task Title</label>
                <input
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200"
                  placeholder="e.g. Practice C major scale"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-medium placeholder-gray-300 focus:outline-none focus:border-gray-200 resize-none min-h-[100px]"
                  placeholder="Provide instructions or exercises..."
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))
                  }
                  className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold focus:outline-none focus:border-gray-200 cursor-pointer"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={savingTask || groups.length === 0}
                className="w-full mt-4 py-3.5 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-100 disabled:text-gray-400 rounded-[1.25rem] text-xs font-bold tracking-wider uppercase transition-colors"
              >
                {savingTask ? "Assigning..." : "Assign Task"}
              </button>
            </form>
          </article>

          {/* Column 2: Assigned Tasks List */}
          <article className="bg-white rounded-[2rem] p-7 shadow-sm flex flex-col gap-6 lg:col-span-2 border border-gray-50/50">
             <div className="border-b border-gray-50 pb-3 flex justify-between items-end">
              <h2 className="text-xl font-extrabold text-gray-900">Recently Assigned</h2>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{tasks.length} Total</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {tasks.length === 0 ? (
                 <div className="col-span-full text-center py-12 text-gray-400 font-bold text-xs bg-[#f8f9fb] rounded-[1.5rem] border border-gray-50">
                  No tasks assigned yet.
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task._id} className="p-5 bg-[#f8f9fb] border border-gray-100 rounded-[1.5rem] flex flex-col gap-3 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                       <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-extrabold uppercase tracking-wider inline-block">
                        {task.groupId?.groupName || "Unknown Group"}
                      </span>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-gray-900 text-md">{task.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-gray-200/50 flex justify-between items-center text-[11px] text-gray-400 font-bold">
                       <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                       <span>{task.groupId?.instrument || "Instrument"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherTasks;
