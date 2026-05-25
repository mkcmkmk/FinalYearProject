import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
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
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentHistory from "./pages/PaymentHistory";
import TeacherTasks from "./pages/TeacherTasks";
import "./components/GlobalStyles.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/courses/:instrumentId" element={<CourseDetail />} />

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminTeachers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pay"
        element={
          <ProtectedRoute roles={["student"]}>
            <Pay />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentSchedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/khalti-callback"
        element={
          <ProtectedRoute roles={["student"]}>
            <KhaltiCallback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/success"
        element={
          <ProtectedRoute roles={["student"]}>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/failure"
        element={
          <ProtectedRoute roles={["student"]}>
            <PaymentFailure />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/history"
        element={
          <ProtectedRoute roles={["student"]}>
            <PaymentHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute roles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher-tasks"
        element={
          <ProtectedRoute roles={["teacher"]}>
            <TeacherTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher-profile"
        element={
          <ProtectedRoute roles={["teacher"]}>
            <TeacherProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute roles={["student", "teacher"]}>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={["student", "teacher", "admin"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teachers/:teacherId"
        element={
          <ProtectedRoute roles={["student", "teacher", "admin"]}>
            <TeacherProfile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
