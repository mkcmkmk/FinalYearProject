import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import "./NoticeDropdown.css";

const formatNoticeDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const normalizeNoticeAudience = (value) => {
  const next = String(value || "")
    .trim()
    .toLowerCase();

  if (["all", "everyone", "users"].includes(next)) {
    return "all";
  }

  if (["student", "students", "student-only", "student_only"].includes(next)) {
    return "student";
  }

  if (["teacher", "teachers", "teacher-only", "teacher_only"].includes(next)) {
    return "teacher";
  }

  return "all";
};

const normalizeViewerRole = (value) => {
  const next = String(value || "")
    .trim()
    .toLowerCase();

  return next === "teacher" ? "teacher" : "student";
};

const NoticeDropdown = ({ className = "", customTrigger = false }) => {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notices, setNotices] = useState([]);
  const shellRef = useRef(null);
  const viewerAudience = normalizeViewerRole(user?.role);

  const loadNotices = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");
      const res = await axios.get("http://localhost:3000/api/users/notices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotices(res.data?.notices || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const visibleNotices = useMemo(
    () =>
      notices.filter((notice) => {
        const audience = normalizeNoticeAudience(notice.audience);
        return audience === "all" || audience === viewerAudience;
      }),
    [notices, viewerAudience]
  );

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (shellRef.current && !shellRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const noticeCount = visibleNotices.length;
  const pinnedCount = useMemo(
    () => visibleNotices.filter((notice) => notice.isPinned).length,
    [visibleNotices]
  );

  return (
    <div className={`notice-shell ${className}`.trim()} ref={shellRef}>
      {customTrigger ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`w-[52px] h-[52px] bg-white rounded-[1.25rem] flex items-center justify-center shadow-sm relative text-purple-500 transition-all hover:scale-105 active:scale-95 ${open ? "border-2 border-purple-300" : ""}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          {noticeCount > 0 && (
            <span className="absolute top-[14px] right-[14px] w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      ) : (
        <button
          type="button"
          className={open ? "notice-trigger active" : "notice-trigger"}
          onClick={() => setOpen((current) => !current)}
        >
          <span>Notice</span>
          <strong>{noticeCount}</strong>
        </button>
      )}

      {open ? (
        <div className="notice-panel">
          <div className="notice-panel-head">
            <div>
              <p>Admin notices</p>
              <h3 className="text-md font-bold text-gray-900">Latest updates</h3>
            </div>
            <button type="button" className="notice-refresh" onClick={loadNotices}>
              Refresh
            </button>
          </div>

          {error ? <div className="notice-state notice-state--error">{error}</div> : null}
          {loading ? <div className="notice-state">Loading notices...</div> : null}
          {!loading && !error && visibleNotices.length === 0 ? (
            <div className="notice-state">No admin notices yet.</div>
          ) : null}

          {!loading && !error && visibleNotices.length > 0 ? (
            <div className="notice-list">
              {visibleNotices.map((notice) => {
                const noticeAudience = normalizeNoticeAudience(notice.audience);

                return (
                  <article className="notice-item" key={notice.id}>
                    <div className="notice-item-head">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{notice.title}</h4>
                        <span className="text-[11px] text-gray-400 font-semibold block mt-0.5">
                          {notice.isPinned ? "📌 Pinned" : noticeAudience} - {formatNoticeDate(notice.createdAt)}
                        </span>
                      </div>
                      {notice.isPinned ? <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold">Pinned</span> : null}
                    </div>
                    <p className="text-xs text-gray-600 font-semibold leading-relaxed mt-2.5">{notice.message}</p>
                    <small className="text-[11px] text-gray-400 font-semibold block mt-2.5">Posted by {notice.authorName}</small>
                  </article>
                );
              })}
            </div>
          ) : null}

          <div className="notice-panel-foot">
            <span>{pinnedCount} pinned</span>
            <span>{noticeCount} total</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NoticeDropdown;
