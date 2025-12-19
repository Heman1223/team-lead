import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children, title }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Header title={title} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <main className="main-content">
                <div className="page-container">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
