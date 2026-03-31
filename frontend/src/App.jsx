import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherProfile from "./pages/TeacherProfile";
import CourseDetail from "./pages/CourseDetail";
import ChatPage from "./pages/ChatPage";
import SignUp from "./pages/SignUp";
import Pay from "./pages/Pay";
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher-profile" element={<TeacherProfile />} />
      <Route path="/teachers/:teacherId" element={<TeacherProfile />} />
      <Route path="/courses/:instrumentId" element={<CourseDetail />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/pay" element={<Pay />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;
