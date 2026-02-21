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
  X,
  Target,
  History
} from 'lucide-react';
import logo from '../assets/img.jpeg';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isTeamLead, isAdmin, logout } = useAuth();
  const isTeamMember = user?.role === 'team_member';

  const adminMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'User Management', icon: UserCog },
    { path: '/admin/teams', label: 'Team Management', icon: Users },
    { path: '/admin/tasks', label: 'Task Assignment', icon: CheckSquare },
    { path: '/leads', label: 'Lead Management', icon: Target },
    { path: '/admin/activities', label: 'Activity Log', icon: History }
  ];

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/leads', label: 'Leads', icon: Target },
    { path: '/team', label: 'Team', icon: Users },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
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
        fixed left-0 top-0 h-screen w-64 bg-[#1D1110] shadow-2xl z-50 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ width: '256px' }}>
        
        {/* Logo Section */}
        <div className="h-24 flex items-center px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-white leading-tight tracking-tight">Project and Lead Management</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pt-6 px-4">
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
                      ? 'bg-white/10 text-white shadow-xl'
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0`} />
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Info & Footer Actions */}
        <div className="mt-auto p-4 space-y-4">
            <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 bg-gray-100 flex items-center justify-center">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-bold text-[#1D1110]">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate tracking-tight">{user?.name || 'Administrator'}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {user?.role?.replace('_', ' ') || 'Admin'}
                        </p>
                    </div>
                </div>
                
                <div className="space-y-1">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all text-xs font-bold"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;