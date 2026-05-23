import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTeachers from "./pages/AdminTeachers";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherProfile from "./pages/TeacherProfile";
import CourseDetail from "./pages/CourseDetail";
import ChatPage from "./pages/ChatPage";
import SignUp from "./pages/SignUp";
import Pay from "./pages/Pay";
import Profile from "./pages/Profile";
import StudentSchedule from "./pages/StudentSchedule";
import KhaltiCallback from "./pages/KhaltiCallback";

import TeacherTasks from "./pages/TeacherTasks";
import "./components/GlobalStyles.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin/teachers" element={<AdminTeachers />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher-profile" element={<TeacherProfile />} />
      <Route path="/teacher-tasks" element={<TeacherTasks />} />
      <Route path="/teachers/:teacherId" element={<TeacherProfile />} />
      <Route path="/courses/:instrumentId" element={<CourseDetail />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/pay" element={<Pay />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/schedule" element={<StudentSchedule />} />
      <Route path="/khalti-callback" element={<KhaltiCallback />} />
    </Routes>
  );
}

export default App;
