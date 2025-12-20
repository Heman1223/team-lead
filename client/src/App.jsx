import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminTeamManagement from './pages/AdminTeamManagement';
import TeamDetailsPage from './pages/TeamDetailsPage';
import MemberDetailsPage from './pages/MemberDetailsPage';
import AdminTaskAssignment from './pages/AdminTaskAssignment';
import AdminActivityLogs from './pages/AdminActivityLogs';
import TeamManagement from './pages/TeamManagement';
import TaskManagement from './pages/TaskManagement';
import TeamLeadTaskBreakdown from './pages/TeamLeadTaskBreakdown';
import MemberSubtasks from './pages/MemberSubtasks';
import Notifications from './pages/Notifications';
import Communication from './pages/Communication';
import Reports from './pages/Reports';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - Role-Based Dashboards */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="non-admin">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="admin">
              <AdminUserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/teams" element={
            <ProtectedRoute requiredRole="admin">
              <AdminTeamManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/team/:teamId" element={
            <ProtectedRoute requiredRole="admin">
              <TeamDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/member/:memberId" element={
            <ProtectedRoute requiredRole="admin">
              <MemberDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/tasks" element={
            <ProtectedRoute requiredRole="admin">
              <AdminTaskAssignment />
            </ProtectedRoute>
          } />
          <Route path="/admin/activities" element={
            <ProtectedRoute requiredRole="admin">
              <AdminActivityLogs />
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <TeamManagement />
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <TaskManagement />
            </ProtectedRoute>
          } />
          <Route path="/task-breakdown" element={
            <ProtectedRoute requiredRole="team_lead">
              <TeamLeadTaskBreakdown />
            </ProtectedRoute>
          } />
          <Route path="/my-subtasks" element={
            <ProtectedRoute>
              <MemberSubtasks />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/communication" element={
            <ProtectedRoute>
              <Communication />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute requiredRole="team_lead">
              <Reports />
            </ProtectedRoute>
          } />

          {/* Default Redirect - Role Based */}
          <Route path="/" element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          } />
          <Route path="*" element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
