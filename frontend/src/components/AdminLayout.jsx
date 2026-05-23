import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import LogoutModal from "./LogoutModal";

const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const TeachersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>;
const ClassesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const PaymentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>;
const NoticesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const adminLinks = [
    { name: "Dashboard", icon: <DashboardIcon />, path: "/admin-dashboard", active: location.pathname === "/admin-dashboard" },
    { name: "Users", icon: <UsersIcon />, path: "/admin-dashboard", active: false }, // Placeholder
    { name: "Teachers", icon: <TeachersIcon />, path: "/admin/teachers", active: location.pathname.includes("/admin/teachers") },
    { name: "Classes", icon: <ClassesIcon />, path: "/admin-dashboard", active: false }, // Placeholder
    { name: "Payments", icon: <PaymentsIcon />, path: "/admin-dashboard", active: false }, // Placeholder
    { name: "Notices", icon: <NoticesIcon />, path: "/admin-dashboard", active: false }, // Placeholder
  ];

  return (
    <div className="dash flex h-screen bg-[#e8ecf3] p-4 gap-4 font-sans text-gray-800">
      <aside className="w-[260px] bg-white rounded-[2rem] p-6 flex flex-col shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-10 h-10 bg-blue-600 rounded-[14px] flex items-center justify-center text-white font-extrabold text-xl">
            A
          </div>
          <span className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate("/admin-dashboard")}>Admin Panel</span>
        </div>

        <nav className="flex-1 space-y-1">
          {adminLinks.map((link) => (
            <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] text-left font-semibold transition-colors border-none cursor-pointer ${
                  link.active ? "bg-blue-600 text-white" : "text-gray-500 bg-transparent hover:bg-gray-50"
                }`}
              >
                <div className={`flex items-center justify-center ${link.active ? "text-white" : "text-gray-400"}`}>
                {link.icon}
              </div>
              <span className="text-[15px]">{link.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-1">
          <button className="w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] text-left font-semibold text-gray-500 hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer">
            <div className="text-gray-400"><SettingsIcon /></div>
            <span className="text-[15px]">Profile & Settings</span>
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] text-left font-semibold text-gray-500 hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer" onClick={() => setIsLogoutModalOpen(true)}>
            <div className="text-gray-400"><LogoutIcon /></div>
            <span className="text-[15px]">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - flex-1 is passed to children layout */}
      {children}
      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </div>
  );
};

export default AdminLayout;
