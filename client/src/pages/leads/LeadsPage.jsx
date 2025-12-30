import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import LeadDashboard from './LeadDashboard';
import LeadList from './LeadListSimple';
import LeadImport from './LeadImportSimple';
import LeadDetail from './LeadDetailSimple';
import CreateLeadModal from './CreateLeadModalSimple';
import {
    LayoutDashboard,
    List,
    Upload,
    Plus,
    Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const LeadsPage = () => {
    const { isAdmin, isTeamLead } = useAuth();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedLeadId, setSelectedLeadId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const openId = searchParams.get('open');
        if (openId) {
            setSelectedLeadId(openId);
        }
    }, [searchParams]);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'list', label: 'All Leads', icon: List },
        { id: 'import', label: 'Import Leads', icon: Upload, adminOnly: true }
    ];

    const filteredTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

    const handleUpdate = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <Layout title="Lead Management">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
                        <p className="text-gray-600 mt-1">Manage your sales pipeline and track conversions</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors shadow-lg"
                        >
                            <Plus size={20} />
                            New Lead
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('import')}
                                className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                <Upload size={20} />
                                Import CSV
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="flex border-b border-gray-200">
                        {filteredTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-4 font-semibold transition-all relative
                                    ${activeTab === tab.id
                                        ? 'text-orange-600 border-b-2 border-orange-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }
                                `}
                            >
                                <tab.icon size={20} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'dashboard' && <LeadDashboard refreshTrigger={refreshKey} />}
                        {activeTab === 'list' && <LeadList key={refreshKey} onSelectLead={setSelectedLeadId} />}
                        {activeTab === 'import' && <LeadImport onComplete={() => setActiveTab('list')} />}
                    </div>
                </div>

                {/* Detail Modal */}
                {selectedLeadId && (
                    <LeadDetail
                        leadId={selectedLeadId}
                        onClose={() => setSelectedLeadId(null)}
                        onUpdate={handleUpdate}
                    />
                )}

                {/* Create Modal */}
                {isCreateModalOpen && (
                    <CreateLeadModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={handleUpdate}
                    />
                )}
            </div>
        </Layout>
    );
};

export default LeadsPage;
