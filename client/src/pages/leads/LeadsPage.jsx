import React, { useState } from 'react';
import LeadDashboard from './LeadDashboard';
import LeadList from './LeadList';
import LeadImport from './LeadImport';
import LeadDetail from './LeadDetail';
import CreateLeadModal from './CreateLeadModal';
import {
    LayoutDashboard,
    List,
    Upload,
    Target,
    Plus,
    Filter,
    ChevronRight,
    Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LeadsPage = () => {
    const { isAdmin, isTeamLead } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedLeadId, setSelectedLeadId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const tabs = [
        { id: 'dashboard', label: 'Revenue Pipeline', icon: LayoutDashboard },
        { id: 'list', label: 'Lead Database', icon: List },
        { id: 'import', label: 'Bulk Intake', icon: Upload, adminOnly: true }
    ];

    const filteredTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

    const handleUpdate = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="p-8 md:p-12 max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-1000 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.05),transparent_40%)]">
            {/* Page Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-8 border-b border-gray-800/50">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-orange-500 font-black text-xs tracking-[0.3em] uppercase">
                        <div className="w-8 h-px bg-orange-500/50" />
                        <Target size={16} />
                        <span>Commerce Engine</span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter">
                        Lead <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-700">Intelligence</span>
                    </h1>
                    <p className="text-gray-400 text-xl max-w-3xl font-medium leading-relaxed">
                        Orchestrate your sales lifecycle with precision. Monitor conversion metrics,
                        assign high-value targets, and accelerate your project pipeline.
                    </p>
                </div>
                <div className="flex flex-wrap gap-5">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-3 bg-gray-900 text-white border border-gray-800 px-10 py-5 rounded-[2rem] font-black text-lg hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"
                    >
                        <Plus size={24} className="text-orange-500" />
                        Manual Entry
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('import')}
                            className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-[0_20px_40px_rgba(249,115,22,0.25)] hover:shadow-[0_25px_50px_rgba(249,115,22,0.35)] hover:scale-[1.05] transition-all active:scale-95"
                        >
                            <Upload size={24} />
                            Ingest Data
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-800 gap-1 overflow-x-auto pb-px">
                {filteredTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-4 relative transition-all duration-300 whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'text-orange-500 font-bold'
                                : 'text-gray-500 hover:text-gray-300 font-medium'
                            }
                        `}
                    >
                        <tab.icon size={20} />
                        <span>{tab.label}</span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-full shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div key={refreshKey} className="min-h-[60vh]">
                {activeTab === 'dashboard' && <LeadDashboard />}
                {activeTab === 'list' && <LeadList onSelectLead={setSelectedLeadId} />}
                {activeTab === 'import' && <LeadImport onComplete={() => setActiveTab('list')} />}
            </div>

            {/* Detail Modal */}
            {selectedLeadId && (
                <LeadDetail
                    leadId={selectedLeadId}
                    onClose={() => setSelectedLeadId(null)}
                    onUpdate={handleUpdate}
                />
            )}

            {isCreateModalOpen && (
                <CreateLeadModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handleUpdate}
                />
            )}
        </div>
    );
};

export default LeadsPage;
