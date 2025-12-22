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

        // Update overdue tasks
        const now = new Date();
        for (let task of tasks) {
            if (task.status !== 'completed' && task.deadline < now && task.status !== 'overdue') {
                task.status = 'overdue';
                await task.save();
            }
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
        const { title, description, priority, deadline, dueDate, assignedTo, notes, estimatedHours } = req.body;

        const task = await Task.create({
            title,
            description,
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
        const { title, description, priority, deadline, assignedTo, status, notes, estimatedHours, actualHours } = req.body;

        let task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const oldStatus = task.status;
        const oldAssignee = task.assignedTo;

        // Update fields
        if (title) task.title = title;
        if (description) task.description = description;
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
        const tasks = await Task.find({ assignedTo: req.user._id })
            .populate('assignedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('teamId', 'name')
            .populate('subtasks.assignedTo', 'name email')
            .sort({ createdAt: -1 });

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
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Please provide status'
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

        // Update subtask status
        const oldStatus = subtask.status;
        subtask.status = status;

        if (status === 'completed') {
            subtask.completedAt = new Date();
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
            details: `Subtask "${subtask.title}" status changed from ${oldStatus} to ${status}`
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
        console.error('Update subtask error:', error);
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
    deleteSubtask
};
