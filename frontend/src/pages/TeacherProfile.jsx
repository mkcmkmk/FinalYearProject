import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./TeacherProfile.css";

const TeacherProfile = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const token = localStorage.getItem("token");

  const isOwnProfile = !teacherId;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    profileImage: "",
    contactNumber: "",
    instrumentExpertise: "",
    yearsOfExperience: "",
    teacherBio: "",
  });

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const setProfileState = (nextProfile) => {
    setProfile(nextProfile);
    setForm({
      name: nextProfile.teacher?.name || "",
      profileImage: nextProfile.teacher?.profileImage || "",
      contactNumber: nextProfile.teacher?.contactNumber || "",
      instrumentExpertise: nextProfile.teacher?.instrumentExpertise || "",
      yearsOfExperience: nextProfile.teacher?.yearsOfExperience ?? "",
      teacherBio: nextProfile.teacher?.teacherBio || "",
    });
  };

  const fetchOwnTeacherProfile = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/users/teacher-profile/me", authHeaders);
      return {
        teacher: res.data.teacher,
        summary: res.data.summary,
        groups: res.data.groups || [],
      };
    } catch (err) {
      if (err?.response?.status !== 404) {
        throw err;
      }

      const [meRes, dashboardRes] = await Promise.all([
        axios.get("http://localhost:3000/api/users/me", authHeaders),
        axios.get("http://localhost:3000/api/teacher/dashboard", authHeaders),
      ]);

      const teacher = meRes.data?.user;
      const dashboard = dashboardRes.data || {};

      return {
        teacher,
        summary: {
          groups: dashboard.summary?.totalGroups || 0,
          assignedStudents: dashboard.summary?.totalStudents || 0,
          weeklyClasses: dashboard.summary?.totalSchedules || 0,
        },
        groups: (dashboard.groups || []).map((group) => ({
          id: group._id,
          groupName: group.groupName,
          instrument: group.instrument,
          capacity: group.capacity,
          filled: group.filled,
        })),
      };
    }
  };

  const loadProfile = async () => {
    if (!token) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    if (isOwnProfile && user?.role !== "teacher") {
      navigate("/profile");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const nextProfile = isOwnProfile
        ? await fetchOwnTeacherProfile()
        : await axios
            .get(`http://localhost:3000/api/users/teachers/${teacherId}`, authHeaders)
            .then((res) => ({
              teacher: res.data.teacher,
              summary: res.data.summary,
              groups: res.data.groups || [],
            }));

      setProfileState(nextProfile);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load teacher profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [teacherId, user?.role]);

  const handleChange = (event) => {
    setMessage("");
    setError("");
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!isOwnProfile) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");
      const res = await axios.put(
        "http://localhost:3000/api/users/me",
        {
          name: form.name,
          profileImage: form.profileImage,
          contactNumber: form.contactNumber ? Number(form.contactNumber) : null,
          instrumentExpertise: form.instrumentExpertise,
          yearsOfExperience: form.yearsOfExperience === "" ? null : Number(form.yearsOfExperience),
          teacherBio: form.teacherBio,
        },
        authHeaders
      );

      if (res.data?.success && res.data?.user) {
        const mergedTeacher = {
          ...(profile?.teacher || {}),
          ...res.data.user,
          name: form.name,
          profileImage: form.profileImage,
          contactNumber: form.contactNumber ? Number(form.contactNumber) : null,
          instrumentExpertise: form.instrumentExpertise,
          yearsOfExperience: form.yearsOfExperience === "" ? null : Number(form.yearsOfExperience),
          teacherBio: form.teacherBio,
        };

        login(mergedTeacher);
        setProfile((prev) => ({
          ...(prev || {
            summary: { groups: 0, assignedStudents: 0, weeklyClasses: 0 },
            groups: [],
          }),
          teacher: mergedTeacher,
        }));
        setMessage("Teacher profile updated successfully.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update teacher profile");
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (user?.role === "teacher") navigate("/teacher-dashboard");
    else navigate("/profile");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return <div className="tp-loading">Loading teacher profile...</div>;
  }

  if (error && !profile) {
    return (
      <div className="tp-loading">
        <div>
          <p>{error}</p>
          <button className="tp-btn tp-btn--ghost" onClick={goBack}>Go back</button>
        </div>
      </div>
    );
  }

  const teacher = profile?.teacher || {};
  const summary = profile?.summary || {};

  return (
    <div className="tp-page">
      <header className="tp-topbar">
        <div>
          <p className="tp-kicker">Teacher Profile</p>
          <h1>{isOwnProfile ? "Manage your teaching profile" : `Meet ${teacher.name || "this teacher"}`}</h1>
          <p className="tp-subtitle">
            {isOwnProfile
              ? "Update the details students see before they join your classes."
              : "Students can review the teacher's expertise, experience, and current class involvement here."}
          </p>
        </div>

        <div className="tp-actions">
          <button className="tp-btn tp-btn--ghost" onClick={goBack}>Back</button>
          {isOwnProfile ? <button className="tp-btn" onClick={handleLogout}>Logout</button> : null}
        </div>
      </header>

      {error ? <div className="tp-banner tp-banner--error">{error}</div> : null}
      {message ? <div className="tp-banner tp-banner--ok">{message}</div> : null}

      <div className="tp-grid">
        <aside className="tp-sidebar">
          <section className="tp-card tp-hero-card">
            <div className="tp-photo">
              {teacher.profileImage ? (
                <img src={teacher.profileImage} alt={teacher.name || "Teacher"} />
              ) : (
                <div className="tp-photo-fallback">{String(teacher.name || "T").charAt(0).toUpperCase()}</div>
              )}
            </div>
            <h2>{teacher.name}</h2>
            <p className="tp-role">Teacher</p>
            <div className="tp-mini-list">
              <div><span>Expertise</span><b>{teacher.instrumentExpertise || "Not set"}</b></div>
              <div><span>Experience</span><b>{teacher.yearsOfExperience ?? 0} years</b></div>
              <div><span>Contact</span><b>{teacher.contactNumber || "Not shared"}</b></div>
            </div>
          </section>

          <section className="tp-card">
            <div className="tp-stat-row"><span>Groups</span><strong>{summary.groups || 0}</strong></div>
            <div className="tp-stat-row"><span>Students</span><strong>{summary.assignedStudents || 0}</strong></div>
            <div className="tp-stat-row"><span>Weekly classes</span><strong>{summary.weeklyClasses || 0}</strong></div>
          </section>
        </aside>

        <main className="tp-main">
          <section className="tp-card">
            <div className="tp-section-head">
              <div>
                <p className="tp-section-kicker">About</p>
                <h2>Teaching Details</h2>
              </div>
            </div>

            <div className="tp-detail-grid">
              <div className="tp-detail-box"><span>Email</span><b>{teacher.email || "Not shared"}</b></div>
              <div className="tp-detail-box"><span>Instrument Expertise</span><b>{teacher.instrumentExpertise || "Not set"}</b></div>
              <div className="tp-detail-box"><span>Years of Experience</span><b>{teacher.yearsOfExperience ?? 0}</b></div>
              <div className="tp-detail-box"><span>Contact Number</span><b>{teacher.contactNumber || "Not shared"}</b></div>
              <div className="tp-detail-box tp-detail-box--wide"><span>Teacher Bio</span><b>{teacher.teacherBio || "No bio added yet."}</b></div>
            </div>
          </section>

          <section className="tp-card">
            <div className="tp-section-head">
              <div>
                <p className="tp-section-kicker">Teaching Groups</p>
                <h2>Current Classes</h2>
              </div>
            </div>

            {profile?.groups?.length ? (
              <div className="tp-group-grid">
                {profile.groups.map((group) => (
                  <article className="tp-group-card" key={group.id}>
                    <h3>{group.groupName}</h3>
                    <p>{group.instrument}</p>
                    <div className="tp-group-meta">{group.filled}/{group.capacity} students</div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="tp-empty">No groups assigned yet.</div>
            )}
          </section>

          {isOwnProfile && (
            <section className="tp-card">
              <div className="tp-section-head">
                <div>
                  <p className="tp-section-kicker">Edit</p>
                  <h2>Update Teacher Profile</h2>
                </div>
              </div>

              <form className="tp-form" onSubmit={handleSave}>
                <div className="tp-form-grid">
                  <label>
                    Full Name
                    <input name="name" value={form.name} onChange={handleChange} required />
                  </label>
                  <label>
                    Contact Number
                    <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="98xxxxxxxx" />
                  </label>
                  <label>
                    Instrument Expertise
                    <input name="instrumentExpertise" value={form.instrumentExpertise} onChange={handleChange} required />
                  </label>
                  <label>
                    Years of Experience
                    <input name="yearsOfExperience" type="number" min="0" value={form.yearsOfExperience} onChange={handleChange} required />
                  </label>
                  <label className="tp-span-2">
                    Profile Image URL
                    <input name="profileImage" value={form.profileImage} onChange={handleChange} placeholder="https://..." />
                  </label>
                  <label className="tp-span-2">
                    Teacher Bio
                    <textarea name="teacherBio" value={form.teacherBio} onChange={handleChange} rows="5" required />
                  </label>
                </div>

                <div className="tp-form-actions">
                  <button className="tp-btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherProfile;
