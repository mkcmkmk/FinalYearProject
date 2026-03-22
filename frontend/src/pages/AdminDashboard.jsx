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
    <div className="dash">
      <aside className="dash-sidebar">
        <div className="brand-badge">H</div>

        <div className="side-icons">
          <button className="side-btn active" title="Dashboard">D</button>
          <button className="side-btn" title="Users">U</button>
          <button className="side-btn" title="Teachers">T</button>
          <button className="side-btn" title="Classes">C</button>
          <button className="side-btn" title="Settings">S</button>
        </div>

        <div className="side-bottom">
          <button className="side-btn" title="Logout" onClick={handleLogout}>L</button>
        </div>
      </aside>

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
                    <div className="list-row" key={request._id}>
                      <div>
                        <strong>{request.name}</strong>
                        <p>{request.email} � {request.category}</p>
                        <small>{formatCurrency(request.pricePerSession)} per session</small>
                      </div>
                      <div className="row-actions">
                        <button
                          className="action-btn primary"
                          disabled={busyVerificationId === request._id}
                          onClick={() => handleVerification(request._id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="action-btn danger"
                          disabled={busyVerificationId === request._id}
                          onClick={() => handleVerification(request._id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
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
                        <p>{group.instrument} � Teacher: {group.teacherName}</p>
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
                        <p>{item.instrument} � {item.dayOfWeek}</p>
                      </div>
                      <div className="slot-pill">{item.startTime} - {item.endTime}{item.room ? ` � ${item.room}` : ""}</div>
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
                      <div className="user-badges">
                        <span className="tag">{entry.role}</span>
                        <span className="tag muted">{entry.isMember ? "member" : "non-member"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
