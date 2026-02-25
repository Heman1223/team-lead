import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  UserPlus,
  X,
  Search,
  Eye,
  Target,
  Briefcase,
  TrendingUp,
  Award,
  MoreVertical,
  Trash2,
  Edit,
  RefreshCw,
  Activity,
  Filter,
  FileText,
  User,
  Check,
  Bell,
  Shield,
} from "lucide-react";
import {
  adminTeamsAPI,
  adminUsersAPI,
  adminTasksAPI,
} from "../services/adminApi";
import Layout from "../components/Layout";

const AdminTeamManagement = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamTaskStats, setTeamTaskStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    objective: "",
    leadId: "",
    department: "",
    otherDepartment: "",
    coreField: "",
    otherCoreField: "",
    memberIds: [],
    currentProject: "",
    projectProgress: 0,
  });

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, usersRes, tasksRes] = await Promise.all([
        adminTeamsAPI.getAll(),
        adminUsersAPI.getAll(),
        adminTasksAPI.getAll(),
      ]);

      const teamsData = teamsRes.data.data || [];
      const tasksData = tasksRes.data.data || [];

      setTeams(teamsData);
      setUsers(usersRes.data.data || []);
      setTeamLeads(
        usersRes.data.data.filter((u) => u.role === "team_lead") || [],
      );
      setTasks(tasksData);

      // Calculate task statistics for each team
      const statsMap = {};
      teamsData.forEach((team) => {
        const teamTasks = tasksData.filter(
          (task) => task.teamId?._id === team._id || task.teamId === team._id,
        );

        const completedTasks = teamTasks.filter(
          (t) => t.status === "completed",
        );
        const activeTasks = teamTasks.filter(
          (t) => t.status !== "completed" && t.status !== "cancelled",
        );
        const overdueTasks = teamTasks.filter(
          (t) =>
            t.status !== "completed" &&
            t.status !== "cancelled" &&
            new Date(t.deadline || t.dueDate) < new Date(),
        );

        // Calculate team progress from subtask completion data
        // Formula: per-task progress = (completed subtasks / total subtasks) × 100
        // Overall = average of all task progress values
        // Fallback: use manual projectProgress if no tasks exist
        let calculatedProgress = team.projectProgress || 0;

        if (teamTasks.length > 0) {
          const totalProgress = teamTasks.reduce((sum, task) => {
            const subtasks = task.subtasks || [];
            if (subtasks.length > 0) {
              const completedSubs = subtasks.filter(st => st.status === 'completed').length;
              return sum + Math.round((completedSubs / subtasks.length) * 100);
            } else {
              // No subtasks — use task's own status
              const taskProg = task.status === 'completed' ? 100 : 
                               task.status === 'in_progress' ? (task.progressPercentage || 0) : 0;
              return sum + taskProg;
            }
          }, 0);
          calculatedProgress = Math.round(totalProgress / teamTasks.length);
        }

        statsMap[team._id] = {
          total: teamTasks.length,
          active: activeTasks.length,
          completed: completedTasks.length,
          overdue: overdueTasks.length,
          calculatedProgress: calculatedProgress,
        };
      });

      setTeamTaskStats(statsMap);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setFormData({
      name: "",
      description: "",
      objective: "",
      leadId: "",
      department: "",
      otherDepartment: "",
      coreField: "",
      otherCoreField: "",
      currentProject: "",
      projectProgress: 0,
      status: "active",
      priority: "medium",
      taskType: "project_based",
      memberIds: [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedLead = users.find((u) => u._id === formData.leadId);
      const teamData = {
        ...formData,
        department:
          formData.department === "Other"
            ? formData.otherDepartment
            : formData.department,
        coreField:
          formData.coreField === "Other"
            ? formData.otherCoreField
            : formData.coreField || selectedLead?.coreField,
        currentProject: formData.currentProject,
        projectProgress: formData.projectProgress,
      };
      await adminTeamsAPI.create(teamData);
      setShowModal(false);
      fetchData();
      alert("✅ Team created successfully!");
    } catch (error) {
      console.error("Error creating team:", error);
      alert(error.response?.data?.message || "Failed to create team");
    }
  };

  const handleAddMembers = (team) => {
    setSelectedTeam(team);
    setFormData({ ...formData, memberIds: [] });
    setShowMemberModal(true);
  };

  const handleViewDetails = (team) => {
    navigate(`/admin/team/${team._id}`);
  };

  const handleEditTeam = (team) => {
    const departments = [
      "Engineering",
      "Design",
      "Marketing",
      "Sales",
      "HR",
      "IT Support",
    ];
    const coreFields = [
      "Web Development",
      "Mobile App Development",
      "UI/UX Design",
      "Digital Marketing",
      "Data Analytics",
    ];

    const isOtherDept =
      team.department && !departments.includes(team.department);
    const isOtherCore = team.coreField && !coreFields.includes(team.coreField);

    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      objective: team.objective || "",
      leadId: team.leadId?._id || team.leadId || "",
      department: isOtherDept ? "Other" : team.department || "",
      otherDepartment: isOtherDept ? team.department : "",
      coreField: isOtherCore ? "Other" : team.coreField || "",
      otherCoreField: isOtherCore ? team.coreField : "",
      memberIds: (team.members || []).map(
        (m) => m.userId?._id || m.userId || m._id,
      ),
      currentProject: team.currentProject || "",
      projectProgress: team.projectProgress || 0,
    });
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      await adminTeamsAPI.update(selectedTeam._id, {
        name: formData.name,
        description: formData.description,
        objective: formData.objective,
        leadId: formData.leadId,
        department:
          formData.department === "Other"
            ? formData.otherDepartment
            : formData.department,
        coreField:
          formData.coreField === "Other"
            ? formData.otherCoreField
            : formData.coreField,
        memberIds: formData.memberIds,
        currentProject: formData.currentProject,
        projectProgress: formData.projectProgress,
      });
      setShowEditModal(false);
      fetchData();
      alert("✅ Team updated successfully!");
    } catch (error) {
      console.error("Error updating team:", error);
      alert(error.response?.data?.message || "Failed to update team");
    }
  };

  const handleAssignMembers = async (e) => {
    e.preventDefault();
    try {
      await adminTeamsAPI.assignMembers(selectedTeam._id, formData.memberIds);
      setShowMemberModal(false);
      fetchData();
      alert("✅ Members assigned successfully!");
    } catch (error) {
      console.error("Error assigning members:", error);
      alert(error.response?.data?.message || "Failed to assign members");
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (
      window.confirm(
        `⚠️ Delete team "${teamName}"? All members will be unassigned.`,
      )
    ) {
      try {
        await adminTeamsAPI.delete(teamId);
        alert("✅ Team deleted successfully!");
        fetchData();
        setOpenMenuId(null);
      } catch (error) {
        console.error("Error deleting team:", error);
        alert("Failed to delete team");
      }
    }
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.coreField?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.leadId?.coreField?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      filterDepartment === "All" ||
      (filterDepartment === "Other" &&
        ![
          "Engineering",
          "Design",
          "Marketing",
          "Sales",
          "HR",
          "IT Support",
        ].includes(team.department)) ||
      team.department === filterDepartment;

    return matchesSearch && matchesDept;
  });

  const availableMembers = users.filter(
    (u) =>
      u.role === "team_member" &&
      (!selectedTeam || !selectedTeam.members.some((m) => m._id === u._id)),
  );

  const getProgressColor = (progress) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-amber-500";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-[#3E2723]";
  };

  if (loading) {
    return (
      <Layout title="Team Management">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3E2723] mx-auto"></div>
            <p className="mt-4 text-gray-700 font-semibold">Loading teams...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout title="Team Management">
        <div className="px-2 sm:px-4 lg:px-6 py-6 space-y-8 bg-[#FAF9F8]">
          {/* KPI DASHLETS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI: TOTAL TEAMS */}
            <div className="bg-[#F3EFE7] rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Total Teams
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-4xl font-black text-[#1D1110] tracking-tighter">
                      {teams.length}
                    </h3>
                    <span className="text-xs font-bold text-green-500 tracking-tighter">
                      +2%
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* KPI: TOTAL MEMBERS */}
            <div className="bg-[#F3EFE7] rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Total Members
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-4xl font-black text-[#1D1110] tracking-tighter">
                      {teams.reduce(
                        (sum, team) => sum + (team.members?.length || 0),
                        0,
                      )}
                    </h3>
                    <span className="text-xs font-bold text-green-500 tracking-tighter">
                      +5%
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* KPI: ACTIVE PROJECTS */}
            <div className="bg-[#F3EFE7] rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Active Projects
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-4xl font-black text-[#1D1110] tracking-tighter">
                      {teams.filter((t) => t.currentProject).length || 18}
                    </h3>
                    <span className="text-xs font-bold text-red-500 tracking-tighter">
                      -1%
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* KPI: AVG PROGRESS */}
            <div className="bg-[#F3EFE7] rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Avg. Progress
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-4xl font-black text-[#1D1110] tracking-tighter">
                      {teams.length > 0
                        ? Math.round(
                            Object.values(teamTaskStats).reduce(
                              (sum, s) => sum + (s.calculatedProgress || 0),
                              0,
                            ) / teams.length,
                          )
                        : 72}
                      %
                    </h3>
                    <span className="text-xs font-bold text-green-500 tracking-tighter">
                      +8%
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-[#1D1110] group-hover:text-white transition-all duration-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER ROW */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-2 flex items-center group focus-within:ring-2 focus-within:ring-[#1D1110]/10 transition-all">
              <div className="p-3">
                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#1D1110] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search teams, leads, or departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-[#1D1110] placeholder-gray-400 flex-1 px-2"
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="appearance-none flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all text-xs font-bold text-gray-500 uppercase tracking-[0.2em] outline-none pr-12 cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">Human Resources</option>
                  <option value="IT Support">IT Support</option>
                  <option value="Other">Other</option>
                </select>
                <Filter className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
              <button
                onClick={handleCreateTeam}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#3E2723] text-white rounded-xl hover:bg-[#5D4037] transition-all shadow-md hover:shadow-lg font-bold text-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Create Team
              </button>
            </div>
          </div>

          {/* TEAMS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredTeams.map((team) => (
              <div
                key={team._id}
                onClick={() => handleViewDetails(team)}
                className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer overflow-hidden transform hover:-translate-y-2"
              >
                <div className="p-8 space-y-6">
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between relative">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-[#1D1110] tracking-tight group-hover:underline decoration-2 underline-offset-4">
                        {team.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="text-gray-400">
                          {team.coreField?.toLowerCase().includes("design") ? (
                            <Target className="w-4 h-4" />
                          ) : (
                            <Activity className="w-4 h-4" />
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {team.department || team.coreField || "Division"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          team.status === "active" || team.currentProject
                            ? "bg-green-100 text-green-600"
                            : "bg-[#EFEBE9] text-[#3E2723]"
                        }`}
                      >
                        {team.status === "active" || team.currentProject
                          ? "Active"
                          : "On Bench"}
                      </span>

                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === team._id ? null : team._id,
                            )
                          }
                          className="p-2 text-gray-400 hover:text-[#1D1110] hover:bg-gray-100 rounded-full transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openMenuId === team._id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200"
                          >
                            <button
                              onClick={() => {
                                handleViewDetails(team);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-gray-400" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleEditTeam(team)}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <Edit className="w-4 h-4 text-gray-400" />
                              Edit Team
                            </button>
                            <div className="h-px bg-gray-100 my-1 mx-2"></div>
                            <button
                              onClick={() =>
                                handleDeleteTeam(team._id, team.name)
                              }
                              className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Team
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TEAM LEAD BLOCK */}
                  <div className="p-4 bg-gray-50 rounded-[1.5rem] flex items-center gap-4 border border-gray-100/50 group-hover:bg-gray-100/50 transition-colors">
                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center">
                      {team.leadId?.avatar ? (
                        <img
                          src={team.leadId.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shadow-inner">
                          <span className="text-sm font-black text-gray-400">
                            {getInitials(team.leadId?.name)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Team Lead
                      </p>
                      <p className="text-sm font-bold text-[#1D1110] truncate">
                        {team.leadId?.name || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  {/* MEMBERS AREA */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Team Members
                    </p>
                    <div className="flex -space-x-3">
                      {(team.members || []).slice(0, 4).map((member, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden flex items-center justify-center shadow-sm"
                        >
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-black text-gray-500">
                              {getInitials(member.name)}
                            </span>
                          )}
                        </div>
                      ))}
                      {team.members?.length > 4 && (
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-[#1D1110] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                          +{team.members.length - 4}
                        </div>
                      )}
                      {(!team.members || team.members.length === 0) && (
                        <p className="text-[10px] font-medium text-gray-400 italic py-2">
                          No members assigned
                        </p>
                      )}
                    </div>
                  </div>

                  {/* PROGRESS FOOTER */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-[#3E2723]" />
                        Project Progress
                      </p>
                      <span className="text-sm font-black text-[#1D1110]">
                        {teamTaskStats[team._id]?.calculatedProgress || 0}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5 shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getProgressColor(
                          teamTaskStats[team._id]?.calculatedProgress || 0,
                        )}`}
                        style={{
                          width: `${teamTaskStats[team._id]?.calculatedProgress || 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTeams.length === 0 && (
            <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-sm">
              <Users className="mx-auto h-20 w-20 text-gray-200 mb-6" />
              <h3 className="text-2xl font-black text-[#1D1110] mb-2">
                No Units Found
              </h3>
              <p className="text-gray-400 font-medium mb-8">
                Deploy your first team onto the grid to start monitoring.
              </p>
              <button
                onClick={handleCreateTeam}
                className="inline-flex items-center gap-3 px-10 py-4 bg-[#1D1110] text-white rounded-[1.5rem] hover:bg-black transition-all font-bold text-sm tracking-widest uppercase shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Initialize Team
              </button>
            </div>
          )}


      {/* Create Team Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm z-[9999]"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#3E2723] to-[#5D4037] px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-6 h-6" /> Create New Team
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3E2723]" />
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                  placeholder="Enter team name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#3E2723]" />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all min-h-[100px]"
                  placeholder="Team description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#3E2723]" />
                  Objective
                </label>
                <textarea
                  value={formData.objective}
                  onChange={(e) =>
                    setFormData({ ...formData, objective: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all min-h-[100px]"
                  placeholder="Team goals"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#3E2723]" />
                    Current Project
                  </label>
                  <input
                    type="text"
                    value={formData.currentProject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentProject: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#3E2723]" />
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.projectProgress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectProgress: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#3E2723]" />
                    Team Lead <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.leadId}
                    onChange={(e) =>
                      setFormData({ ...formData, leadId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                    required
                  >
                    <option value="">Select Team Lead</option>
                    {teamLeads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#3E2723]" />
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">Human Resources</option>
                      <option value="IT Support">IT Support</option>
                      <option value="Other">Other</option>
                    </select>
                    {formData.department === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={formData.otherDepartment}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              otherDepartment: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                          placeholder="Enter department name"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#3E2723]" />
                      Core Area <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.coreField}
                      onChange={(e) =>
                        setFormData({ ...formData, coreField: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                      required
                    >
                      <option value="">Select Area</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile App Development">Mobile Apps</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                      <option value="Digital Marketing">Marketing</option>
                      <option value="Data Analytics">Data Analytics</option>
                      <option value="Other">Other</option>
                    </select>
                    {formData.coreField === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={formData.otherCoreField}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              otherCoreField: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                          placeholder="Enter core area"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3E2723]" />
                  Strategic Roster
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
                  {users
                    .filter((u) => u.role === "team_member")
                    .map((member) => (
                      <label
                        key={member._id}
                        className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={formData.memberIds.includes(member._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                memberIds: [...formData.memberIds, member._id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                memberIds: formData.memberIds.filter(
                                  (id) => id !== member._id,
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-[#3E2723] rounded focus:ring-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {member.email}
                          </p>
                        </div>
                      </label>
                    ))}
                </div>
                <div className="mt-2 flex justify-between items-center px-1">
                  <p className="text-xs font-medium text-gray-500">
                    Selected: {formData.memberIds.length} members
                  </p>
                  {formData.memberIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, memberIds: [] })
                      }
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#3E2723] text-white font-semibold rounded-xl hover:bg-[#5D4037] transition-all shadow-lg hover:shadow-xl"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showMemberModal && selectedTeam && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm z-[9999]"
          onClick={(e) =>
            e.target === e.currentTarget && setShowMemberModal(false)
          }
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#3E2723] to-[#5D4037] px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-6 h-6" /> Add Members
                </h3>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleAssignMembers}
              className="p-8 space-y-6 bg-[#FDFBF9]"
            >
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <Users className="w-4 h-4 text-[#3E2723]" />
                  Select Members
                </label>
                <div className="space-y-3 max-h-80 overflow-y-auto border-2 border-[#D7CCC8]/30 rounded-[1.5rem] p-4 bg-white shadow-inner">
                  {availableMembers.length === 0 ? (
                    <div className="py-12 text-center">
                      <Users className="w-12 h-12 text-[#D7CCC8] mx-auto mb-3 opacity-20" />
                      <p className="text-[#3E2723]/40 font-black uppercase tracking-widest text-[10px]">
                        No members available
                      </p>
                    </div>
                  ) : (
                    availableMembers.map((member) => (
                      <label
                        key={member._id}
                        className="group/item flex items-center gap-4 p-4 hover:bg-[#FDFBF9] rounded-2xl cursor-pointer transition-all border border-transparent hover:border-[#D7CCC8]/40"
                      >
                        <input
                          type="checkbox"
                          checked={formData.memberIds.includes(member._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                memberIds: [...formData.memberIds, member._id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                memberIds: formData.memberIds.filter(
                                  (id) => id !== member._id,
                                ),
                              });
                            }
                          }}
                          className="w-6 h-6 text-[#3E2723] rounded-lg border-2 border-[#D7CCC8] focus:ring-0 cursor-pointer checked:bg-[#3E2723]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-sm tracking-tight group-hover/item:text-[#3E2723] transition-colors">
                            {member.name.toUpperCase()}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 tracking-wider">
                            {member.email}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#3E2723] text-white font-semibold rounded-xl hover:bg-[#5D4037] transition-all shadow-lg hover:shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm z-[9999]"
          onClick={(e) =>
            e.target === e.currentTarget && setShowEditModal(false)
          }
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#3E2723] to-[#5D4037] px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit className="w-6 h-6" /> Edit Team
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmitEdit}
              className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3E2723]" />
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                  placeholder="Enter team name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#3E2723]" />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all min-h-[100px]"
                  placeholder="Team description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#3E2723]" />
                  Objective
                </label>
                <textarea
                  value={formData.objective}
                  onChange={(e) =>
                    setFormData({ ...formData, objective: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all min-h-[100px]"
                  placeholder="Team goals"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#3E2723]" />
                    Current Project
                  </label>
                  <input
                    type="text"
                    value={formData.currentProject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentProject: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#3E2723]" />
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.projectProgress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectProgress: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#3E2723]" />
                    Team Lead <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.leadId}
                    onChange={(e) =>
                      setFormData({ ...formData, leadId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                    required
                  >
                    <option value="">Select Team Lead</option>
                    {teamLeads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#3E2723]" />
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">Human Resources</option>
                      <option value="IT Support">IT Support</option>
                      <option value="Other">Other</option>
                    </select>
                    {formData.department === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={formData.otherDepartment}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              otherDepartment: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                          placeholder="Enter department name"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#3E2723]" />
                      Core Area <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.coreField}
                      onChange={(e) =>
                        setFormData({ ...formData, coreField: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                      required
                    >
                      <option value="">Select Area</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile App Development">Mobile Apps</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                      <option value="Digital Marketing">Marketing</option>
                      <option value="Data Analytics">Data Analytics</option>
                      <option value="Other">Other</option>
                    </select>
                    {formData.coreField === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={formData.otherCoreField}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              otherCoreField: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] outline-none transition-all"
                          placeholder="Enter core area"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3E2723]" />
                  Members
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
                  {users
                    .filter((u) => u.role === "team_member")
                    .map((member) => (
                      <label
                        key={member._id}
                        className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={formData.memberIds.includes(member._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                memberIds: [...formData.memberIds, member._id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                memberIds: formData.memberIds.filter(
                                  (id) => id !== member._id,
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-[#3E2723] rounded focus:ring-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {member.email}
                          </p>
                        </div>
                      </label>
                    ))}
                </div>
                <div className="mt-2 flex justify-between items-center px-1">
                  <p className="text-xs font-medium text-gray-500">
                    Selected: {formData.memberIds.length} members
                  </p>
                  {formData.memberIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, memberIds: [] })
                      }
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#3E2723] text-white font-semibold rounded-xl hover:bg-[#5D4037] transition-all shadow-lg hover:shadow-xl"
                >
                  Update Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </Layout>
    </>
  );
};

export default AdminTeamManagement;
