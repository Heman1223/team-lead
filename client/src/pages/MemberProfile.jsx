import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    User, Mail, Phone, Calendar, ArrowLeft, 
    CheckCircle, Clock, AlertCircle, Briefcase, 
    TrendingUp, PieChart as PieChartIcon
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import Layout from '../components/Layout';
import api from '../services/api';

const MemberProfile = () => {
    const { memberId } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);

    useEffect(() => {
        fetchMemberData();
    }, [memberId]);

    const fetchMemberData = async () => {
        try {
            setLoading(true);
            
            // Allow fetching by ID or "me"
            const targetId = memberId === 'me' ? 'me' : memberId;
            
            // 1. Fetch Member Details
            const userRes = await api.get(`/users/${targetId}`);
            setMember(userRes.data.data);

            // 2. Fetch All Tasks (we'll filter client-side or use a specific endpoint if available)
            // Ideally backend should provide a "tasks for user" endpoint that includes parent info
            const tasksRes = await api.get('/tasks'); 
            const allTasks = tasksRes.data.data;
            
            // Filter tasks where this user is assigned to subtasks OR parent task
            // and group them by Parent Task (Project)
            const userSubtasks = [];
            const projectMap = new Map();

            // Helper for ID comparison
            const isAssigned = (assignee, userId) => {
                if (!assignee || !userId) return false;
                const assigneeId = assignee._id || assignee;
                const targetId = userId._id || userId;
                return String(assigneeId) === String(targetId);
            };

            const userId = userRes.data.data._id;

            allTasks.forEach(task => {
                const subtasks = task.subtasks || [];
                
                // 1. Get subtasks assigned to this user
                const relevantSubtasks = subtasks.filter(st => isAssigned(st.assignedTo, userId));
                
                // 2. Check if user is assigned the MAIN task
                const isMainAssignee = isAssigned(task.assignedTo, userId);

                if (relevantSubtasks.length > 0 || isMainAssignee) {
                    if (!projectMap.has(task._id)) {
                        projectMap.set(task._id, {
                            id: task._id,
                            title: task.title,
                            description: task.description,
                            status: task.status,
                            deadline: task.deadline,
                            subtasks: []
                        });
                    }
                    const project = projectMap.get(task._id);
                    
                    if (relevantSubtasks.length > 0) {
                        project.subtasks.push(...relevantSubtasks);
                    } else if (isMainAssignee) {
                        // If user is main assignee but has no subtasks assigned specifically,
                        // treat the main task as a subtask item for status/stats purposes
                        project.subtasks.push({
                            _id: task._id,
                            title: "Main Task Assignment",
                            status: task.status,
                            deadline: task.deadline || task.dueDate,
                            isMainTask: true
                        });
                    }
                }
            });

            setTasks(Array.from(projectMap.values()));

        } catch (error) {
            console.error('Error fetching member profile:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Chart Data Helpers ---

    const getProjectStats = (projectSubtasks) => {
        const completed = projectSubtasks.filter(t => t.status === 'completed').length;
        const inProgress = projectSubtasks.filter(t => t.status === 'in_progress').length;
        const blocked = projectSubtasks.filter(t => t.status === 'blocked').length;
        const pending = projectSubtasks.length - completed - inProgress - blocked;
        
        return [
            { name: 'Completed', value: completed, color: '#10B981' }, // Green
            { name: 'In Progress', value: inProgress, color: '#3B82F6' }, // Blue
            { name: 'Blocked', value: blocked, color: '#EF4444' }, // Red
            { name: 'Pending', value: pending, color: '#E5E7EB' } // Gray
        ].filter(item => item.value > 0);
    };

    const getOverallStats = () => {
        const totalSubtasks = tasks.flatMap(p => p.subtasks);
        if (totalSubtasks.length === 0) return [];

        const completed = totalSubtasks.filter(t => t.status === 'completed').length;
        const active = totalSubtasks.filter(t => t.status === 'in_progress').length;
        const issues = totalSubtasks.filter(t => t.status === 'blocked').length;

        return [
            { name: 'Completed', count: completed },
            { name: 'Active', count: active },
            { name: 'Issues', count: issues }
        ];
    };

    const getCompletionRate = () => {
        const totalSubtasks = tasks.flatMap(p => p.subtasks);
        if (totalSubtasks.length === 0) return 0;
        const completed = totalSubtasks.filter(t => t.status === 'completed').length;
        return Math.round((completed / totalSubtasks.length) * 100);
    };

    if (loading) {
        return (
            <Layout title="Member Profile">
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3E2723]"></div>
                </div>
            </Layout>
        );
    }

    if (!member) return <Layout title="Member Profile">User not found</Layout>;

    return (
        <Layout title={`${member.name}'s Profile`}>
            <div className="space-y-8 pb-12">
                {/* Header / Profile Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#5D4037] to-[#3E2723] opacity-90"></div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="absolute top-6 left-6 p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-colors z-10"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="relative mt-12 flex flex-col md:flex-row items-end md:items-center gap-6">
                        <div className="w-32 h-32 bg-white rounded-2xl p-1 shadow-lg -mb-4 md:mb-0 z-10">
                            <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-4xl font-bold text-gray-400">
                                {member.name.charAt(0)}
                            </div>
                        </div>
                        <div className="flex-1 pb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{member.name}</h1>
                            <p className="text-gray-500 font-medium text-lg">{member.designation || 'Team Member'}</p>
                            <div className="flex gap-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {member.email}</span>
                                {member.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {member.phone}</span>}
                            </div>
                        </div>
                        <div className="flex gap-4 z-10">
                            <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
                                <p className="text-3xl font-bold text-green-600">{getCompletionRate()}%</p>
                            </div>
                            <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Total Projects</p>
                                <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overall Progress Bar Chart */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 col-span-1 lg:col-span-2">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#3E2723]" />
                            Workload Overview
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getOverallStats()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                    <RechartsTooltip 
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#F97316" radius={[8, 8, 0, 0]} barSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="space-y-6">
                        <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-indigo-900">Total Completed</span>
                            </div>
                            <p className="text-4xl font-bold text-indigo-900">
                                {tasks.flatMap(t => t.subtasks).filter(s => s.status === 'completed').length}
                            </p>
                            <p className="text-sm text-indigo-700 mt-1">Subtasks across all projects</p>
                        </div>

                        <div className="bg-[#FAF7F2] rounded-3xl p-6 border border-[#EFEBE9]">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-[#EFEBE9] rounded-lg text-[#3E2723]">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-orange-900">Pending</span>
                            </div>
                            <p className="text-4xl font-bold text-orange-900">
                                {tasks.flatMap(t => t.subtasks).filter(s => s.status !== 'completed').length}
                            </p>
                            <p className="text-sm text-[#3E2723] mt-1">Subtasks remaining</p>
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-gray-700" />
                        Active Projects & Performance
                    </h3>

                    {tasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {tasks.map(project => {
                                const stats = getProjectStats(project.subtasks);
                                const total = project.subtasks.length;
                                const completed = project.subtasks.filter(t => t.status === 'completed').length;
                                const percent = Math.round((completed / total) * 100);

                                return (
                                    <div 
                                        key={project.id}
                                        onClick={() => {
                                            setSelectedProject(project);
                                            setShowProjectModal(true);
                                        }}
                                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 hover:shadow-xl hover:border-[#D7CCC8] transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-[#3E2723] transition-colors">{project.title}</h4>
                                                <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-semibold rounded-lg ${
                                                    percent === 100 ? 'bg-green-100 text-green-700' : 
                                                    percent > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {percent}% Complete
                                                </span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#FAF7F2] group-hover:text-[#3E2723] transition-colors">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                        </div>

                                        {/* Pie Chart Section */}
                                        <div className="h-48 relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={stats}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={70}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {stats.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {/* Centered Total */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-2xl font-bold text-gray-900">{total}</span>
                                                <span className="text-xs text-gray-500 uppercase tracking-wide">Tasks</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2 justify-center flex-wrap">
                                            {stats.map((stat, i) => (
                                                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }}></div>
                                                    <span>{stat.name} ({stat.value})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No active projects assigned</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Project Details Modal */}
            {showProjectModal && selectedProject && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedProject.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">Detailed task breakdown</p>
                            </div>
                            <button 
                                onClick={() => setShowProjectModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="space-y-3">
                                {selectedProject.subtasks.map(task => (
                                    <div key={task._id} className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-[#D7CCC8] hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-semibold text-gray-900 group-hover:text-[#3E2723] transition-colors">{task.title}</h5>
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wide
                                                ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                  task.status === 'blocked' ? 'bg-red-100 text-red-700' : 
                                                  'bg-blue-100 text-blue-700'}`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{task.description || 'No description provided'}</p>
                                        
                                        <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
                                            {task.deadline && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(task.deadline).toLocaleDateString()}
                                                </div>
                                            )}
                                            {task.estimatedEffort && (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {task.estimatedEffort}h
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

// Simple X icon for modal since I forgot to import it from lucide-react in main import
// Actually I imported it but let's ensure it works or just use generic close logic
const X = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default MemberProfile;
