const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const VALID_STATUSES = ['To Do', 'In Progress', 'Under Review', 'Completed'];
const URL_REGEX = /^https?:\/\/\S+$/i;

// Faculty (Admin), the project owner, or an enrolled member may access a project's tasks.
function canAccessWorkspace(workspace, user) {
    const userId = (user.id || user._id).toString();
    const isMember = workspace.members.some(m => m.toString() === userId);
    const isOwner = workspace.owner.toString() === userId;
    return isMember || isOwner || user.role === 'Admin';
}

function normaliseAssignee(assignedTo) {
    if (typeof assignedTo === 'string' && assignedTo.trim() !== '') return assignedTo.trim();
    if (assignedTo && typeof assignedTo === 'object' && (assignedTo._id || assignedTo.id)) {
        return (assignedTo._id || assignedTo.id).toString();
    }
    return null;
}

// Loads a task plus its project and checks membership; sends the error response itself.
async function loadTaskForMember(req, res) {
    const task = await Task.findById(req.params.id);
    if (!task) {
        res.status(404).json({ message: 'Task not found.' });
        return null;
    }
    const workspace = await Workspace.findById(task.workspace);
    if (!workspace || !canAccessWorkspace(workspace, req.user)) {
        res.status(403).json({ message: 'Access denied to this project.' });
        return null;
    }
    return task;
}

function populateTask(query) {
    return query
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name email')
        .populate('reviewedBy', 'name email')
        .populate('comments.author', 'name email role');
}

// 1. Get all tasks for a project
router.get('/workspace/:workspaceId', authenticate, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Project not found.' });
        }
        if (!canAccessWorkspace(workspace, req.user)) {
            return res.status(403).json({ message: 'Access denied to this project.' });
        }

        const tasks = await populateTask(Task.find({ workspace: workspace._id }));
        res.json({ tasks });
    } catch (error) {
        console.error('Fetch tasks error:', error);
        res.status(500).json({ message: 'Failed to retrieve project tasks.' });
    }
});

// 2. Create Task or Log Daily Work
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, description, priority, assignedTo, workspace, status, repoUrl, docUrl } = req.body;

        if (!title || !workspace) {
            return res.status(400).json({ message: 'Title and project ID are required.' });
        }
        if (status && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Invalid task status.' });
        }
        if (status === 'Completed' && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only faculty can mark a task as Completed.' });
        }

        const targetWorkspace = await Workspace.findById(workspace);
        if (!targetWorkspace) {
            return res.status(404).json({ message: 'Project not found.' });
        }
        if (!canAccessWorkspace(targetWorkspace, req.user)) {
            return res.status(403).json({ message: 'You are not a member of this project.' });
        }

        const newTask = await Task.create({
            title,
            description,
            priority: priority || 'Medium',
            assignedTo: normaliseAssignee(assignedTo),
            workspace,
            createdBy: req.user.id || req.user._id,
            status: status || 'To Do',
            repoUrl: URL_REGEX.test(repoUrl || '') ? repoUrl : '',
            docUrl: URL_REGEX.test(docUrl || '') ? docUrl : ''
        });

        res.status(201).json(await populateTask(Task.findById(newTask._id)));
    } catch (error) {
        console.error('Task creation error:', error);
        res.status(500).json({ message: 'Failed to create task.' });
    }
});

// 3. Update Task Status (Drag and Drop)
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Invalid task status.' });
        }

        const task = await loadTaskForMember(req, res);
        if (!task) return;

        // Only faculty can mark work as Completed (i.e. accept it after review)
        if (status === 'Completed' && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only faculty can mark a task as Completed. Move it to Under Review instead.' });
        }

        task.status = status;
        await task.save();
        res.json(await populateTask(Task.findById(task._id)));
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Failed to update task status.' });
    }
});

// 4. Attach repository / document links (any project member)
router.patch('/:id/links', authenticate, async (req, res) => {
    try {
        const { repoUrl = '', docUrl = '' } = req.body;
        for (const url of [repoUrl, docUrl]) {
            if (url && !URL_REGEX.test(url)) {
                return res.status(400).json({ message: 'Links must start with http:// or https://' });
            }
        }

        const task = await loadTaskForMember(req, res);
        if (!task) return;

        task.repoUrl = repoUrl.trim();
        task.docUrl = docUrl.trim();
        await task.save();
        res.json(await populateTask(Task.findById(task._id)));
    } catch (error) {
        console.error('Update links error:', error);
        res.status(500).json({ message: 'Failed to update links.' });
    }
});

// 5. Faculty review: grade (0-100) + written feedback
router.patch('/:id/review', authenticate, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { grade, feedback = '' } = req.body;
        const numericGrade = Number(grade);
        if (grade === undefined || grade === '' || Number.isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
            return res.status(400).json({ message: 'Grade must be a number between 0 and 100.' });
        }

        const task = await loadTaskForMember(req, res);
        if (!task) return;

        task.grade = numericGrade;
        task.feedback = feedback.trim();
        task.reviewedBy = req.user.id || req.user._id;
        task.status = 'Completed';
        await task.save();
        res.json(await populateTask(Task.findById(task._id)));
    } catch (error) {
        console.error('Review task error:', error);
        res.status(500).json({ message: 'Failed to save review.' });
    }
});

// 6. Add a comment to the task's discussion thread (any project member)
router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const text = (req.body.text || '').trim();
        if (!text) {
            return res.status(400).json({ message: 'Comment text is required.' });
        }

        const task = await loadTaskForMember(req, res);
        if (!task) return;

        task.comments.push({ author: req.user.id || req.user._id, text });
        await task.save();
        res.status(201).json(await populateTask(Task.findById(task._id)));
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Failed to add comment.' });
    }
});

// 7. Update Task Details (Faculty or Project Owner Only)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { title, description, priority, assignedTo } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        const userId = (req.user.id || req.user._id).toString();
        const workspace = await Workspace.findById(task.workspace);
        const isOwner = workspace && workspace.owner && workspace.owner.toString() === userId;
        const isAdmin = req.user.role === 'Admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only faculty or project owners can edit task details.' });
        }

        task.title = title || task.title;
        task.description = description !== undefined ? description : task.description;
        task.priority = priority || task.priority;
        task.assignedTo = normaliseAssignee(assignedTo);

        await task.save();
        res.json(await populateTask(Task.findById(task._id)));
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Failed to edit task.' });
    }
});

// 8. Delete Task (Faculty or Project Owner Only)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        const userId = (req.user.id || req.user._id).toString();
        const workspace = await Workspace.findById(task.workspace);
        const isOwner = workspace && workspace.owner && workspace.owner.toString() === userId;
        const isAdmin = req.user.role === 'Admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Only faculty or project owners can delete tasks.' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted successfully.' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Failed to delete task.' });
    }
});

module.exports = router;
