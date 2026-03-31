import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./TeacherProfile.css";

const formatReviewDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const renderStars = (count) => "?".repeat(count) + "?".repeat(Math.max(0, 5 - count));

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
  const [ratingSaving, setRatingSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    profileImage: "",
    contactNumber: "",
    instrumentExpertise: "",
    yearsOfExperience: "",
    teacherBio: "",
  });
  const [ratingForm, setRatingForm] = useState({
    score: 0,
    feedback: "",
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
    setRatingForm({
      score: nextProfile.ratings?.viewer?.todayRating?.score || 0,
      feedback: nextProfile.ratings?.viewer?.todayRating?.feedback || "",
    });
  };

  const fetchOwnTeacherProfile = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/users/teacher-profile/me", authHeaders);
      return {
        teacher: res.data.teacher,
        summary: res.data.summary,
        ratings: res.data.ratings || { averageRating: 0, totalRatings: 0, recentRatings: [], viewer: {} },
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
        ratings: {
          averageRating: 0,
          totalRatings: 0,
          recentRatings: [],
          viewer: {},
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
              ratings: res.data.ratings || { averageRating: 0, totalRatings: 0, recentRatings: [], viewer: {} },
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
            ratings: { averageRating: 0, totalRatings: 0, recentRatings: [], viewer: {} },
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

  const handleRatingSubmit = async (event) => {
    event.preventDefault();
    if (isOwnProfile || user?.role !== "student") return;

    const publicTeacherId = profile?.teacher?.id || profile?.teacher?._id || teacherId;
    if (!publicTeacherId) return;

    try {
      setRatingSaving(true);
      setError("");
      setMessage("");
      const res = await axios.post(
        `http://localhost:3000/api/users/teachers/${publicTeacherId}/rating`,
        {
          score: Number(ratingForm.score),
          feedback: ratingForm.feedback,
        },
        authHeaders
      );

      setProfile((prev) => ({
        ...(prev || {}),
        ratings: res.data?.ratings || prev?.ratings,
      }));
      setRatingForm({
        score: res.data?.rating?.score || Number(ratingForm.score),
        feedback: res.data?.rating?.feedback || ratingForm.feedback,
      });
      setMessage(res.data?.message || "Teacher rating saved successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to submit teacher rating");
    } finally {
      setRatingSaving(false);
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
  const ratings = profile?.ratings || { averageRating: 0, totalRatings: 0, recentRatings: [], viewer: {} };
  const viewerRating = ratings.viewer || {};

  return (
    <div className="tp-page">
      <header className="tp-topbar">
        <div>
          <p className="tp-kicker">Teacher Profile</p>
          <h1>{isOwnProfile ? "Manage your teaching profile" : `Meet ${teacher.name || "this teacher"}`}</h1>
          <p className="tp-subtitle">
            {isOwnProfile
              ? "Update the details students see before they join your classes."
              : "Students can review the teacher's expertise, experience, ratings, and current class involvement here."}
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
              <div><span>Rating</span><b>{ratings.totalRatings ? `${ratings.averageRating}/5` : "No ratings yet"}</b></div>
              <div><span>Contact</span><b>{teacher.contactNumber || "Not shared"}</b></div>
            </div>
          </section>

          <section className="tp-card">
            <div className="tp-stat-row"><span>Groups</span><strong>{summary.groups || 0}</strong></div>
            <div className="tp-stat-row"><span>Students</span><strong>{summary.assignedStudents || 0}</strong></div>
            <div className="tp-stat-row"><span>Weekly classes</span><strong>{summary.weeklyClasses || 0}</strong></div>
            <div className="tp-stat-row"><span>Total ratings</span><strong>{ratings.totalRatings || 0}</strong></div>
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
                <p className="tp-section-kicker">Ratings</p>
                <h2>Student Feedback</h2>
              </div>
            </div>

            <div className="tp-rating-summary">
              <div className="tp-rating-score">
                <strong>{ratings.totalRatings ? ratings.averageRating.toFixed(1) : "0.0"}</strong>
                <span>{ratings.totalRatings ? renderStars(Math.round(ratings.averageRating)) : "No reviews yet"}</span>
                <small>{ratings.totalRatings} total ratings</small>
              </div>
              <div className="tp-rating-note">
                <p>{viewerRating.message || "Students can submit ratings every Saturday."}</p>
              </div>
            </div>

            {ratings.recentRatings?.length ? (
              <div className="tp-review-list">
                {ratings.recentRatings.map((review) => (
                  <article className="tp-review-card" key={review.id}>
                    <div className="tp-review-head">
                      <div>
                        <strong>{review.student?.name || "Student"}</strong>
                        <span>{formatReviewDate(review.ratedAt)}</span>
                      </div>
                      <b>{renderStars(review.score)}</b>
                    </div>
                    <p>{review.feedback || "No written feedback provided."}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="tp-empty">No ratings submitted yet.</div>
            )}
          </section>

          {!isOwnProfile && user?.role === "student" ? (
            <section className="tp-card">
              <div className="tp-section-head">
                <div>
                  <p className="tp-section-kicker">Rate Teacher</p>
                  <h2>Saturday Rating Window</h2>
                </div>
              </div>

              <p className="tp-rating-help">{viewerRating.message || "Students can submit ratings every Saturday."}</p>

              {viewerRating.isAssignedStudent ? (
                <form className="tp-form" onSubmit={handleRatingSubmit}>
                  <div className="tp-star-row" role="radiogroup" aria-label="Teacher rating">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        className={ratingForm.score >= score ? "tp-star-btn active" : "tp-star-btn"}
                        onClick={() => setRatingForm((prev) => ({ ...prev, score }))}
                        disabled={!viewerRating.canRate}
                      >
                        ?
                      </button>
                    ))}
                  </div>

                  <label className="tp-span-2">
                    Feedback
                    <textarea
                      value={ratingForm.feedback}
                      onChange={(event) =>
                        setRatingForm((prev) => ({ ...prev, feedback: event.target.value }))
                      }
                      rows="4"
                      maxLength="500"
                      placeholder="Share what is helping you most in class."
                      disabled={!viewerRating.canRate}
                    />
                  </label>

                  <div className="tp-form-actions">
                    <button
                      className="tp-btn"
                      type="submit"
                      disabled={ratingSaving || !viewerRating.canRate || !ratingForm.score}
                    >
                      {ratingSaving ? "Saving rating..." : viewerRating.todayRating ? "Update Rating" : "Submit Rating"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="tp-empty">You can only rate the teacher currently assigned to your subscription.</div>
              )}
            </section>
          ) : null}

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
