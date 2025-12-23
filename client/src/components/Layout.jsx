import Sidebar from './Sidebar';
import { Bell, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Layout = ({ children, title }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto" style={{ marginLeft: '256px' }}>
        {title && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              
              <div className="flex items-center gap-2">
                <Link 
                  to="/notifications" 
                  className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all duration-200 relative group"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </Link>
                
                <Link 
                  to="/settings" 
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        )}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;