import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Bell, 
  MessageSquare, 
  BarChart3, 
  UserCog, 
  UsersRound, 
  ClipboardList, 
  Activity,
  LogOut,
  Settings,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isTeamLead, isAdmin, logout } = useAuth();
  const isTeamMember = user?.role === 'team_member';

  const adminMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'User Management', icon: UserCog },
    { path: '/admin/teams', label: 'Team Management', icon: UsersRound },
    { path: '/admin/tasks', label: 'Task Assignment', icon: ClipboardList },
    { path: '/admin/activities', label: 'Activity Logs', icon: Activity }
  ];

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/team', label: 'Team', icon: Users },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/task-breakdown', label: 'Task Breakdown', icon: ClipboardList, teamLeadOnly: true },
    { path: '/my-subtasks', label: 'My Subtasks', icon: CheckSquare, teamMemberOnly: true },
    { path: '/communication', label: 'Communication', icon: MessageSquare },
    { path: '/reports', label: 'Reports', icon: BarChart3, teamLeadOnly: true }
  ];

  const displayMenuItems = isAdmin 
    ? adminMenuItems 
    : menuItems.filter(item => {
        if (item.teamLeadOnly && !isTeamLead) return false;
        if (item.teamMemberOnly && !isTeamMember) return false;
        return true;
      });

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl z-50 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ width: '256px' }}>
        {/* Close Button (Mobile Only) */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-700/50 bg-gradient-to-r from-orange-600/10 to-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">TeamLead</span>
              <span className="text-xs text-orange-400 font-medium">Management</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-1">
            {displayMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={({ isActive }) => `
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' 
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-orange-400'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-orange-400'}`} />
                      <span className="font-medium text-sm">{item.label}</span>
                      {isActive && <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/20">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">
                {user?.role === 'admin' ? 'Administrator' : user?.role === 'team_lead' ? 'Team Lead' : 'Team Member'}
              </p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-orange-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 group-hover:text-white" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;