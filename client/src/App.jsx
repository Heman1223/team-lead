import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TeamManagement from './pages/TeamManagement';
import TaskManagement from './pages/TaskManagement';
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

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
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

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
