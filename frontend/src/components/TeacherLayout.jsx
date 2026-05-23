import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import NoticeDropdown from "./NoticeDropdown";
import LogoutModal from "./LogoutModal";

// Icons
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const TaskIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;

const TeacherLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const sidebarLinks = [
    { name: "Dashboard", icon: <DashboardIcon />, path: "/teacher-dashboard", match: "/teacher-dashboard" },
    { name: "Group Chat", icon: <ChatIcon />, path: "/chat", match: "/chat" },
    { name: "Assign Task", icon: <TaskIcon />, path: "/teacher-tasks", match: "/teacher-tasks" },
  ];

  return (
    <div className="flex h-screen bg-[#e8ecf3] p-4 gap-4 font-sans text-gray-800">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white rounded-[2rem] p-6 flex flex-col shadow-sm">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-10 h-10 bg-purple-200 rounded-[14px] flex items-center justify-center text-purple-900 font-extrabold text-xl">
            T
          </div>
          <span className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate("/teacher-dashboard")}>Harmoniq</span>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = currentPath === link.match;
            return (
              <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] text-left font-semibold transition-colors ${
                  isActive ? "bg-[#1e1e1e] text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <div className={`flex items-center justify-center ${isActive ? "text-white" : "text-gray-400"}`}>
                  {link.icon}
                </div>
                <span className="text-[15px]">{link.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1">
          <button className="w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] text-left font-semibold text-gray-500 hover:bg-gray-50 transition-colors" onClick={() => navigate("/teacher-profile")}>
            <div className="text-gray-400"><SettingsIcon /></div>
            <span className="text-[15px]">Profile & Settings</span>
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] text-left font-semibold text-gray-500 hover:bg-gray-50 transition-colors" onClick={() => setIsLogoutModalOpen(true)}>
             <div className="text-gray-400"><LogoutIcon /></div>
            <span className="text-[15px]">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-4 overflow-hidden py-2 pr-2">
        {/* Top Header */}
        <header className="flex justify-between items-center h-16 gap-4">
          <div className="flex-1"></div>
          <div className="flex items-center gap-3">
            <button className="w-[52px] h-[52px] bg-[#1e1e1e] text-white rounded-[1.25rem] flex items-center justify-center hover:bg-black transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
            <NoticeDropdown customTrigger={true} />
            <div className="bg-white rounded-[1.25rem] p-1.5 pr-5 flex items-center gap-3 shadow-sm cursor-pointer ml-1" onClick={() => navigate('/teacher-profile')}>
              <img src={user?.avatar || user?.profileImage || "https://i.pravatar.cc/150?img=60"} alt="Profile" className="w-[40px] h-[40px] rounded-[14px] object-cover" />
              <div className="flex flex-col justify-center">
                <span className="text-[14px] font-bold leading-none mb-1">{user?.name || "Teacher"}</span>
                <span className="text-[12px] text-gray-400 font-medium leading-none capitalize">{user?.role || "Instructor"}</span>
              </div>
              <span className="ml-1 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </div>
  );
};

export default TeacherLayout;
