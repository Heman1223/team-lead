import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Eye, Edit, Archive, Power, PowerOff, Trash2, UserPlus, UserMinus, RefreshCw, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { adminTeamsAPI, adminUsersAPI } from '../services/adminApi';
import api from '../services/api';
import Layout from '../components/Layout';

const EnhancedAdminTeamManagement = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterHealth, setFilterHealth] = useState('all');
    
    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
    const [showChangeLeadModal, setShowChangeLeadModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [archiveReason, setArchiveReason] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        objective: '',
        leadId: '',
        status: 'active',
        priority: 'medium',
        taskType: 'project_based',
        department: '',
        coreField: '',
        currentProject: '',
        memberIds: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teams