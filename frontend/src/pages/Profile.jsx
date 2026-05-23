import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import "./Profile.css";

const normalizeStatus = (s) => {
  const v = String(s || "").toLowerCase().trim();
  if (["active", "paid", "success", "subscribed"].includes(v)) return "active";
  if (["pending", "processing"].includes(v)) return "pending";
  if (["expired", "inactive", "canceled", "cancelled"].includes(v)) return "expired";
  return "none";
};

const DASH = "-";

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
        setMsg("Profile updated successfully.");
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

  const instrument = sub?.instrument || DASH;
  const level = sub?.level || DASH;
  const plan = sub?.plan || DASH;
  const status = normalizeStatus(sub?.status);

  const teacherName = sub?.teacher?.name || DASH;
  const teacherId = sub?.teacher?.id || sub?.teacher?._id || "";
  const groupName = sub?.groupName || sub?.group?.groupName || DASH;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#e8ecf3] text-gray-500 font-medium">
        Loading profile...
      </div>
    );
  }

  if (err) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#e8ecf3] gap-4">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm text-center">
          <p className="text-red-500 font-semibold mb-4">{err}</p>
          <button className="px-5 py-3 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-sm hover:bg-black transition-colors" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="flex gap-4 h-full overflow-hidden">
        {/* Left column - Info Sidebar */}
        <aside className="w-[30%] flex flex-col gap-4 overflow-y-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-4 border-2 border-gray-100 shadow-inner">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <div className="text-3xl font-extrabold text-gray-400">{(user?.name?.[0] || "U").toUpperCase()}</div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-xs text-gray-400 font-semibold uppercase mt-0.5 tracking-wider">{user?.role}</p>
            <p className="text-sm text-gray-500 mt-2 font-medium break-all">{user?.email}</p>

            <div className="flex gap-2.5 w-full mt-6">
              <button className="flex-1 py-3 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-xs hover:bg-black transition-colors" onClick={() => setTab("edit")}>
                Edit Profile
              </button>
              <button className="flex-1 py-3 border-2 border-gray-100 rounded-[1.25rem] font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => setTab("subscription")}>
                Subscription
              </button>
            </div>
          </div>

          {/* Subscription Mini Stats */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-md font-bold text-gray-900 mb-1">Subscription Overview</h3>
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-gray-400">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                status === "active" ? "bg-green-100 text-green-700" :
                status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
              }`}>{status}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold border-t border-gray-50 pt-3">
              <span className="text-gray-400">Plan</span>
              <span className="text-gray-800">{plan}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold border-t border-gray-50 pt-3">
              <span className="text-gray-400">Instrument</span>
              <span className="text-gray-800">{instrument}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold border-t border-gray-50 pt-3">
              <span className="text-gray-400">Level</span>
              <span className="text-gray-800">{level}</span>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-md font-bold text-gray-900 mb-1">Assigned Details</h3>
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-gray-400">Teacher</span>
              <span className="text-gray-800">{teacherName}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold border-t border-gray-50 pt-3">
              <span className="text-gray-400">Group</span>
              <span className="text-gray-800">{groupName}</span>
            </div>
            {teacherId && (
              <button className="w-full mt-2 py-3 border-2 border-gray-100 rounded-[1.25rem] font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => navigate(`/teachers/${teacherId}`)}>
                View Teacher Profile
              </button>
            )}
          </div>
        </aside>

        {/* Right column - Dynamic Tabs Area */}
        <main className="flex-1 bg-white rounded-[2rem] p-8 shadow-sm flex flex-col overflow-hidden h-full">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{user?.name}</h1>
              <p className="text-sm text-gray-400 mt-1">Manage your profile, assignments, and subscription details.</p>
            </div>
            <div className="flex gap-2">
              {["about", "subscription", "edit"].map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-4.5 py-2.5 rounded-[1.25rem] text-[13px] font-bold transition-colors ${
                  tab === t ? "bg-[#1e1e1e] text-white" : "border-2 border-gray-100 text-gray-600 hover:bg-gray-50"
                }`}>
                  {t === "about" ? "About" : t === "subscription" ? "Subscription" : "Edit Profile"}
                </button>
              ))}
              <button className="px-4.5 py-2.5 border-2 border-red-100 rounded-[1.25rem] text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors ml-2" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          <hr className="border-gray-100 mb-6" />

          {msg && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl font-bold text-sm">{msg}</div>}

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {tab === "about" && (
              <div className="space-y-6">
                <h3 className="text-[17px] font-bold text-gray-800">General Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", val: user?.name },
                    { label: "Role", val: user?.role, style: "capitalize" },
                    { label: "Email Address", val: user?.email },
                    { label: "Contact Number", val: user?.contactNumber || DASH },
                  ].map((field, idx) => (
                    <div key={idx} className="bg-[#f8f9fb] rounded-[1.25rem] p-4.5 border border-gray-50 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-gray-400 uppercase mb-1">{field.label}</span>
                      <strong className={`text-md font-bold text-gray-800 ${field.style || ""}`}>{field.val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "subscription" && (
              <div className="space-y-6">
                <h3 className="text-[17px] font-bold text-gray-800">Subscription & Group Assignment</h3>
                {sub ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Subscription Status", val: status, isPill: true },
                      { label: "Plan Type", val: plan },
                      { label: "Learning Instrument", val: instrument },
                      { label: "Proficiency Level", val: level },
                      { label: "Class Instructor", val: teacherName },
                      { label: "Teaching Group", val: groupName },
                    ].map((field, idx) => (
                      <div key={idx} className="bg-[#f8f9fb] rounded-[1.25rem] p-4.5 border border-gray-50 flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-gray-400 uppercase mb-1">{field.label}</span>
                        {field.isPill ? (
                          <strong className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-bold capitalize ${
                            status === "active" ? "bg-green-100 text-green-700" :
                            status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                          }`}>{field.val}</strong>
                        ) : (
                          <strong className="text-md font-bold text-gray-800">{field.val}</strong>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-[#f8f9fb] rounded-[1.5rem] border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 font-bold">No active subscription found.</p>
                    <button className="mt-4 px-5 py-3 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-sm hover:bg-black transition-colors" onClick={() => navigate("/pay")}>
                      Subscribe Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === "edit" && (
              <div className="space-y-6">
                <h3 className="text-[17px] font-bold text-gray-800">Edit Profile Details</h3>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-gray-500">Full Name</label>
                      <input className="px-4.5 py-3 border border-gray-200 rounded-[1.25rem] text-sm font-semibold focus:outline-none focus:border-black transition-colors" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-gray-500">Contact Number (optional)</label>
                      <input className="px-4.5 py-3 border border-gray-200 rounded-[1.25rem] text-sm font-semibold focus:outline-none focus:border-black transition-colors" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="98xxxxxxxx" />
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-gray-500">Upload Profile Picture</label>
                      <div className="flex items-center gap-6 p-4 border-2 border-dashed border-gray-100 rounded-[1.5rem] bg-[#f8f9fb] hover:bg-gray-50/50 transition-colors relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-gray-100 shadow-sm relative group cursor-pointer">
                          {profileImage ? (
                            <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-xl font-extrabold text-gray-400">{(name?.[0] || user?.name?.[0] || "U").toUpperCase()}</div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                          <input 
                            type="file" 
                            accept="image/*" 
                            id="student-avatar-upload" 
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
                                setProfileImage(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          <label 
                            htmlFor="student-avatar-upload" 
                            className="w-fit px-4 py-2 bg-white border border-gray-200 hover:border-black rounded-xl font-bold text-xs text-gray-700 cursor-pointer shadow-sm transition-all"
                          >
                            Choose Image File
                          </label>
                          <span className="text-[11px] text-gray-400 font-medium">Supports JPG, PNG, GIF up to 2MB.</span>
                        </div>
                        {profileImage && (
                          <button 
                            type="button" 
                            onClick={() => setProfileImage("")} 
                            className="px-3 py-1.5 border border-red-100 hover:bg-red-50 text-red-500 rounded-xl font-bold text-xs transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button className="px-5 py-3.5 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-sm hover:bg-black transition-colors" type="submit">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </StudentLayout>
  );
};

export default Profile;
