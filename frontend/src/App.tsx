import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import TeachersPage from './pages/TeachersPage';
import DepartmentsPage from './pages/DepartmentsPage';
import CoursesPage from './pages/CoursesPage';
import AttendancePage from './pages/AttendancePage';
import ExaminationsPage from './pages/ExaminationsPage';
import FeesPage from './pages/FeesPage';
import TimetablePage from './pages/TimetablePage';
import NotificationsPage from './pages/NotificationsPage';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                <Route element={<RoleRoute roles={['admin', 'teacher']} />}>
                  <Route path="students" element={<StudentsPage />} />
                </Route>
                <Route element={<RoleRoute roles={['admin', 'teacher', 'student']} />}>
                  <Route path="students/:id" element={<StudentDetailPage />} />
                </Route>

                <Route element={<RoleRoute roles={['admin']} />}>
                  <Route path="teachers" element={<TeachersPage />} />
                  <Route path="departments" element={<DepartmentsPage />} />
                </Route>

                <Route element={<RoleRoute roles={['admin', 'teacher']} />}>
                  <Route path="courses" element={<CoursesPage />} />
                </Route>

                <Route path="attendance" element={<AttendancePage />} />
                <Route path="examinations" element={<ExaminationsPage />} />

                <Route element={<RoleRoute roles={['admin', 'student']} />}>
                  <Route path="fees" element={<FeesPage />} />
                </Route>

                <Route path="timetable" element={<TimetablePage />} />
                <Route path="notifications" element={<NotificationsPage />} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

