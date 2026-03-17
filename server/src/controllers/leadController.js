const Lead = require('../models/Lead');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const FollowUp = require('../models/FollowUp');
// Email notifications handled by emailService (only sendMeetingInvitation implemented)
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// @desc    Get all leads (with role-based filtering)
// @route   GET /api/leads
// @access  Private
getLeads = async (req, res) => {
    try {
        // Initialize empty query for hard delete (no soft delete filtering needed)
        let query = {};

        // Query Parameters filtering
        const { status, search } = req.query;
        if (status && status !== 'all') {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { clientName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Role-based filtering
        if (req.user.role === 'team_lead') {
            // Team leads see leads assigned to them personally, their team, or created by them
            const team = await Team.findOne({ leadId: req.user._id });
            const teamFilter = team ? { assignedTeam: team._id } : {};
            const roleFilter = [
                { assignedTo: req.user._id },
                teamFilter,
                { createdBy: req.user._id }
            ].filter(f => Object.keys(f).length > 0);

            if (query.$or) {
                // If search is present, merge with role-based restriction
                query = {
                    $and: [
                        { $or: query.$or },
                        { $or: roleFilter }
                    ]
                };
            } else {
                if (Object.keys(query).length > 0) {
                    query = {
                        $and: [
                            query, // Existing status filter
                            { $or: roleFilter } // Role-based filter
                        ]
                    };
                } else {
                    query.$or = roleFilter;
                }
            }
        } else if (req.user.role === 'team_member') {
            // Employees see leads assigned to them personally, their team, or created by them
            const teams = await Team.find({ members: req.user._id });
            const teamIds = teams.map(t => t._id);
            const memberFilter = { 
                $or: [
                    { assignedTo: req.user._id }, 
                    { assignedTeam: { $in: teamIds } },
                    { createdBy: req.user._id }
                ] 
            };

            if (query.$or) {
                query = {
                    $and: [
                        { $or: query.$or },
                        memberFilter
                    ]
                };
            } else {
                // If there's an existing query (e.g., status), combine with $and
                if (Object.keys(query).length > 0) {
                    query = {
                        $and: [
                            query, // Existing status filter
                            memberFilter
                        ]
                    };
                } else {
                    // No existing filter, just add member filter
                    Object.assign(query, memberFilter);
                }
            }
        }
        // Admins see all leads

        const leads = await Lead.find(query)
            .populate('assignedTo', 'name email')
            .populate('assignedTeam', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: leads.length,
            data: leads
        });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// @desc    Get lead details
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = async (req, res) => {
    try {
        console.log('=== GET LEAD BY ID ===');
        console.log('Lead ID:', req.params.id);
        console.log('User ID:', req.user._id);
        console.log('User Role:', req.user.role);
        
        const lead = await Lead.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('assignedTeam', 'name')
            .populate('createdBy', 'name email')
            .populate('lastUpdatedBy', 'name email');

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        console.log('Lead found:', {
            id: lead._id,
            clientName: lead.clientName,
            assignedTo: lead.assignedTo,
            createdBy: lead.createdBy,
            assignedTeam: lead.assignedTeam
        });

        // Check permissions - Admins can see all
        if (req.user.role !== 'admin') {
            let hasAccess = false;

            if (req.user.role === 'team_lead') {
                // Team leaders can see leads they created, leads assigned to them personally, or leads assigned to their team
                const isCreatedBy = lead.createdBy?._id?.toString() === req.user._id.toString();
                const isAssignedTo = lead.assignedTo?._id?.toString() === req.user._id.toString();
                
                if (isCreatedBy || isAssignedTo) {
                    hasAccess = true;
                    console.log('Access granted: Lead created by or assigned to team lead');
                } else {
                    const team = await Team.findOne({ leadId: req.user._id });
                    if (team && lead.assignedTeam?._id?.toString() === team._id.toString()) {
                        hasAccess = true;
                        console.log('Access granted: Lead assigned to team lead\'s team');
                    }
                }
            } else if (req.user.role === 'team_member') {
                // Team members can see leads assigned to them personally, their team, or created by them
                const isAssignedTo = lead.assignedTo?._id?.toString() === req.user._id.toString();
                const isCreatedBy = lead.createdBy?._id?.toString() === req.user._id.toString();
                
                if (isAssignedTo || isCreatedBy) {
                    hasAccess = true;
                    console.log('Access granted: Lead assigned to or created by member');
                } else {
                    const teams = await Team.find({ members: req.user._id });
                    const teamIds = teams.map(t => t._id.toString());
                    if (lead.assignedTeam && teamIds.includes(lead.assignedTeam._id.toString())) {
                        hasAccess = true;
                        console.log('Access granted: Lead assigned to member\'s team');
                    }
                }
            }

            if (!hasAccess) {
                console.log('Lead access denied:', {
                    userId: req.user._id,
                    userRole: req.user.role,
                    leadId: lead._id,
                    assignedTo: lead.assignedTo,
                    createdBy: lead.createdBy,
                    assignedTeam: lead.assignedTeam
                });
                return res.status(403).json({ success: false, message: 'Not authorized to view this lead' });
            }
        } else {
            console.log('Access granted: User is admin');
        }

        // Get activity logs for this lead
        const activities = await ActivityLog.find({ leadId: lead._id })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                lead,
                activities
            }
        });
    } catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create lead
// @route   POST /api/leads
// @access  Private (Admin, Team Lead only)
const createLead = async (req, res) => {
    try {
        // Only admins, team leaders, and team members can create leads
        // (Removing the restriction on team_member)

        const leadData = {
            ...req.body,
            createdBy: req.user._id,
            source: req.body.source || 'manual'
        };

        const lead = await Lead.create(leadData);

        // Log activity
        await ActivityLog.create({
            action: 'lead_created',
            userId: req.user._id,
            leadId: lead._id,
            details: `Lead created for ${lead.clientName}`
        });

        res.status(201).json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
    try {
        let lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // Check archived status
        if (lead.status === 'archived' && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Archived leads are read-only' });
        }

        // Check permissions
        const canAccess = await checkLeadPermission(lead, req.user);
        if (!canAccess && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this lead' });
        }

        const oldStatus = lead.status;
        const newStatus = req.body.status;
        const statusNote = req.body.statusNote; // New: accept note with status change

        // Handle not interested reason
        if (newStatus === 'not_interested' && !req.body.notInterestedReason) {
            return res.status(400).json({ success: false, message: 'Not Interested leads require a reason' });
        }

        // Logic for dial tracking
        let updateData = { ...req.body, lastUpdatedBy: req.user._id };
        if (newStatus === 'dialed') {
            updateData.$inc = { dialCount: 1 };
            updateData.lastDialedAt = new Date();
        }

        lead = await Lead.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        // Log status change activity
        // For 'dialed' status, we allow logging even if the status hasn't changed (Dial Again)
        if (newStatus && (newStatus !== oldStatus || newStatus === 'dialed')) {
            const statusChangeDetails = newStatus === 'dialed' 
                ? `Lead dialed (Total: ${lead.dialCount})${statusNote ? ' Note: ' + statusNote : ''}`
                : `Status changed from ${oldStatus} to ${newStatus}${newStatus === 'not_interested' ? ' Reason: ' + req.body.notInterestedReason : ''}${statusNote ? ' Note: ' + statusNote : ''}`;

            await ActivityLog.create({
                action: 'lead_status_changed',
                userId: req.user._id,
                leadId: lead._id,
                details: statusChangeDetails,
                metadata: { 
                    oldStatus, 
                    newStatus,
                    dialCount: lead.dialCount
                }
            });

            // Add note to lead if provided
            if (statusNote && statusNote.trim()) {
                const leadDoc = await Lead.findById(lead._id);
                leadDoc.addNote(statusNote, req.user._id, newStatus === 'dialed' ? 'call_done' : 'status_changed');
                await leadDoc.save();
            }
        } else {
            // General update log
            await ActivityLog.create({
                action: 'lead_updated',
                userId: req.user._id,
                leadId: lead._id,
                details: `Lead updated for ${lead.clientName}`
            });
        }

        res.json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Add a note to a lead without changing status
// @route   POST /api/leads/:id/notes
// @access  Private
const addNote = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // Check permissions
        const canAccess = await checkLeadPermission(lead, req.user);
        if (!canAccess && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { note, content } = req.body;
        const noteContent = note || content;

        if (!noteContent || !noteContent.trim()) {
            return res.status(400).json({ success: false, message: 'Note content is required' });
        }

        // Add note to lead using schema method
        lead.addNote(noteContent, req.user._id, 'note');
        await lead.save();

        // Create activity log (non-fatal)
        try {
            await ActivityLog.create({
                action: 'note_added',
                userId: req.user._id,
                leadId: lead._id,
                details: noteContent.substring(0, 500)
            });
        } catch (logErr) {
            console.error('ActivityLog create failed for addNote:', logErr);
            // don't block the main operation if logging fails
        }

        res.json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Add note error:', error);
        console.error(error.stack);
        // If Mongoose validation error, return details to help debugging
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join('; ');
            return res.status(400).json({ success: false, message: messages, error: error.message });
        }
        res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
    }
};

// @desc    Assign lead
// @route   PUT /api/leads/:id/assign
// @access  Private (Admin, Team Lead)
const assignLead = async (req, res) => {
    try {
        const { assignedTo, assignedTeam } = req.body;
        let lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // Role-based restrictions
        if (req.user.role === 'team_member') {
            return res.status(403).json({ success: false, message: 'Employees cannot reassign leads' });
        }

        if (req.user.role === 'team_lead') {
            // Team leaders can assign their own leads or leads assigned to their team
            const team = await Team.findOne({ leadId: req.user._id });

            // Check if team leader has access to this lead
            const hasAccess = lead.createdBy?.toString() === req.user._id.toString() ||
                (team && lead.assignedTeam?.toString() === team._id.toString());

            if (!hasAccess) {
                return res.status(403).json({ success: false, message: 'Not authorized to assign this lead' });
            }

            // If assigning to an employee, ensure they are in the team
            if (assignedTo && team) {
                const isMember = team.members.some(m => m.toString() === assignedTo.toString());
                if (!isMember) {
                    return res.status(400).json({ success: false, message: 'User is not a member of your team' });
                }
            }
        }

        lead.assignedTo = assignedTo || null;
        lead.assignedTeam = assignedTeam || null;
        lead.assignedBy = req.user._id;
        lead.assignedAt = new Date();
        await lead.save();

        // Log activity
        await ActivityLog.create({
            action: 'lead_assigned',
            userId: req.user._id,
            leadId: lead._id,
            details: `Lead assigned to ${assignedTo ? 'User' : 'None'} and ${assignedTeam ? 'Team' : 'None'}`,
            metadata: { assignedTo, assignedTeam }
        });

        res.json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Assign lead error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Convert lead to Project (Task)
// @route   POST /api/leads/:id/convert
// @access  Private (Admin, Team Lead)
const convertToProject = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

        if (lead.status !== 'won') {
            return res.status(400).json({ success: false, message: 'Only "Won" leads can be converted to projects' });
        }

        // Create a Task as a project
        const project = await Task.create({
            title: `Project: ${lead.clientName} - ${lead.category}`,
            description: lead.description,
            priority: lead.priority === 'urgent' ? 'critical' : lead.priority,
            assignedTo: lead.assignedTo || req.user._id,
            assignedBy: req.user._id,
            teamId: lead.assignedTeam,
            dueDate: lead.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
            deadline: lead.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'pending',
            isParentTask: true,
            relatedLead: lead._id // Pass lead link correctly
        });

        // Update lead
        lead.status = 'archived'; // Archive after conversion
        await lead.save();

        // Log activity
        await ActivityLog.create({
            action: 'lead_converted',
            userId: req.user._id,
            leadId: lead._id,
            taskId: project._id,
            details: `Lead converted to project: ${project.title}`
        });

        res.json({
            success: true,
            message: 'Lead converted to project successfully',
            data: project
        });
    } catch (error) {
        console.error('Convert lead error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Preview leads from CSV/Excel (Raw data for mapping)
// @route   POST /api/leads/preview
// @access  Private (Admin, Team Lead, Team Member)
const previewLeads = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a CSV or Excel file' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    try {
        let rawData = [];

        // Parse File based on extension
        if (ext === '.csv') {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    processRawData(results, filePath, res);
                })
                .on('error', (err) => {
                    throw err;
                });
            return; // processRawData will handle response
        } else if (ext === '.xlsx' || ext === '.xls') {
            const XLSX = require('xlsx');
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            processRawData(rawData, filePath, res);
        } else {
            throw new Error('Unsupported file format');
        }

    } catch (err) {
        console.error('Error in previewLeads:', err);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ success: false, message: 'Error processing file' });
    }
};

const processRawData = (data, filePath, res) => {
    if (!data || data.length === 0) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(400).json({ success: false, message: 'File is empty' });
    }

    // Extract headers from the first row keys
    const headers = Object.keys(data[0]);

    // Send back raw data for frontend mapping
    // Limit to first 10 rows for preview to save bandwidth, but send total count
    res.json({
        success: true,
        data: {
            headers: headers,
            sampleData: data.slice(0, 5),
            totalRows: data.length,
            // Check for potential duplicate count (users will map first, then we validate on import or client side)
            // Ideally we'd send all data or save temp file ID, but for now let's send all data if it's not huge
            // If huge, we might need a better strategy. For now assuming < 1000 rows usually.
            allData: data
        }
    });

    // Clean up file immediately as we sent data back
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// @desc    Confirm and import leads
// @route   POST /api/leads/import
// @access  Private (Admin, Team Lead, Team Member)
const importLeads = async (req, res) => {
    try {
        const { leads } = req.body;

        if (!leads || !Array.isArray(leads)) {
            return res.status(400).json({ success: false, message: 'No leads provided' });
        }

        const validLeads = leads.map(l => ({
            ...l,
            createdBy: req.user._id,
            status: 'new',
            source: 'imported'
        }));

        const imported = await Lead.insertMany(validLeads);

        // Log batch import
        await ActivityLog.create({
            action: 'lead_created',
            userId: req.user._id,
            details: `Imported ${imported.length} leads from CSV`
        });

        res.json({
            success: true,
            count: imported.length
        });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ success: false, message: 'Import failed', error: error.message });
    }
};

// @desc    Get comprehensive dashboard stats
// @route   GET /api/leads/stats
// @access  Private
const getLeadStats = async (req, res) => {
    try {
        console.log('=== GET LEAD STATS REQUEST ===');
        console.log('User:', req.user._id, req.user.role);

        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Role-based filtering
        if (req.user.role === 'team_lead') {
            const team = await Team.findOne({ leadId: req.user._id });
            const teamFilter = team ? { assignedTeam: team._id } : {};
            query = {
                $and: [
                    query,
                    { 
                        $or: [
                            { assignedTo: req.user._id },
                            teamFilter, 
                            { createdBy: req.user._id }
                        ].filter(f => Object.keys(f).length > 0) 
                    }
                ]
            };
        } else if (req.user.role === 'team_member') {
            const teams = await Team.find({ members: req.user._id });
            const teamIds = teams.map(t => t._id);
            query = {
                $and: [
                    query,
                    { 
                        $or: [
                            { assignedTo: req.user._id }, 
                            { assignedTeam: { $in: teamIds } },
                            { createdBy: req.user._id }
                        ] 
                    }
                ]
            };
        }

        console.log('Query:', JSON.stringify(query, null, 2));

        // fetch leads matching the original query (e.g. date‑range filtered) for some
        // calculations such as follow‑ups, high‑value, inactive etc.
        const leads = await Lead.find(query);
        console.log(`Found ${leads.length} leads for date-filtered query`);

        // We'll calculate overall stats ignoring the creation date filter, since conversion
        // and total counts should reflect all leads the user/team can see.
        // Need to deep‑copy and strip any createdAt that might be buried in $and clauses.
        const statsQuery = JSON.parse(JSON.stringify(query));
        const stripCreated = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if ('createdAt' in obj) delete obj.createdAt;
            Object.values(obj).forEach(v => {
                if (Array.isArray(v)) v.forEach(stripCreated);
                else stripCreated(v);
            });
        };
        stripCreated(statsQuery);

        // Get all leads matching statsQuery for counting purposes
        const allLeadsForStats = await Lead.find(statsQuery);
        console.log(`Found ${allLeadsForStats.length} leads for stats`);

        // Calculate stats
        const totalLeads = allLeadsForStats.length;
        const convertedLeads = allLeadsForStats.filter(l => l.status === 'converted').length;
        const lostLeads = allLeadsForStats.filter(l => l.status === 'not_interested').length;
        const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

        // Alerts & Specific Logic
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const followUpsToday = leads.filter(l =>
            l.followUpDate &&
            new Date(l.followUpDate) >= startOfDay &&
            new Date(l.followUpDate) <= endOfDay
        ).length;

        const highValueLeads = leads.filter(l => l.estimatedValue >= 10000).length;
        const inactiveLeads = leads.filter(l =>
            new Date(l.updatedAt) < sevenDaysAgo &&
            !['converted', 'lost'].includes(l.status)
        ).length;

        console.log('Stats calculated:', { totalLeads, convertedLeads, lostLeads, conversionRate });

        // Leads by status (use full stats set, not date-filtered subset)
        const statusDist = allLeadsForStats.reduce((acc, lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
        }, {});
        console.log('Status distribution:', statusDist);

        // Leads by source (also using stats set)
        const sourcesDist = allLeadsForStats.reduce((acc, lead) => {
            const source = lead.source || 'unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});
        console.log('Sources distribution:', sourcesDist);

        // Total pipeline value - Calculate across ALL active leads (not restricted by date)
        // because "Pipeline" usually represents the current living state of all active leads.
        const pipelineQuery = { ...query };
        delete pipelineQuery.createdAt;
        const allActiveLeads = await Lead.find(pipelineQuery);
        const totalPipelineValue = allActiveLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
        console.log('Total pipeline value (Global):', totalPipelineValue);

        // Average conversion time (only for converted leads)
        const convertedLeadsWithDuration = leads.filter(l => l.status === 'converted' && l.conversionDuration);
        const avgConversionTime = convertedLeadsWithDuration.length > 0
            ? (convertedLeadsWithDuration.reduce((sum, l) => sum + l.conversionDuration, 0) / convertedLeadsWithDuration.length).toFixed(1)
            : 0;

        // Employee performance (Admin and Team Lead only)
        let employeePerformance = [];
        if (req.user.role === 'admin' || req.user.role === 'team_lead') {
            const performanceQuery = req.user.role === 'team_lead' && query.$or
                ? { $or: query.$or }
                : {};

            const performance = await Lead.aggregate([
                { $match: { ...performanceQuery, assignedTo: { $ne: null } } },
                {
                    $group: {
                        _id: '$assignedTo',
                        totalLeads: { $sum: 1 },
                        convertedLeads: {
                            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
                        },
                        totalPipelineValue: { $sum: '$estimatedValue' }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 1,
                        name: '$user.name',
                        totalLeads: 1,
                        convertedLeads: 1,
                        totalPipelineValue: 1,
                        conversionRate: {
                            $cond: [
                                { $gt: ['$totalLeads', 0] },
                                { $multiply: [{ $divide: ['$convertedLeads', '$totalLeads'] }, 100] },
                                0
                            ]
                        }
                    }
                },
                { $sort: { conversionRate: -1 } }
            ]);

            employeePerformance = performance;
            console.log('Employee performance:', employeePerformance.length, 'employees');
        }

        const responseData = {
            totalLeads,
            wonLeads: convertedLeads,
            convertedLeads,
            lostLeads,
            followUpsToday,
            highValueLeads,
            inactiveLeads,
            conversionRate: parseFloat(conversionRate),
            statusDist,
            sourcesDist,
            totalPipelineValue,
            avgConversionTime: parseFloat(avgConversionTime),
            employeePerformance
        };

        console.log('=== SENDING RESPONSE ===');
        console.log(JSON.stringify(responseData, null, 2));

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('=== GET LEAD STATS ERROR ===');
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Soft delete lead (60-day recovery)
// @route   DELETE /api/leads/:id
// @access  Private (Admin only)
deleteLead = async (req, res) => {
    try {
        // Only admins can delete leads
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admins can delete leads' });
        }

        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // Hard delete - permanently remove from database
        await Lead.findByIdAndDelete(req.params.id);

        // Log activity
        await ActivityLog.create({
            action: 'lead_deleted',
            userId: req.user._id,
            leadId: lead._id,
            details: `Lead permanently deleted: ${lead.clientName}`
        });

        res.json({
            success: true,
            message: 'Lead permanently deleted successfully.'
        });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// @desc    Restore deleted lead
// @route   PUT /api/leads/:id/restore
// @access  Private (Admin only)
const restoreLead = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admins can restore leads' });
        }

        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        if (!lead.isDeleted) {
            return res.status(400).json({ success: false, message: 'Lead is not deleted' });
        }

        // Check if within 60-day recovery period
        const daysSinceDeleted = Math.ceil((new Date() - new Date(lead.deletedAt)) / (1000 * 60 * 60 * 24));
        if (daysSinceDeleted > 60) {
            return res.status(400).json({ success: false, message: 'Recovery period (60 days) has expired' });
        }

        // Restore using model method
        lead.restore();
        await lead.save();

        // Log activity
        await ActivityLog.create({
            action: 'lead_restored',
            userId: req.user._id,
            leadId: lead._id,
            details: `Lead restored: ${lead.clientName}`
        });

        res.json({
            success: true,
            message: 'Lead restored successfully',
            data: lead
        });
    } catch (error) {
        console.error('Restore lead error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Escalate lead to Admin
// @route   POST /api/leads/:id/escalate
// @access  Private (Team Lead only)
const escalateLead = async (req, res) => {
    try {
        // Only team leads can escalate
        if (req.user.role !== 'team_lead') {
            return res.status(403).json({ success: false, message: 'Only team leads can escalate leads' });
        }

        const { reason } = req.body;
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Escalation reason is required' });
        }

        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // Check if team lead has access to this lead
        const team = await Team.findOne({ leadId: req.user._id });
        if (!team || (lead.assignedTeam && lead.assignedTeam.toString() !== team._id.toString())) {
            return res.status(403).json({ success: false, message: 'Not authorized to escalate this lead' });
        }

        // Update lead escalation fields
        lead.escalatedToAdmin = true;
        lead.escalatedAt = new Date();
        lead.escalatedBy = req.user._id;
        lead.escalationReason = reason;
        lead.lastUpdatedBy = req.user._id;

        // Add note about escalation
        lead.addNote(`Lead escalated to Admin. Reason: ${reason}`, req.user._id, 'note');

        await lead.save();

        // Log activity
        await ActivityLog.create({
            action: 'lead_escalated',
            userId: req.user._id,
            leadId: lead._id,
            details: `Lead escalated to Admin. Reason: ${reason}`
        });

        // Create notification for all active admins
        const admins = await User.find({ role: 'admin', deletedAt: null });
        const Notification = require('../models/Notification');
        const notificationPromises = admins.map(admin =>
            Notification.create({
                userId: admin._id,
                type: 'lead_escalated',
                title: 'Lead Escalated',
                message: `${req.user.name} escalated a lead: ${lead.clientName}. Reason: ${reason}`,
                relatedTo: lead._id,
                relatedToModel: 'Lead',
                priority: 'high'
            })
        );
        await Promise.all(notificationPromises);

        res.json({
            success: true,
            message: 'Lead escalated to Admin successfully',
            data: lead
        });
    } catch (error) {
        console.error('Escalate lead error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get lead activities (role-based)
// @route   GET /api/leads/activities
// @access  Private
const getLeadActivities = async (req, res) => {
    try {
        let leadQuery = { isActive: true };

        // Role-based filtering for leads
        if (req.user.role === 'team_lead') {
            const team = await Team.findOne({ leadId: req.user._id });
            if (team) {
                leadQuery.$or = [
                    { assignedTeam: team._id },
                    { createdBy: req.user._id }
                ];
            } else {
                leadQuery.createdBy = req.user._id;
            }
        } else if (req.user.role === 'team_member') {
            // Team members see activities on leads assigned to them OR created by them
            leadQuery.$or = [
                { assignedTo: req.user._id },
                { createdBy: req.user._id }
            ];
        }
        // Admins see all (no extra filter)

        // Get all leads matching the query
        const leads = await Lead.find(leadQuery).select('_id');
        const leadIds = leads.map(l => l._id);

        // Get activities for these leads
        const activities = await ActivityLog.find({
            leadId: { $in: leadIds }
        })
            .populate('userId', 'name email role')
            .populate('leadId', 'clientName email status')
            .sort({ createdAt: -1 })
            .limit(200); // Limit to recent 200 activities

        res.json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        console.error('Get lead activities error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Private
const addLeadNote = async (req, res) => {
    try {
        const { content, type } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ success: false, message: 'Note content is required' });
        }

        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // Check permissions
        const canAccess = await checkLeadPermission(lead, req.user);
        if (!canAccess && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to add notes to this lead' });
        }

        // Add note using model method
        lead.addNote(content, req.user._id, type || 'note');
        await lead.save();

        // Log activity
        await ActivityLog.create({
            action: 'lead_note_added',
            userId: req.user._id,
            leadId: lead._id,
            details: `Note added: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
        });

        res.json({
            success: true,
            message: 'Note added successfully',
            data: lead
        });
    } catch (error) {
        console.error('Add lead note error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};




// Helper to check permission
const checkLeadPermission = async (lead, user) => {
    if (user.role === 'admin') return true;

    if (user.role === 'team_lead') {
        // Check if lead is created by them or assigned to them personally
        if (lead.createdBy?.toString() === user._id.toString()) return true;
        if (lead.assignedTo?.toString() === user._id.toString()) return true;

        // Check if lead is assigned to their team
        const team = await Team.findOne({ leadId: user._id });
        if (team) {
            // Check if assigned to the team
            if (lead.assignedTeam?.toString() === team._id.toString()) return true;

            // Check if assigned to a member of the team
            if (lead.assignedTo && team.members.some(m => m.toString() === lead.assignedTo.toString())) return true;
        }
        return false;
    }

    if (user.role === 'team_member') {
        const isAssignedTo = lead.assignedTo?.toString() === user._id.toString();
        const isCreatedBy = lead.createdBy?.toString() === user._id.toString();
        
        if (isAssignedTo || isCreatedBy) return true;

        // Check if lead is assigned to their team
        const team = await Team.findOne({ members: user._id });
        if (team && lead.assignedTeam?.toString() === team._id.toString()) return true;
    }

    return false;
};

module.exports = {
    getLeads,
    getLeadById,
    createLead,
    updateLead,
    assignLead,
    convertToProject,
    importLeads,
    previewLeads,
    getLeadStats,
    deleteLead,
    restoreLead,
    escalateLead,
    getLeadActivities,
    addNote
};