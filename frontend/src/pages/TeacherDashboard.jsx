import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./TeacherDashboard.css";

const API_BASE = "http://localhost:3000/api/teacher";
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const emptyAssignmentForm = {
  groupName: "",
  instrument: "",
  capacity: 8,
};

const emptyScheduleForm = {
  groupId: "",
  dayOfWeek: "Monday",
  startTime: "15:00",
  endTime: "16:00",
  room: "",
  notes: "",
};

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const teacherInstrument =
    dashboard?.expertiseInstruments?.[0] || dashboard?.teacher?.instrumentExpertise || "";

  const loadDashboard = async () => {
    if (!token) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/dashboard`, authHeaders);
      const data = res.data;
      const expertiseInstrument =
        data?.expertiseInstruments?.[0] || data?.teacher?.instrumentExpertise || "";

      setDashboard(data);
      setAssignmentForm((prev) => ({
        ...prev,
        instrument: expertiseInstrument || prev.instrument,
      }));

      if (data.groups?.length && !scheduleForm.groupId) {
        setScheduleForm((prev) => ({ ...prev, groupId: data.groups[0]._id }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load teacher dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const toggleStudent = (subscriptionId) => {
    setSelectedStudents((prev) =>
      prev.includes(subscriptionId)
        ? prev.filter((id) => id !== subscriptionId)
        : [...prev, subscriptionId]
    );
  };

  const handleAssignStudents = async (event) => {
    event.preventDefault();
    setSavingGroup(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        `${API_BASE}/groups/assign`,
        {
          subscriptionIds: selectedStudents,
          groupName: assignmentForm.groupName,
          instrument: teacherInstrument || assignmentForm.instrument,
          capacity: Number(assignmentForm.capacity),
        },
        authHeaders
      );

      setMessage(res.data.message || "Students assigned successfully");
      setSelectedStudents([]);
      setAssignmentForm((prev) => ({
        ...emptyAssignmentForm,
        instrument: teacherInstrument || prev.instrument,
      }));
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to assign students");
    } finally {
      setSavingGroup(false);
    }
  };

  const handleCreateSchedule = async (event) => {
    event.preventDefault();
    setSavingSchedule(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/schedules`, scheduleForm, authHeaders);
      setMessage(res.data.message || "Class schedule created");
      setScheduleForm((prev) => ({ ...emptyScheduleForm, groupId: prev.groupId }));
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create schedule");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const groupedSchedules = useMemo(() => {
    const entries = dashboard?.schedules || [];
    return DAYS.map((day) => ({
      day,
      items: entries.filter((entry) => entry.dayOfWeek === day),
    })).filter((section) => section.items.length > 0);
  }, [dashboard]);

  const studentPool = dashboard?.studentPool || [];

  if (loading) {
    return <div className="teacher-shell"><div className="teacher-empty">Loading teacher dashboard...</div></div>;
  }

  if (error && !dashboard) {
    return (
      <div className="teacher-shell">
        <div className="teacher-empty">
          <p>{error}</p>
          <button className="teacher-primary" onClick={() => navigate("/login")}>Go to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-shell">
      <header className="teacher-topbar">
        <div>
          <p className="teacher-kicker">Teacher dashboard</p>
          <h1>Welcome back, {user?.name || dashboard?.teacher?.name || "Teacher"}</h1>
          <p className="teacher-subtitle">
            Organize student groups, monitor class load, design the weekly schedule, and keep conversations moving.
          </p>
        </div>

        <div className="teacher-actions">
          <button className="teacher-secondary" onClick={() => navigate("/chat")}>Open Chat</button>
          <button className="teacher-secondary" onClick={() => navigate("/teacher-profile")}>Profile</button>
          <button className="teacher-primary" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="teacher-banner teacher-banner--error">{error}</div>}
      {message && <div className="teacher-banner teacher-banner--ok">{message}</div>}

      <section className="teacher-stats">
        <article className="teacher-stat-card">
          <span>Total groups</span>
          <strong>{dashboard?.summary?.totalGroups || 0}</strong>
        </article>
        <article className="teacher-stat-card">
          <span>Assigned students</span>
          <strong>{dashboard?.summary?.totalStudents || 0}</strong>
        </article>
        <article className="teacher-stat-card">
          <span>Waiting for group</span>
          <strong>{dashboard?.summary?.unassignedStudents || 0}</strong>
        </article>
        <article className="teacher-stat-card">
          <span>Weekly classes</span>
          <strong>{dashboard?.summary?.totalSchedules || 0}</strong>
        </article>
      </section>

      <section className="teacher-grid teacher-grid--top">
        <article className="teacher-card">
          <div className="teacher-card-head">
            <div>
              <p className="teacher-section-kicker">Student placement</p>
              <h2>Assign or move students between groups</h2>
              {teacherInstrument ? (
                <p className="teacher-subtitle">Showing subscribed students for {teacherInstrument}.</p>
              ) : null}
            </div>
            <span className="teacher-chip">{selectedStudents.length} selected</span>
          </div>

          <div className="teacher-student-list">
            {studentPool.length === 0 ? (
              <div className="teacher-empty teacher-empty--small">No active students are available for your instrument expertise right now.</div>
            ) : (
              studentPool.map((subscription) => (
                <label className="teacher-student-row" key={subscription._id}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(subscription._id)}
                    onChange={() => toggleStudent(subscription._id)}
                  />
                  <div>
                    <strong>{subscription.user?.name || "Student"}</strong>
                    <p>{subscription.user?.email || "No email"}</p>
                    <small>
                      Current group: {subscription.currentGroupName} · {subscription.assignmentState}
                    </small>
                  </div>
                  <span>{subscription.instrument}</span>
                </label>
              ))
            )}
          </div>

          <form className="teacher-form" onSubmit={handleAssignStudents}>
            <div className="teacher-form-grid">
              <label>
                Group name
                <input
                  value={assignmentForm.groupName}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({ ...prev, groupName: event.target.value }))
                  }
                  placeholder="Beginner Piano A"
                  required
                />
              </label>
              <label>
                Instrument
                <input
                  value={teacherInstrument || assignmentForm.instrument}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({ ...prev, instrument: event.target.value }))
                  }
                  placeholder="Piano"
                  readOnly={Boolean(teacherInstrument)}
                  required
                />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  min="1"
                  value={assignmentForm.capacity}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({ ...prev, capacity: event.target.value }))
                  }
                />
              </label>
            </div>
            <button className="teacher-primary" type="submit" disabled={savingGroup || selectedStudents.length === 0}>
              {savingGroup ? "Saving group..." : "Assign selected students"}
            </button>
          </form>
        </article>

        <article className="teacher-card">
          <div className="teacher-card-head">
            <div>
              <p className="teacher-section-kicker">Schedule design</p>
              <h2>Design your class schedule</h2>
            </div>
          </div>

          <form className="teacher-form" onSubmit={handleCreateSchedule}>
            <div className="teacher-form-grid teacher-form-grid--schedule">
              <label>
                Group
                <select
                  value={scheduleForm.groupId}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({ ...prev, groupId: event.target.value }))
                  }
                  required
                >
                  <option value="">Select a group</option>
                  {(dashboard?.groups || []).map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.groupName} ({group.instrument})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Day
                <select
                  value={scheduleForm.dayOfWeek}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({ ...prev, dayOfWeek: event.target.value }))
                  }
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>
              <label>
                Start time
                <input
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                End time
                <input
                  type="time"
                  value={scheduleForm.endTime}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Room
                <input
                  value={scheduleForm.room}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({ ...prev, room: event.target.value }))
                  }
                  placeholder="Studio 2"
                />
              </label>
              <label className="teacher-field-full">
                Notes
                <textarea
                  value={scheduleForm.notes}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Focus on chord transitions and ensemble timing"
                  rows="4"
                />
              </label>
            </div>
            <button className="teacher-primary" type="submit" disabled={savingSchedule || !scheduleForm.groupId}>
              {savingSchedule ? "Saving schedule..." : "Create class slot"}
            </button>
          </form>
        </article>
      </section>

      <section className="teacher-grid">
        <article className="teacher-card">
          <div className="teacher-card-head">
            <div>
              <p className="teacher-section-kicker">Group overview</p>
              <h2>Your active groups</h2>
            </div>
          </div>

          <div className="teacher-group-list">
            {(dashboard?.groups || []).length === 0 ? (
              <div className="teacher-empty teacher-empty--small">Create a group by assigning students first.</div>
            ) : (
              dashboard.groups.map((group) => (
                <div className="teacher-group-card" key={group._id}>
                  <div className="teacher-group-head">
                    <div>
                      <h3>{group.groupName}</h3>
                      <p>{group.instrument}</p>
                    </div>
                    <span>{group.filled}/{group.capacity} students</span>
                  </div>
                  <div className="teacher-roster">
                    {group.students?.length ? (
                      group.students.map((student) => (
                        <div className="teacher-roster-item" key={student._id}>
                          <strong>{student.user?.name || "Student"}</strong>
                          <span>{student.user?.email || "No email"}</span>
                        </div>
                      ))
                    ) : (
                      <div className="teacher-empty teacher-empty--small">No students assigned yet.</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="teacher-card">
          <div className="teacher-card-head">
            <div>
              <p className="teacher-section-kicker">Weekly plan</p>
              <h2>Scheduled classes</h2>
            </div>
          </div>

          <div className="teacher-schedule-board">
            {groupedSchedules.length === 0 ? (
              <div className="teacher-empty teacher-empty--small">No class schedule added yet.</div>
            ) : (
              groupedSchedules.map((section) => (
                <div className="teacher-day-block" key={section.day}>
                  <h3>{section.day}</h3>
                  {section.items.map((item) => (
                    <div className="teacher-slot" key={item._id}>
                      <div>
                        <strong>{item.groupName}</strong>
                        <p>{item.instrument}</p>
                      </div>
                      <div className="teacher-slot-meta">
                        <span>{item.startTime} - {item.endTime}</span>
                        <span>{item.room || "Room not set"}</span>
                      </div>
                      {item.notes ? <p className="teacher-slot-note">{item.notes}</p> : null}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
};

export default TeacherDashboard;

