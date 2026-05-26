import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./AdminDashboard.css";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import AdminLayout from "../components/AdminLayout";

const API_BASE = "http://localhost:3000/api/admin";
const COLORS = ["#2b6fff", "#f59e0b", "#22c55e", "#a855f7", "#ef4444", "#14b8a6"];
const STATUS_OPTIONS = ["active", "pending", "expired", "none"];

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toLocaleString()}`;
const formatGrowth = (value) => `${value >= 0 ? "+" : ""}${value}%`;
const formatDate = (value) => new Date(value).toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [busyVerificationId, setBusyVerificationId] = useState("");
  const [busySubscriptionId, setBusySubscriptionId] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [publishingNotice, setPublishingNotice] = useState(false);
  const [busyNoticeId, setBusyNoticeId] = useState("");
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    message: "",
    audience: "all",
    isPinned: false,
  });

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

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
      setDashboard(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleVerification = async (verificationId, status) => {
    try {
      setBusyVerificationId(verificationId);
      setError("");
      setMessage("");
      const res = await axios.patch(
        `${API_BASE}/teacher-verifications/${verificationId}`,
        { status },
        authHeaders
      );
      setMessage(res.data.message || "Teacher verification updated");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update teacher request");
    } finally {
      setBusyVerificationId("");
    }
  };

  const handleSubscriptionStatus = async (subscriptionId, status) => {
    try {
      setBusySubscriptionId(subscriptionId);
      setError("");
      setMessage("");
      const res = await axios.patch(
        `${API_BASE}/subscriptions/${subscriptionId}`,
        { status },
        authHeaders
      );
      setMessage(res.data.message || "Subscription updated");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update subscription");
    } finally {
      setBusySubscriptionId("");
    }
  };

  const handleRemoveUser = async (entry) => {
    const confirmed = window.confirm(
      `Remove ${entry.name} (${entry.role}) from Harmoniq? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyUserId(entry.id);
      setError("");
      setMessage("");
      const res = await axios.delete(`${API_BASE}/users/${entry.id}`, authHeaders);
      setMessage(res.data.message || "User removed successfully");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to remove user");
    } finally {
      setBusyUserId("");
    }
  };

  const handleCreateNotice = async (event) => {
    event.preventDefault();

    try {
      setPublishingNotice(true);
      setError("");
      setMessage("");
      const res = await axios.post(`${API_BASE}/notices`, noticeForm, authHeaders);
      setMessage(res.data.message || "Notice published successfully");
      setNoticeForm({
        title: "",
        message: "",
        audience: "all",
        isPinned: false,
      });
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to publish notice");
    } finally {
      setPublishingNotice(false);
    }
  };

  const handleRemoveNotice = async (noticeId) => {
    const confirmed = window.confirm("Remove this admin notice?");
    if (!confirmed) {
      return;
    }

    try {
      setBusyNoticeId(noticeId);
      setError("");
      setMessage("");
      const res = await axios.delete(`${API_BASE}/notices/${noticeId}`, authHeaders);
      setMessage(res.data.message || "Notice removed successfully");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to remove notice");
    } finally {
      setBusyNoticeId("");
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return dashboard?.recentUsers || [];

    return (dashboard?.recentUsers || []).filter((entry) =>
      [entry.name, entry.email, entry.role].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [dashboard, search]);

  if (loading) {
    return <div className="dash-loading">Loading admin dashboard...</div>;
  }

  if (error && !dashboard) {
    return (
      <div className="dash-loading">
        <p>{error}</p>
        <button className="action-btn primary" onClick={() => navigate("/login")}>Go to login</button>
      </div>
    );
  }

  const summary = dashboard?.summary || {};
  const charts = dashboard?.charts || {};
  const paymentTotal = (charts.paymentStatus || []).reduce((sum, item) => sum + item.value, 0);

  return (
    <AdminLayout>
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="top-left">
            <button className="ghost-btn" title="Menu">=</button>
            <div className="search">
              <span className="search-ic">Search</span>
              <input
                placeholder="Find recent users..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="top-right">
            <div className="user-chip">
              <div className="avatar">{(user?.name?.[0] || "A").toUpperCase()}</div>
              <div className="user-meta">
                <div className="user-name">{user?.name || "Admin"}</div>
                <div className="user-role">{user?.role || "admin"}</div>
              </div>
            </div>

          </div>
        </header>

        <div className="dash-content">
          <section className="dash-hero">
            <div>
              <p className="hero-kicker">Live operations</p>
              <h1>Music class management center</h1>
              <p>
                Monitor enrollments, revenue, teacher approval, group occupancy, and weekly class load from one place.
              </p>
            </div>
            <div className="hero-badges">
              <span className="hero-badge">{summary.activeSubscriptions || 0} active memberships</span>
              <span className="hero-badge">{summary.totalGroups || 0} teaching groups</span>
              <span className="hero-badge">{summary.pendingSubscriptions || 0} pending payments</span>
            </div>
          </section>

          {error ? <div className="dash-banner dash-banner--error">{error}</div> : null}
          {message ? <div className="dash-banner dash-banner--ok">{message}</div> : null}

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-head">
                <span className="stat-title">Total Users</span>
                <span className={`pill ${summary.usersGrowth >= 0 ? "up" : "down"}`}>{formatGrowth(summary.usersGrowth || 0)}</span>
              </div>
              <div className="stat-value">{summary.totalUsers || 0}</div>
              <div className="stat-sub">new accounts vs last month</div>
            </div>

            <div className="stat-card">
              <div className="stat-head">
                <span className="stat-title">Teachers</span>
                <span className={`pill ${summary.teachersGrowth >= 0 ? "up" : "down"}`}>{formatGrowth(summary.teachersGrowth || 0)}</span>
              </div>
              <div className="stat-value">{summary.teachers || 0}</div>
              <div className="stat-sub">available instructors</div>
            </div>

            <div className="stat-card">
              <div className="stat-head">
                <span className="stat-title">Active Classes</span>
                <span className={`pill ${summary.classesGrowth >= 0 ? "up" : "down"}`}>{formatGrowth(summary.classesGrowth || 0)}</span>
              </div>
              <div className="stat-value">{summary.activeClasses || 0}</div>
              <div className="stat-sub">scheduled class slots</div>
            </div>

            <div className="stat-card">
              <div className="stat-head">
                <span className="stat-title">Pending Reviews</span>
                <span className={`pill ${summary.reviewsGrowth >= 0 ? "up" : "down"}`}>{formatGrowth(summary.reviewsGrowth || 0)}</span>
              </div>
              <div className="stat-value">{summary.pendingReviews || 0}</div>
              <div className="stat-sub">teacher requests awaiting action</div>
            </div>
          </section>

          <section className="panel-grid">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Revenue and Enrollments</div>
                  <div className="panel-sub">last 6 months from subscription records</div>
                </div>
              </div>

              <div className="chart-surface">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={charts.revenueByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#2b6fff" radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="right" dataKey="enrollments" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Subscription Status</div>
                  <div className="panel-sub">current payment and membership health</div>
                </div>
              </div>

              <div className="chart-surface donut-wrap">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={charts.paymentStatus || []}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {(charts.paymentStatus || []).map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="legend">
                  {(charts.paymentStatus || []).map((item, index) => (
                    <div className="legend-row" key={item.name}>
                      <span><i className="dot" style={{ background: COLORS[index % COLORS.length] }} />{item.name}</span>
                      <b>{item.value}</b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-foot">
                <div>Total subscriptions</div>
                <div className="strong">{paymentTotal}</div>
              </div>
            </div>
          </section>

          <section className="panel-grid bottom">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Instrument Demand</div>
                  <div className="panel-sub">enrollment distribution by instrument</div>
                </div>
              </div>

              <div className="chart-surface">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={(charts.instrumentDemand || []).map((item) => ({ name: item.name, demand: item.value }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis />
                    <Tooltip />
                    <Radar dataKey="demand" fill="#22c55e" fillOpacity={0.45} stroke="#15803d" strokeWidth={3} />
                  </RadarChart>
                </ResponsiveContainer>

                <div className="mini-list">
                  {(charts.instrumentDemand || []).slice(0, 3).map((item) => (
                    <div className="mini-row" key={item.name}><span className="mini-dot" /> {item.name} <b>{item.value}</b></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Student Growth</div>
                  <div className="panel-sub">new student signups per month</div>
                </div>
              </div>

              <div className="chart-surface">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={charts.studentGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="newStudents" stroke="#2b6fff" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="management-grid">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Teacher Verification Queue</div>
                  <div className="panel-sub">approve or reject instructor onboarding requests</div>
                </div>
              </div>
              <div className="list-surface">
                {(dashboard?.pendingTeacherVerifications || []).length === 0 ? (
                  <div className="empty-note">No pending teacher verifications.</div>
                ) : (
                  dashboard.pendingTeacherVerifications.map((request) => (
                    <div className="list-row" key={request._id} style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "16px", color: "#0f172a", fontWeight: "600" }}>{request.name}</h4>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                            <a href={`mailto:${request.email}`} style={{ color: "#404040", fontSize: "13px", textDecoration: "underline", fontWeight: "500" }}>{request.email}</a>
                            <span style={{ color: "#cbd5e1" }}>•</span>
                            <span style={{ color: "#64748b", fontSize: "13px" }}>{request.phone || "No contact"}</span>
                          </div>
                        </div>
                        <div className="row-actions" style={{ marginTop: 0 }}>
                          <button
                            className="action-btn primary"
                            disabled={busyVerificationId === request._id}
                            onClick={() => handleVerification(request._id, "approved")}
                            style={{ padding: "6px 14px", fontSize: "13px" }}
                          >
                            Approve
                          </button>
                          <button
                            className="action-btn danger"
                            disabled={busyVerificationId === request._id}
                            onClick={() => handleVerification(request._id, "rejected")}
                            style={{ padding: "6px 14px", fontSize: "13px" }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "12px", marginTop: "4px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#94a3b8", fontWeight: "600", marginBottom: "6px" }}>Expertise</div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {(request.user?.instrumentExpertise || request.category).split(',').map(exp => (
                              <span key={exp} style={{ background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>{exp.trim()}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#94a3b8", fontWeight: "600", marginBottom: "6px" }}>Experience</div>
                          <div style={{ color: "#334155", fontSize: "13px", fontWeight: "500" }}>{request.user?.yearsOfExperience || 0} Years</div>
                        </div>
                      </div>

                      {request.user?.teacherBio && (
                        <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "12px", borderLeft: "3px solid #cbd5e1", marginTop: "4px" }}>
                          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#94a3b8", fontWeight: "600", marginBottom: "4px" }}>Bio</div>
                          <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>"{request.user.teacherBio}"</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Group Occupancy</div>
                  <div className="panel-sub">monitor class capacity before overbooking</div>
                </div>
              </div>
              <div className="list-surface">
                {(dashboard?.groupsOverview || []).length === 0 ? (
                  <div className="empty-note">No groups created yet.</div>
                ) : (
                  dashboard.groupsOverview.map((group) => (
                    <div className="list-row" key={group.id}>
                      <div>
                        <strong>{group.groupName}</strong>
                        <p>{group.instrument}  -  Teacher: {group.teacherName}</p>
                      </div>
                      <div className="occupancy-pill">{group.filled}/{group.capacity}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="panel panel-wide">
            <div className="panel-head">
              <div>
                <div className="panel-title">Recent Subscriptions</div>
                <div className="panel-sub">update payment state and membership lifecycle</div>
              </div>
            </div>
            <div className="table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Instrument</th>
                    <th>Plan</th>
                    <th>Teacher</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.recentSubscriptions || []).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.userName}</strong>
                        <div className="table-sub">{item.userEmail}</div>
                      </td>
                      <td>{item.instrument}</td>
                      <td>{item.plan}</td>
                      <td>{item.teacherName}</td>
                      <td>{formatCurrency(item.amount)}</td>
                      <td>
                        <select
                          className="status-select"
                          value={item.status}
                          disabled={busySubscriptionId === item.id}
                          onChange={(event) => handleSubscriptionStatus(item.id, event.target.value)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="management-grid management-grid--bottom">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Upcoming Class Schedule</div>
                  <div className="panel-sub">latest class slots added by teachers</div>
                </div>
              </div>
              <div className="list-surface">
                {(dashboard?.recentSchedules || []).length === 0 ? (
                  <div className="empty-note">No schedules created yet.</div>
                ) : (
                  dashboard.recentSchedules.map((item) => (
                    <div className="list-row" key={item.id}>
                      <div>
                        <strong>{item.groupName}</strong>
                        <p>{item.instrument}  -  {item.dayOfWeek}</p>
                      </div>
                      <div className="slot-pill">{item.startTime} - {item.endTime}{item.room ? `  -  ${item.room}` : ""}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Recent Users</div>
                  <div className="panel-sub">filtered from the search field above</div>
                </div>
              </div>
              <div className="list-surface">
                {filteredUsers.length === 0 ? (
                  <div className="empty-note">No users match the current search.</div>
                ) : (
                  filteredUsers.map((entry) => (
                    <div className="list-row" key={entry.id}>
                      <div>
                        <strong>{entry.name}</strong>
                        <p>{entry.email}</p>
                      </div>
                      <div className="row-actions">
                        <div className="user-badges">
                          <span className="tag">{entry.role}</span>
                          <span className="tag muted">{entry.isMember ? "member" : "non-member"}</span>
                        </div>
                        <button
                          className="action-btn danger"
                          type="button"
                          disabled={busyUserId === entry.id || entry.id === user?.id}
                          onClick={() => handleRemoveUser(entry)}
                        >
                          {entry.id === user?.id
                            ? "Current admin"
                            : busyUserId === entry.id
                              ? "Removing..."
                              : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="management-grid management-grid--bottom">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Admin Notices</div>
                  <div className="panel-sub">Publish updates for students and teachers</div>
                </div>
              </div>
              <div className="list-surface">
                <form className="notice-admin-form" onSubmit={handleCreateNotice}>
                  <input
                    className="notice-admin-input"
                    placeholder="Notice title"
                    value={noticeForm.title}
                    onChange={(event) => setNoticeForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                  <textarea
                    className="notice-admin-textarea"
                    placeholder="Write the admin notice here..."
                    value={noticeForm.message}
                    onChange={(event) => setNoticeForm((prev) => ({ ...prev, message: event.target.value }))}
                    rows={4}
                    required
                  />
                  <div className="notice-admin-row">
                    <select
                      className="status-select"
                      value={noticeForm.audience}
                      onChange={(event) => setNoticeForm((prev) => ({ ...prev, audience: event.target.value }))}
                    >
                      <option value="all">All users</option>
                      <option value="student">Students only</option>
                      <option value="teacher">Teachers only</option>
                    </select>
                    <label className="notice-pin-toggle">
                      <input
                        type="checkbox"
                        checked={noticeForm.isPinned}
                        onChange={(event) => setNoticeForm((prev) => ({ ...prev, isPinned: event.target.checked }))}
                      />
                      Pin notice
                    </label>
                  </div>
                  <button className="action-btn primary" type="submit" disabled={publishingNotice}>
                    {publishingNotice ? "Publishing..." : "Publish Notice"}
                  </button>
                </form>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Recent Notices</div>
                  <div className="panel-sub">Latest notices visible in teacher and student dashboards</div>
                </div>
              </div>
              <div className="list-surface">
                {(dashboard?.recentNotices || []).length === 0 ? (
                  <div className="empty-note">No notices published yet.</div>
                ) : (
                  dashboard.recentNotices.map((notice) => (
                    <div className="list-row notice-row" key={notice.id}>
                      <div>
                        <strong>{notice.title}</strong>
                        <p>{notice.message}</p>
                        <small>{notice.audience} · {formatDate(notice.createdAt)} · {notice.authorName}</small>
                      </div>
                      <div className="row-actions">
                        {notice.isPinned ? <span className="tag">pinned</span> : null}
                        <button
                          className="action-btn danger"
                          type="button"
                          disabled={busyNoticeId === notice.id}
                          onClick={() => handleRemoveNotice(notice.id)}
                        >
                          {busyNoticeId === notice.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <div className="dash-bottom-bar">
            <button className="action-btn danger dash-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;





