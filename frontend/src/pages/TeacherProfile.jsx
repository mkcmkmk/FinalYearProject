import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/authContext";
import StudentLayout from "../components/StudentLayout";
import TeacherLayout from "../components/TeacherLayout";
import AdminLayout from "../components/AdminLayout";
import "./TeacherProfile.css";

const formatReviewDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const renderStars = (count) => "★".repeat(count) + "☆".repeat(Math.max(0, 5 - count));

const TeacherProfile = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();
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
    if (user?.role === "admin") navigate("/admin/teachers");
    else if (user?.role === "teacher") navigate("/teacher-dashboard");
    else navigate("/profile");
  };

  const Layout = user?.role === "admin" ? AdminLayout : (user?.role === "teacher" ? TeacherLayout : StudentLayout);

  if (loading) {
    return (
      <Layout>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm text-center flex items-center justify-center h-full text-gray-400 font-bold text-sm">
          Loading teacher profile...
        </div>
      </Layout>
    );
  }

  const teacher = profile?.teacher || {};
  const summary = profile?.summary || {};
  const ratings = profile?.ratings || { averageRating: 0, totalRatings: 0, recentRatings: [], viewer: {} };
  const viewerRating = ratings.viewer || {};

  return (
    <Layout>
      <div className="flex-1 flex flex-col min-w-0 gap-4 h-full overflow-y-auto pt-4 pr-2 custom-scrollbar pb-6">
        
        {/* Welcome Header */}
        <header className="shrink-0 bg-white rounded-[2rem] p-7 shadow-sm flex flex-col gap-1 justify-center relative overflow-hidden border border-gray-50/50">
          <p className="text-[11px] font-bold text-purple-500 uppercase tracking-widest mb-1">Teacher Profile</p>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-none">{isOwnProfile ? "Manage your teaching profile" : `Meet ${teacher.name || "this teacher"}`}</h1>
          <p className="text-xs text-gray-400 font-semibold mt-1 max-w-2xl leading-relaxed">
            {isOwnProfile
              ? "Update the details students see before they join your classes."
              : "Students can review the teacher's expertise, experience, ratings, and current class involvement here."}
          </p>
          
          <div className="absolute right-6 top-6 flex gap-2">
            <button className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-[1rem] text-xs font-bold transition-colors" onClick={goBack}>
              Back
            </button>
          </div>
        </header>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-[1.25rem] text-xs font-bold">{error}</div>}
        {message && <div className="p-4 bg-green-50 text-green-600 rounded-[1.25rem] text-xs font-bold">{message}</div>}

        <div className="shrink-0 grid grid-cols-3 gap-4">
          {/* Left Column: Sidebar Cards (Profile Card & Stats Card) */}
          <div className="flex flex-col gap-4 col-span-1">
            
            {/* Profile Info Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center text-center border border-gray-50/50">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-4 border-2 border-gray-100 shadow-inner">
                {teacher.profileImage ? (
                  <img src={teacher.profileImage} alt={teacher.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-3xl font-extrabold text-gray-400">{(teacher.name?.[0] || "T").toUpperCase()}</div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{teacher.name}</h2>
              <p className="text-xs text-purple-500 font-bold uppercase mt-0.5 tracking-wider">Instructor</p>
              
              <div className="w-full space-y-3 mt-6 border-t border-gray-50 pt-4 text-left">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-400">Expertise</span>
                  <span className="text-gray-800">{teacher.instrumentExpertise || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold border-t border-gray-50 pt-3">
                  <span className="text-gray-400">Experience</span>
                  <span className="text-gray-800">{teacher.yearsOfExperience ?? 0} years</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold border-t border-gray-50 pt-3">
                  <span className="text-gray-400">Rating</span>
                  <span className="text-gray-800">{ratings.totalRatings ? `${ratings.averageRating}/5` : "No ratings"}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold border-t border-gray-50 pt-3">
                  <span className="text-gray-400">Contact</span>
                  <span className="text-gray-800 truncate max-w-[120px]">{teacher.contactNumber || "Not shared"}</span>
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col gap-4 border border-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Teaching Metrics</h3>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-400">Groups Managed</span>
                <strong className="text-gray-800 text-sm font-extrabold">{summary.groups || 0}</strong>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-t border-gray-50 pt-3">
                <span className="text-gray-400">Total Students</span>
                <strong className="text-gray-800 text-sm font-extrabold">{summary.assignedStudents || 0}</strong>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-t border-gray-50 pt-3">
                <span className="text-gray-400">Weekly Classes</span>
                <strong className="text-gray-800 text-sm font-extrabold">{summary.weeklyClasses || 0}</strong>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-t border-gray-50 pt-3">
                <span className="text-gray-400">Total Reviews</span>
                <strong className="text-gray-800 text-sm font-extrabold">{ratings.totalRatings || 0}</strong>
              </div>
            </div>

          </div>

          {/* Right Column: Detailed Info, Feedback & Actions */}
          <div className="col-span-2 flex flex-col gap-4">
            
            {/* Bio Card */}
            <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-50/50 flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Details</p>
                <h2 className="text-lg font-bold text-gray-900">Teaching Biography</h2>
              </div>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed bg-[#f8f9fb] p-5 rounded-[1.25rem] border border-gray-50">
                {teacher.teacherBio || "No biography added yet."}
              </p>
            </div>

            {/* Ratings / Reviews Card */}
            <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-50/50 flex flex-col gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ratings</p>
                <h2 className="text-lg font-bold text-gray-900">Student Feedback</h2>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#f8f9fb] p-5 rounded-[1.25rem] border border-gray-50 text-center flex flex-col justify-center items-center gap-1.5 col-span-1">
                  <strong className="text-4xl font-extrabold text-gray-900 leading-none">
                    {ratings.totalRatings ? ratings.averageRating.toFixed(1) : "0.0"}
                  </strong>
                  <span className="text-amber-500 text-xs font-bold tracking-widest">
                    {ratings.totalRatings ? renderStars(Math.round(ratings.averageRating)) : "★★★★★"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {ratings.totalRatings} total ratings
                  </span>
                </div>

                <div className="bg-[#f8f9fb] p-5 rounded-[1.25rem] border border-gray-50 flex items-center justify-center col-span-2 text-center">
                  <p className="text-xs text-gray-400 font-bold leading-relaxed italic">
                    "{viewerRating.message || "Students can submit ratings every Saturday."}"
                  </p>
                </div>
              </div>

              {/* Recent Review Cards */}
              <div className="space-y-3">
                {ratings.recentRatings?.length ? (
                  ratings.recentRatings.map((review) => (
                    <article className="p-4 bg-[#f8f9fb] border border-gray-50 rounded-[1.25rem] flex flex-col gap-2" key={review.id}>
                      <div className="flex justify-between items-center">
                        <div>
                          <strong className="text-xs font-bold text-gray-800 block truncate">{review.student?.name || "Student"}</strong>
                          <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">{formatReviewDate(review.ratedAt)}</span>
                        </div>
                        <span className="text-amber-500 text-xs tracking-wider font-bold">
                          {renderStars(review.score)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed italic bg-white p-2.5 rounded-[0.75rem] border border-gray-50">
                        "{review.feedback || "No written feedback provided."}"
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 font-bold text-xs bg-[#f8f9fb] rounded-[1.25rem] border border-gray-50">No student reviews submitted yet.</div>
                )}
              </div>
            </div>

            {/* Saturday Rating Form Card (Only visible to students looking at another teacher) */}
            {!isOwnProfile && user?.role === "student" ? (
              <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-50/50 flex flex-col gap-5">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rate Teacher</p>
                  <h2 className="text-lg font-bold text-gray-900">Weekly Review</h2>
                </div>

                {viewerRating.isAssignedStudent ? (
                  <form className="space-y-4" onSubmit={handleRatingSubmit}>
                    <div className="flex gap-2" role="radiogroup" aria-label="Teacher rating">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          className={`w-11 h-11 rounded-[0.75rem] border-2 font-bold text-lg flex items-center justify-center transition-all ${
                            ratingForm.score >= score 
                              ? "border-amber-300 bg-amber-50 text-amber-500" 
                              : "border-gray-100 bg-gray-50 text-gray-300 hover:bg-gray-100/50"
                          }`}
                          onClick={() => setRatingForm((prev) => ({ ...prev, score }))}
                          disabled={!viewerRating.canRate}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Written Feedback</label>
                      <textarea
                        value={ratingForm.feedback}
                        onChange={(event) =>
                          setRatingForm((prev) => ({ ...prev, feedback: event.target.value }))
                        }
                        rows="3"
                        maxLength="500"
                        className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200 resize-none"
                        placeholder="Share what is helping you most in class."
                        disabled={!viewerRating.canRate}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={ratingSaving || !viewerRating.canRate || !ratingForm.score}
                      className="px-5 py-3.5 bg-[#1e1e1e] hover:bg-black text-white disabled:bg-gray-100 disabled:text-gray-400 rounded-[1.25rem] text-xs font-bold tracking-wider uppercase transition-colors"
                    >
                      {ratingSaving ? "Saving rating..." : viewerRating.todayRating ? "Update Rating" : "Submit Rating"}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 text-gray-400 font-bold text-xs bg-[#f8f9fb] rounded-[1.25rem] border border-gray-50">
                    You can only rate the teacher assigned to your class group.
                  </div>
                )}
              </div>
            ) : null}

            {/* Current Classes List */}
            <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-50/50 flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Classes</p>
                <h2 className="text-lg font-bold text-gray-900">Current Groups</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {profile?.groups?.length ? (
                  profile.groups.map((group) => (
                    <article className="p-4 bg-[#f8f9fb] border border-gray-50 rounded-[1.25rem] flex justify-between items-center" key={group.id}>
                      <div>
                        <strong className="text-xs font-bold text-gray-800 block truncate">{group.groupName}</strong>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">{group.instrument}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-500">
                        {group.filled}/{group.capacity} students
                      </span>
                    </article>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-6 text-gray-400 font-bold text-xs bg-[#f8f9fb] rounded-[1.25rem] border border-gray-50">
                    No active training groups yet.
                  </div>
                )}
              </div>
            </div>

            {/* Edit Profile Form (Only for own teacher profile) */}
            {isOwnProfile && (
              <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-50/50 flex flex-col gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Edit Info</p>
                  <h2 className="text-lg font-bold text-gray-900">Update Profile Details</h2>
                </div>

                <form className="space-y-4" onSubmit={handleSave}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Full Name</label>
                      <input name="name" value={form.name} onChange={handleChange} className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200" required />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Contact Number</label>
                      <input name="contactNumber" value={form.contactNumber} onChange={handleChange} className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200" placeholder="98xxxxxxxx" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Instrument Expertise</label>
                      <input name="instrumentExpertise" value={form.instrumentExpertise} onChange={handleChange} className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200" required />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Years of Experience</label>
                      <input name="yearsOfExperience" type="number" min="0" value={form.yearsOfExperience} onChange={handleChange} className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200" required />
                    </div>

                    <div className="flex flex-col gap-2 col-span-2">
                      <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Upload Profile Picture</label>
                      <div className="flex items-center gap-6 p-4 border-2 border-dashed border-gray-100 rounded-[1.5rem] bg-[#f8f9fb] hover:bg-gray-50/55 transition-colors relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-gray-100 shadow-sm relative group cursor-pointer">
                          {form.profileImage ? (
                            <img src={form.profileImage} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-xl font-extrabold text-gray-400">{(form.name?.[0] || user?.name?.[0] || "T").toUpperCase()}</div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                          <input 
                            type="file" 
                            accept="image/*" 
                            id="teacher-avatar-upload" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 2 * 1024 * 1024) {
                                alert("File size must be less than 2MB.");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setForm((prev) => ({ ...prev, profileImage: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          <label 
                            htmlFor="teacher-avatar-upload" 
                            className="w-fit px-4 py-2 bg-white border border-gray-200 hover:border-black rounded-xl font-bold text-xs text-gray-700 cursor-pointer shadow-sm transition-all"
                          >
                            Choose Image File
                          </label>
                          <span className="text-[11px] text-gray-400 font-medium">Supports JPG, PNG, GIF up to 2MB.</span>
                        </div>
                        {form.profileImage && (
                          <button 
                            type="button" 
                            onClick={() => setForm((prev) => ({ ...prev, profileImage: "" }))} 
                            className="px-3 py-1.5 border border-red-100 hover:bg-red-50 text-red-500 rounded-xl font-bold text-xs transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Teacher Bio</label>
                      <textarea name="teacherBio" value={form.teacherBio} onChange={handleChange} rows="4" className="p-3 border border-gray-100 bg-[#f8f9fb] rounded-[1rem] text-xs font-bold placeholder-gray-300 focus:outline-none focus:border-gray-200 resize-none" required />
                    </div>
                  </div>

                  <button type="submit" disabled={saving} className="px-5 py-3.5 bg-[#1e1e1e] hover:bg-black text-white rounded-[1.25rem] text-xs font-bold tracking-wider uppercase transition-colors">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>
    </Layout>
  );
};

export default TeacherProfile;
