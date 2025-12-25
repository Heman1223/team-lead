const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        const { status, priority, assignedTo, teamId } = req.query;

        let query = {};

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (assignedTo) query.assignedTo = assignedTo;

        // For team members, show tasks where they have subtasks assigned
        // Don't filter by teamId since subtasks could be in any parent task
        if (req.user.role === 'team_member') {
            query.$or = [
                { assignedTo: req.user._id },
                { 'subtasks.assignedTo': req.user._id }
            ];
        } else {
            // For team leads and admins, filter by team
            if (teamId) {
                query.teamId = teamId;
            } else if (req.user.teamId) {
                query.teamId = req.user.teamId;
            }
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email avatar status')
            .populate('assignedBy', 'name email')
            .populate('subtasks.assignedTo', 'name email')
            .sort({ deadline: 1 });

        // Update overdue tasks and calculate progress
        const now = new Date();
        for (let task of tasks) {
            // Update overdue status
            if (task.status !== 'completed' && task.deadline < now && task.status !== 'overdue') {
                task.status = 'overdue';
            }
            
            // Calculate progress if task has subtasks
            if (task.subtasks && task.subtasks.length > 0) {
                task.calculateProgress();
            }
            
            await task.save();
        }

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email avatar status')
            .populate('assignedBy', 'name email')
            .populate('comments.userId', 'name avatar');

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Team Lead only)
const createTask = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            detailedDescription,
            clientRequirements,
            projectScope,
            priority, 
            deadline, 
            dueDate, 
            assignedTo, 
            notes, 
            estimatedHours 
        } = req.body;

        const task = await Task.create({
            title,
            description,
            detailedDescription,
            clientRequirements,
            projectScope,
            priority: priority || 'medium',
            deadline: deadline || dueDate,
            dueDate: dueDate || deadline,
            assignedTo,
            assignedBy: req.user._id,
            teamId: req.user.teamId,
            notes,
            estimatedHours
        });

        // Create notification for assigned user
        await Notification.create({
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${task.title}`,
            userId: assignedTo,
            taskId: task._id,
            senderId: req.user._id
        });

        // Log activity
        await ActivityLog.create({
            action: 'task_created',
            userId: req.user._id,
            taskId: task._id,
            teamId: req.user.teamId,
            details: `Task created: ${task.title}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('assignedBy', 'name email');

        res.status(201).json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            detailedDescription,
            clientRequirements,
            projectScope,
            priority, 
            deadline, 
            assignedTo, 
            status, 
            notes, 
            estimatedHours, 
            actualHours 
        } = req.body;

        let task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const oldStatus = task.status;
        const oldAssignee = task.assignedTo;

        // Update fields
        if (title) task.title = title;
        if (description) task.description = description;
        if (detailedDescription !== undefined) task.detailedDescription = detailedDescription;
        if (clientRequirements !== undefined) task.clientRequirements = clientRequirements;
        if (projectScope !== undefined) task.projectScope = projectScope;
        if (priority) task.priority = priority;
        if (deadline) task.deadline = deadline;
        if (assignedTo) task.assignedTo = assignedTo;
        if (status) {
            task.status = status;
            if (status === 'completed') {
                task.completedAt = new Date();
            }
        }
        if (notes) task.notes = notes;
        if (estimatedHours) task.estimatedHours = estimatedHours;
        if (actualHours) task.actualHours = actualHours;

        await task.save();

        // Notify if status changed
        if (status && status !== oldStatus) {
            await ActivityLog.create({
                action: 'task_status_changed',
                userId: req.user._id,
                taskId: task._id,
                teamId: task.teamId,
                details: `Task "${task.title}" status changed from ${oldStatus} to ${status}`
            });

            // Notify task owner/assigner about status change
            const notifyUserId = task.assignedBy && task.assignedBy.toString() !== req.user._id.toString() 
                ? task.assignedBy 
                : task.assignedTo;
            
            if (notifyUserId && notifyUserId.toString() !== req.user._id.toString()) {
                await Notification.create({
                    type: 'task_updated',
                    title: 'Task Status Changed',
                    message: `Task "${task.title}" status changed to ${status}`,
                    userId: notifyUserId,
                    taskId: task._id,
                    senderId: req.user._id,
                    priority: status === 'completed' ? 'low' : 'medium'
                });
            }
        }

        // Notify if reassigned
        if (assignedTo && assignedTo.toString() !== oldAssignee.toString()) {
            await Notification.create({
                type: 'task_assigned',
                title: 'Task Assigned to You',
                message: `Task "${task.title}" has been assigned to you`,
                userId: assignedTo,
                taskId: task._id,
                senderId: req.user._id
            });

            await ActivityLog.create({
                action: 'task_assigned',
                userId: req.user._id,
                targetUserId: assignedTo,
                taskId: task._id,
                teamId: task.teamId,
                details: `Task reassigned: ${task.title}`
            });
        }

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('assignedBy', 'name email');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Team Lead only)
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await ActivityLog.create({
            action: 'task_deleted',
            userId: req.user._id,
            teamId: task.teamId,
            details: `Task deleted: ${task.title}`
        });

        await task.deleteOne();

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
    try {
        const { content } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        task.comments.push({
            userId: req.user._id,
            content
        });

        await task.save();

        await ActivityLog.create({
            action: 'comment_added',
            userId: req.user._id,
            taskId: task._id,
            teamId: task.teamId,
            details: `Comment added to task: ${task.title}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('assignedBy', 'name email')
            .populate('comments.userId', 'name avatar');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        // Update overdue tasks
        const now = new Date();
        await Task.updateMany(
            { teamId, status: { $nin: ['completed', 'overdue'] }, deadline: { $lt: now } },
            { status: 'overdue' }
        );

        const stats = await Task.aggregate([
            { $match: { teamId: teamId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const result = {
            assigned: 0,
            in_progress: 0,
            blocked: 0,
            overdue: 0,
            completed: 0,
            total: 0
        };

        stats.forEach(item => {
            result[item._id] = item.count;
            result.total += item.count;
        });

        // Get upcoming deadlines (next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcomingDeadlines = await Task.find({
            teamId,
            status: { $nin: ['completed'] },
            deadline: { $gte: now, $lte: nextWeek }
        })
            .populate('assignedTo', 'name avatar')
            .sort({ deadline: 1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                stats: result,
                upcomingDeadlines
            }
        });
    } catch (error) {
        console.error('Get task stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get my tasks (tasks assigned to me)
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res) => {
    try {
        // For team members, find tasks where:
        // 1. They are directly assigned (assignedTo)
        // 2. They have subtasks assigned to them
        const query = {
            $or: [
                { assignedTo: req.user._id },
                { 'subtasks.assignedTo': req.user._id }
            ]
        };

        const tasks = await Task.find(query)
            .populate('assignedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('teamId', 'name')
            .populate('subtasks.assignedTo', 'name email')
            .sort({ createdAt: -1 });

        // Calculate progress for each task
        for (let task of tasks) {
            if (task.subtasks && task.subtasks.length > 0) {
                task.calculateProgress();
                await task.save();
            }
        }

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Get my tasks error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Add subtask to parent task
// @route   POST /api/tasks/:id/subtasks
// @access  Private (Team Lead only)
const addSubtask = async (req, res) => {
    try {
        const { title, description, assignedTo } = req.body;

        if (!title || !assignedTo) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title and assignedTo'
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Verify the task is assigned to the current user (team lead)
        if (task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only add subtasks to your own tasks'
            });
        }

        // Create the new subtask object
        const newSubtask = {
            title,
            description: description || '',
            assignedTo,
            status: 'not_started',
            createdAt: new Date()
        };

        // Use findByIdAndUpdate with $push to avoid full document validation
        await Task.findByIdAndUpdate(
            req.params.id,
            {
                $push: { subtasks: newSubtask },
                $set: { status: task.status === 'not_started' ? 'in_progress' : task.status }
            },
            { new: true, runValidators: false }
        );

        // Create notification for assigned member (don't let this fail the response)
        try {
            await Notification.create({
                type: 'task_assigned',
                title: 'New Subtask Assigned',
                message: `You have been assigned a subtask: ${title}`,
                userId: assignedTo,
                taskId: task._id,
                senderId: req.user._id
            });
        } catch (notifError) {
            console.error('Failed to create notification:', notifError.message);
        }

        // Log activity (don't let this fail the response)
        try {
            await ActivityLog.create({
                action: 'subtask_created',
                userId: req.user._id,
                targetUserId: assignedTo,
                taskId: task._id,
                teamId: task.teamId,
                details: `Subtask created: ${title} for task: ${task.title}`
            });
        } catch (activityError) {
            console.error('Failed to log activity:', activityError.message);
        }

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name')
            .populate('subtasks.assignedTo', 'name email');

        res.status(201).json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('❌ Add subtask error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Request params:', req.params);
        console.error('Request body:', req.body);
        console.error('User:', req.user?._id);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update subtask status
// @route   PUT /api/tasks/:id/subtasks/:subtaskId
// @access  Private
const updateSubtask = async (req, res) => {
    try {
        const { status, progressPercentage } = req.body;

        if (!status && progressPercentage === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide status or progressPercentage'
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const subtask = task.subtasks.id(req.params.subtaskId);
        if (!subtask) {
            return res.status(404).json({ success: false, message: 'Subtask not found' });
        }

        // Update subtask status and progress
        const oldStatus = subtask.status;
        if (status) subtask.status = status;
        if (progressPercentage !== undefined) subtask.progressPercentage = progressPercentage;

        if (status === 'completed') {
            subtask.completedAt = new Date();
            subtask.progressPercentage = 100;
        }

        // Recalculate parent task progress
        task.calculateProgress();
        await task.save();

        // Log activity
        await ActivityLog.create({
            action: 'subtask_updated',
            userId: req.user._id,
            taskId: task._id,
            teamId: task.teamId,
            details: `Subtask "${subtask.title}" status changed from ${oldStatus} to ${status || 'updated'}`
        });

        // Notify team lead about subtask status change
        if (status && status !== oldStatus && task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
            await Notification.create({
                type: 'task_updated',
                title: 'Subtask Status Changed',
                message: `Subtask "${subtask.title}" status changed to ${status}`,
                userId: task.assignedTo,
                taskId: task._id,
                senderId: req.user._id,
                priority: status === 'completed' ? 'low' : 'medium'
            });
        }

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name')
            .populate('subtasks.assignedTo', 'name email');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Update subtask error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Submit EOD report for subtask
// @route   POST /api/tasks/:id/subtasks/:subtaskId/eod-report
// @access  Private
const submitEODReport = async (req, res) => {
    try {
        const { workCompleted, hoursSpent, progressUpdate, blockers, nextDayPlan } = req.body;

        if (!workCompleted) {
            return res.status(400).json({
                success: false,
                message: 'Please provide work completed description'
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const subtask = task.subtasks.id(req.params.subtaskId);
        if (!subtask) {
            return res.status(404).json({ success: false, message: 'Subtask not found' });
        }

        // Verify the user is assigned to this subtask
        if (subtask.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only submit EOD reports for your own subtasks'
            });
        }

        // Create EOD report
        const eodReport = {
            reportDate: new Date(),
            workCompleted,
            hoursSpent: hoursSpent || 0,
            progressUpdate: progressUpdate || subtask.progressPercentage,
            blockers: blockers || '',
            nextDayPlan: nextDayPlan || '',
            submittedBy: req.user._id,
            submittedAt: new Date()
        };

        subtask.eodReports.push(eodReport);

        // Update subtask progress
        if (progressUpdate !== undefined) {
            subtask.progressPercentage = progressUpdate;
            
            // Auto-update status based on progress
            if (progressUpdate === 100) {
                subtask.status = 'completed';
                subtask.completedAt = new Date();
            } else if (progressUpdate > 0 && subtask.status === 'not_started') {
                subtask.status = 'in_progress';
            }
        }

        // If blockers mentioned, set status to blocked
        if (blockers && blockers.trim().length > 0 && subtask.status !== 'completed') {
            subtask.status = 'blocked';
        }

        // Recalculate parent task progress
        task.calculateProgress();
        await task.save();

        // Log activity
        await ActivityLog.create({
            action: 'subtask_updated',
            userId: req.user._id,
            taskId: task._id,
            teamId: task.teamId,
            details: `EOD report submitted for subtask: ${subtask.title} (${progressUpdate || subtask.progressPercentage}% complete)`
        });

        // Notify team lead
        await Notification.create({
            type: 'task_updated',
            title: 'EOD Report Submitted',
            message: `${req.user.name} submitted EOD report for "${subtask.title}"`,
            userId: task.assignedTo,
            taskId: task._id,
            senderId: req.user._id
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name')
            .populate('subtasks.assignedTo', 'name email')
            .populate('subtasks.eodReports.submittedBy', 'name email');

        res.json({
            success: true,
            message: 'EOD report submitted successfully',
            data: populatedTask
        });
    } catch (error) {
        console.error('Submit EOD report error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete subtask
// @route   DELETE /api/tasks/:id/subtasks/:subtaskId
// @access  Private (Team Lead only)
const deleteSubtask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Verify the task is assigned to the current user (team lead)
        if (task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete subtasks from your own tasks'
            });
        }

        const subtask = task.subtasks.id(req.params.subtaskId);
        if (!subtask) {
            return res.status(404).json({ success: false, message: 'Subtask not found' });
        }

        const subtaskTitle = subtask.title;

        // Remove subtask
        task.subtasks.pull(req.params.subtaskId);

        // Recalculate progress
        task.calculateProgress();
        await task.save();

        // Log activity
        await ActivityLog.create({
            action: 'subtask_deleted',
            userId: req.user._id,
            taskId: task._id,
            teamId: task.teamId,
            details: `Subtask deleted: ${subtaskTitle} from task: ${task.title}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name')
            .populate('subtasks.assignedTo', 'name email');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Delete subtask error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Upload attachment to task
// @route   POST /api/tasks/:id/attachments
// @access  Private (Team Lead only)
const uploadAttachment = async (req, res) => {
    try {
        const { fileName, fileUrl, fileType, fileSize, originalName } = req.body;

        if (!fileName || !fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'Please provide fileName and fileUrl'
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const attachment = {
            name: fileName,
            originalName: originalName || fileName,
            url: fileUrl,
            fileType: fileType || 'unknown',
            fileSize: fileSize || 0,
            uploadedBy: req.user._id,
            uploadedAt: new Date()
        };

        task.attachments.push(attachment);
        await task.save();

        await ActivityLog.create({
            action: 'task_updated',
            userId: req.user._id,
            taskId: task._id,
            teamId: task.teamId,
            details: `File attached to task: ${task.title} - ${fileName}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('assignedBy', 'name email')
            .populate('attachments.uploadedBy', 'name');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Upload attachment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete attachment from task
// @route   DELETE /api/tasks/:id/attachments/:attachmentId
// @access  Private (Team Lead only)
const deleteAttachment = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const attachment = task.attachments.id(req.params.attachmentId);
        if (!attachment) {
            return res.status(404).json({ success: false, message: 'Attachment not found' });
        }

        const attachmentName = attachment.name;
        task.attachments.pull(req.params.attachmentId);
        await task.save();

        await ActivityLog.create({
            action: 'task_updated',
            userId: req.user._id,
            taskId: task._id,
            teamId: task.teamId,
            details: `File removed from task: ${task.title} - ${attachmentName}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('assignedBy', 'name email')
            .populate('attachments.uploadedBy', 'name');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    getTaskStats,
    getMyTasks,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    uploadAttachment,
    deleteAttachment,
    submitEODReport
};
