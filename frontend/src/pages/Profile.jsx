import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const normalizeStatus = (s) => {
  const v = String(s || "").toLowerCase().trim();
  if (["active", "paid", "success", "subscribed"].includes(v)) return "active";
  if (["pending", "processing"].includes(v)) return "pending";
  if (["expired", "inactive", "canceled", "cancelled"].includes(v)) return "expired";
  return "none";
};

const Profile = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [sub, setSub] = useState(null);
  const [tab, setTab] = useState("about");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  const [name, setName] = useState(user?.name || "");
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");

  useEffect(() => {
    if (user?.role === "teacher") {
      navigate("/teacher-profile", { replace: true });
    }
  }, [user?.role, navigate]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setErr(null);
      setMsg(null);
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        if (!alive) return;
        setErr("Not logged in");
        setLoading(false);
        return;
      }

      try {
        const meRes = await axios.get("http://localhost:3000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!alive) return;

        if (meRes.data?.success && meRes.data?.user) {
          const newUser = meRes.data.user;
          login(newUser);

          setName(newUser?.name || "");
          setContactNumber(newUser?.contactNumber || "");
          setProfileImage(newUser?.profileImage || "");
        }

        const subRes = await axios.get("http://localhost:3000/api/subscriptions/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!alive) return;
        setSub(subRes.data?.subscription || null);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Server error");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, [login]);

  const handleSave = async (e) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const token = localStorage.getItem("token");
    if (!token) return setErr("Not logged in");

    try {
      const res = await axios.put(
        "http://localhost:3000/api/users/me",
        { name, contactNumber, profileImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success && res.data?.user) {
        login(res.data.user);
        setMsg("Profile updated ✅");
      } else {
        setErr(res.data?.message || "Update failed");
      }
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Server error");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goHome = () => {
    navigate("/student-dashboard");
  };

  const instrument = sub?.instrument || "—";
  const plan = sub?.plan || "—";
  const status = normalizeStatus(sub?.status);

  const teacherName = sub?.teacher?.name || "—";
  const teacherId = sub?.teacher?.id || sub?.teacher?._id || "";
  const groupName =
    sub?.groupName ||
    sub?.group?.groupName ||
    "—";

  if (loading) {
    return (
      <div className="hp-page">
        <div className="hp-shell">
          <div className="hp-card">Loading...</div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="hp-page">
        <div className="hp-shell">
          <div className="hp-card">
            <div className="hp-alert hp-alert--error">{err}</div>
            <div style={{ marginTop: 12 }}>
              <button className="hp-btn hp-btn--outline" onClick={() => navigate("/login")}>
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hp-page">
      <header className="hp-topbar hp-topbar--light">
        <div className="hp-brand hp-brand--light">
          <div className="hp-mark hp-mark--light">H</div>
          <span>Harmoniq</span>
        </div>

        <div className="hp-top-actions hp-top-actions--light">
          <button className="hp-ghost hp-ghost--light" onClick={goHome}>
            homepage
          </button>

          <button className="hp-ghost hp-ghost--light" onClick={() => navigate("/chat")}>
            chat
          </button>

          <button className="hp-ghost hp-ghost--light" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="hp-shell">
        <aside className="hp-left">
          <div className="hp-card hp-profileCard">
            <div className="hp-photo">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="hp-photoFallback">
                  {(user?.name?.[0] || "U").toUpperCase()}
                </div>
              )}
            </div>

            <div className="hp-id">
              <div className="hp-name">{user?.name}</div>
              <div className="hp-role">{user?.role}</div>
              <div className="hp-email">{user?.email}</div>
            </div>

            <div className="hp-miniActions">
              <button className="hp-btn" onClick={() => setTab("edit")}>
                Edit Profile
              </button>
              <button className="hp-btn hp-btn--outline" onClick={() => setTab("subscription")}>
                Subscription
              </button>
            </div>
          </div>

          <div className="hp-card">
            <div className="hp-cardTitle">Subscription</div>
            <div className="hp-kv">
              <span>Status</span>
              <b className={`hp-pill hp-pill--${status}`}>{status}</b>
            </div>
            <div className="hp-kv">
              <span>Plan</span>
              <b>{plan}</b>
            </div>
            <div className="hp-kv">
              <span>Instrument</span>
              <b>{instrument}</b>
            </div>
          </div>

          <div className="hp-card">
            <div className="hp-cardTitle">Assigned</div>
            <div className="hp-kv">
              <span>Teacher</span>
              <b>{teacherName}</b>
            </div>
            <div className="hp-kv">
              <span>Group</span>
              <b>{groupName}</b>
            </div>
            {teacherId ? (
              <button className="hp-btn hp-btn--outline hp-viewTeacherBtn" onClick={() => navigate(`/teachers/${teacherId}`)}>
                View Teacher Profile
              </button>
            ) : null}
          </div>
        </aside>

        <main className="hp-right">
          <div className="hp-card hp-mainCard">
            <div className="hp-mainHead">
              <div>
                <h1 className="hp-title">{user?.name}</h1>
                <p className="hp-subtitle">
                  Manage your Harmoniq profile, subscription, assignments, and teacher details.
                </p>
              </div>

              <div className="hp-mainButtons">
                <button className="hp-btn" onClick={() => setTab("about")}>About</button>
                <button className="hp-btn hp-btn--outline" onClick={() => setTab("subscription")}>
                  Subscription
                </button>
                <button className="hp-btn hp-btn--outline" onClick={() => navigate("/chat")}>
                  Open Chat
                </button>
                <button className="hp-btn hp-btn--outline" onClick={() => setTab("edit")}>
                  Edit
                </button>
              </div>
            </div>

            <div className="hp-tabs">
              <button
                type="button"
                className={tab === "about" ? "hp-tab active" : "hp-tab"}
                onClick={() => setTab("about")}
              >
                About
              </button>
              <button
                type="button"
                className={tab === "subscription" ? "hp-tab active" : "hp-tab"}
                onClick={() => setTab("subscription")}
              >
                Subscription
              </button>
              <button
                type="button"
                className={tab === "edit" ? "hp-tab active" : "hp-tab"}
                onClick={() => setTab("edit")}
              >
                Edit Profile
              </button>
            </div>

            {msg && <div className="hp-alert hp-alert--ok">{msg}</div>}

            {tab === "about" && (
              <div className="hp-section">
                <h3 className="hp-sectionTitle">Details</h3>
                <div className="hp-grid2">
                  <div className="hp-box"><span>Full Name</span><b>{user?.name || "—"}</b></div>
                  <div className="hp-box"><span>Role</span><b style={{ textTransform: "capitalize" }}>{user?.role || "—"}</b></div>
                  <div className="hp-box"><span>Email</span><b>{user?.email || "—"}</b></div>
                  <div className="hp-box"><span>Contact Number</span><b>{user?.contactNumber || "—"}</b></div>
                </div>
              </div>
            )}

            {tab === "subscription" && (
              <div className="hp-section">
                <h3 className="hp-sectionTitle">Subscription & Assignment</h3>

                {sub ? (
                  <div className="hp-grid2">
                    <div className="hp-box"><span>Status</span><b className={`hp-pill hp-pill--${status}`}>{status}</b></div>
                    <div className="hp-box"><span>Plan</span><b>{plan}</b></div>
                    <div className="hp-box"><span>Instrument</span><b>{instrument}</b></div>
                    <div className="hp-box"><span>Teacher</span><b>{teacherName}</b></div>
                    <div className="hp-box"><span>Group</span><b>{groupName}</b></div>
                  </div>
                ) : (
                  <div className="hp-muted">
                    No subscription found.
                    <div style={{ marginTop: 12 }}>
                      <button className="hp-btn" onClick={() => navigate("/pay")}>
                        Subscribe Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "edit" && (
              <div className="hp-section">
                <h3 className="hp-sectionTitle">Edit Profile</h3>

                <form className="hp-form" onSubmit={handleSave}>
                  <div className="hp-grid2">
                    <div className="hp-field">
                      <label>Full Name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    <div className="hp-field">
                      <label>Contact Number (optional)</label>
                      <input
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="98xxxxxxxx"
                      />
                    </div>

                    <div className="hp-field hp-span2">
                      <label>Profile Image URL (optional)</label>
                      <input
                        value={profileImage}
                        onChange={(e) => setProfileImage(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="hp-formActions">
                    <button className="hp-btn" type="submit">Save Changes</button>
                    <button className="hp-btn hp-btn--outline" type="button" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="hp-footnote">
            © {new Date().getFullYear()} Harmoniq. All rights reserved.
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
