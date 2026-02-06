import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, FileText, Send, Calendar, TrendingUp, BarChart } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../services/api';

const MySubtasks = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [selectedSubtask, setSelectedSubtask] = useState(null);
    const [showEODModal, setShowEODModal] = useState(false);
    const [eodFormData, setEodFormData] = useState({
        workCompleted: '',
        hoursSpent: '',
        progressUpdate: '',
        blockers: '',
        nextDayPlan: ''
    });

    useEffect(() => {
        fetchMySubtasks();
    }, []);

    const fetchMySubtasks = async () => {
        try {
            setLoading(true);
            const response = await tasksAPI.getMyTasks();
            const allTasks = response.data.data || [];
            
            // Filter tasks that have subtasks assigned to current user OR user is main assignee
            const tasksWithMySubtasks = allTasks.map(task => {
                const mySubtasks = task.subtasks?.filter(
                    st => {
                        const assigneeId = st.assignedTo?._id || st.assignedTo;
                        return String(assigneeId) === String(user._id);
                    }
                ) || [];
                
                // Check if user is the main assignee of the parent task
                const isMainAssignee = String(task.assignedTo?._id || task.assignedTo) === String(user._id);
                
                return {
                    ...task,
                    mySubtasks,
                    isMainAssignee
                };
            }).filter(task => task.mySubtasks.length > 0 || task.isMainAssignee);

            setTasks(tasksWithMySubtasks);
        } catch (error) {
            console.error('Error fetching subtasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitEOD = async (e) => {
        e.preventDefault();
        
        if (!eodFormData.workCompleted.trim()) {
            alert('Please describe the work completed');
            return;
        }

        try {
            await tasksAPI.submitEODReport(
                selectedSubtask.parentTaskId,
                selectedSubtask._id,
                {
                    ...eodFormData,
                    hoursSpent: parseFloat(eodFormData.hoursSpent) || 0,
                    progressUpdate: parseInt(eodFormData.progressUpdate) || selectedSubtask.progressPercentage || 0
                }
            );

            alert('✅ EOD report submitted successfully!');
            setShowEODModal(false);
            setSelectedSubtask(null);
            setEodFormData({
                workCompleted: '',
                hoursSpent: '',
                progressUpdate: '',
                blockers: '',
                nextDayPlan: ''
            });
            fetchMySubtasks();
        } catch (error) {
            console.error('Error submitting EOD:', error);
            alert('❌ Failed to submit EOD report');
        }
    };

    const openEODModal = (subtask, parentTaskId) => {
        setSelectedSubtask({ ...subtask, parentTaskId });
        setEodFormData({
            workCompleted: '',
            hoursSpent: '',
            progressUpdate: subtask.progressPercentage?.toString() || '0',
            blockers: '',
            nextDayPlan: ''
        });
        setShowEODModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) {
        return (
            <Layout title="My Subtasks">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-700 font-semibold">Loading your subtasks...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <>
            <Layout title="My Subtasks">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                        <h2 className="text-2xl font-bold mb-2">My Subtasks 📋</h2>
                        <p className="text-orange-100">
                            Track your assigned subtasks and submit daily progress reports
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600">Total Subtasks</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        {tasks.reduce((sum, task) => sum + task.mySubtasks.length, 0)}
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-100 rounded-xl">
                                    <FileText className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600">In Progress</p>
                                    <p className="text-3xl font-bold text-blue-600 mt-2">
                                        {tasks.reduce((sum, task) => 
                                            sum + task.mySubtasks.filter(st => st.status === 'in_progress').length, 0
                                        )}
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-100 rounded-xl">
                                    <Clock className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600">Completed</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">
                                        {tasks.reduce((sum, task) => 
                                            sum + task.mySubtasks.filter(st => st.status === 'completed').length, 0
                                        )}
                                    </p>
                                </div>
                                <div className="p-4 bg-green-100 rounded-xl">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600">Blocked</p>
                                    <p className="text-3xl font-bold text-red-600 mt-2">
                                        {tasks.reduce((sum, task) => 
                                            sum + task.mySubtasks.filter(st => st.status === 'blocked').length, 0
                                        )}
                                    </p>
                                </div>
                                <div className="p-4 bg-red-100 rounded-xl">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subtasks List */}
                    {tasks.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Subtasks Assigned</h3>
                            <p className="text-gray-600">You don't have any subtasks assigned yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {tasks.map(task => (
                                <div key={task._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{task.title}</h3>
                                        <p className="text-sm text-gray-600">Parent Task</p>
                                    </div>

                                    <div className="space-y-3">
                                        {task.mySubtasks.map(subtask => (
                                            <div key={subtask._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 mb-1">{subtask.title}</h4>
                                                        {subtask.description && (
                                                            <p className="text-sm text-gray-600">{subtask.description}</p>
                                                        )}
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(subtask.status)}`}>
                                                        {subtask.status?.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-gray-600 font-medium">Progress</span>
                                                        <span className="font-bold text-gray-900">{subtask.progressPercentage || 0}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-orange-500 h-2 rounded-full transition-all"
                                                            style={{ width: `${subtask.progressPercentage || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* EOD Reports Count */}
                                                {subtask.eodReports && subtask.eodReports.length > 0 && (
                                                    <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                                                        <BarChart className="w-4 h-4" />
                                                        <span>{subtask.eodReports.length} EOD report(s) submitted</span>
                                                    </div>
                                                )}

                                                {/* Action Button */}
                                                {subtask.status !== 'completed' && (
                                                    <button
                                                        onClick={() => openEODModal(subtask, task._id)}
                                                        className="w-full mt-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                        Submit EOD Report
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Layout>

            {/* EOD Report Modal */}
            {showEODModal && selectedSubtask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-6 h-6" />
                                Submit EOD Report
                            </h3>
                            <p className="text-orange-100 text-sm mt-1">{selectedSubtask.title}</p>
                        </div>

                        <form onSubmit={handleSubmitEOD} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Work Completed Today <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={eodFormData.workCompleted}
                                    onChange={(e) => setEodFormData({ ...eodFormData, workCompleted: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Describe what you accomplished today..."
                                    rows="4"
                                    required
                                    maxLength="2000"
                                />
                                <p className="text-xs text-gray-500 mt-1">{eodFormData.workCompleted.length}/2000 characters</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Hours Spent
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="24"
                                        value={eodFormData.hoursSpent}
                                        onChange={(e) => setEodFormData({ ...eodFormData, hoursSpent: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="e.g., 8"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Progress Update (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={eodFormData.progressUpdate}
                                        onChange={(e) => setEodFormData({ ...eodFormData, progressUpdate: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="e.g., 75"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Blockers / Issues (if any)
                                </label>
                                <textarea
                                    value={eodFormData.blockers}
                                    onChange={(e) => setEodFormData({ ...eodFormData, blockers: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Any blockers or issues you're facing..."
                                    rows="3"
                                    maxLength="1000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Plan for Tomorrow
                                </label>
                                <textarea
                                    value={eodFormData.nextDayPlan}
                                    onChange={(e) => setEodFormData({ ...eodFormData, nextDayPlan: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="What do you plan to work on tomorrow..."
                                    rows="3"
                                    maxLength="1000"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowEODModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default MySubtasks;
