import Sidebar from './Sidebar';

const Layout = ({ children, title }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto" style={{ marginLeft: '256px' }}>
        {title && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          </div>
        )}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;