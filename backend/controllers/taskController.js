const Task = require('../models/Task');
const User = require('../models/User');
const { GoogleGenAI } = require('@google/genai');
const ics = require('ics');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    let tasks = await Task.find({ userId: req.user._id }).sort({ deadline: 1 });
    
    // Backfill subTasks if missing
    let modified = false;
    const AgentLog = require('../models/AgentLog');
    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i].subTasks || tasks[i].subTasks.length === 0) {
        const existingLog = await AgentLog.findOne({ taskId: tasks[i]._id }).sort({ createdAt: -1 });
        if (existingLog) {
          try {
            const parsed = JSON.parse(existingLog.rawOutput);
            if (parsed.planner && parsed.planner.subtasks) {
              const formattedSubTasks = parsed.planner.subtasks.map(t => ({ title: t, completed: false }));
              tasks[i].subTasks = formattedSubTasks;
              await tasks[i].save();
              modified = true;
            }
          } catch (e) {
            console.error("Backfill error:", e.message);
          }
        }
      }
    }

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, category, deadline, estimatedHours, priority } = req.body;
    
    if (!title || !deadline || !estimatedHours) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    const task = await Task.create({
      userId: req.user._id,
      title,
      description,
      category,
      deadline,
      estimatedHours,
      priority
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    let xpGained = 0;
    if (req.body.status === 'completed' && task.status !== 'completed') {
      xpGained = Math.round(task.estimatedHours * 20); // 20 XP per estimated hour
      
      const userDoc = await User.findById(req.user._id);
      userDoc.xp += xpGained;
      userDoc.level = Math.floor(userDoc.xp / 100) + 1;
      
      // Update streak if completing something
      userDoc.currentStreak += 1;
      await userDoc.save();
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ ...updatedTask.toObject(), xpGained });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await task.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get dashboard summary
// @route   GET /api/tasks/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    
    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'missed');
    
    const summary = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      missed: tasks.filter(t => t.status === 'missed').length,
      activeCount: activeTasks.length,
      averageRisk: activeTasks.length ? activeTasks.reduce((acc, t) => acc + t.riskScore, 0) / activeTasks.length : 0,
      user: {
        xp: req.user.xp,
        level: req.user.level,
        badges: req.user.badges,
        currentStreak: req.user.currentStreak
      }
    };

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get AI insight for tasks
// @route   GET /api/tasks/insight
// @access  Private
const getInsight = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id, status: 'pending' });
    if (tasks.length === 0) {
       return res.status(200).json({ insight: "You currently have no active tasks. Take a break or plan ahead for the upcoming week!" });
    }
    
    const taskSummary = tasks.map(t => `${t.title} (Risk: ${t.riskScore}%, Due: ${new Date(t.deadline).toLocaleDateString()})`).join(', ');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a strict but encouraging academic AI coach. Analyze these tasks and give a 2 sentence insight on the user's workload, highlighting what they should focus on first based on risk and deadline. Tasks: ${taskSummary}`,
      config: {
        systemInstruction: "Keep it under 3 sentences. Be direct and insightful."
      }
    });

    res.status(200).json({ insight: response.text });
  } catch (error) {
    console.error("AI Insight error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Toggle a subtask
// @route   PUT /api/tasks/:id/subtasks/:subTaskId
// @access  Private
const toggleSubTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'User not authorized' });

    const subTask = task.subTasks.id(req.params.subTaskId);
    if (!subTask) return res.status(404).json({ message: 'Subtask not found' });

    subTask.completed = !subTask.completed;

    // Dynamically reduce risk score if checking off
    if (subTask.completed && task.riskScore > 0) {
      task.riskScore = Math.max(0, task.riskScore - 5);
    } else if (!subTask.completed && task.riskScore < 100) {
      task.riskScore = Math.min(100, task.riskScore + 5);
    }

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Export calendar (.ics)
// @route   GET /api/tasks/calendar
// @access  Private
const exportCalendar = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id, status: { $ne: 'completed' } });

    const events = tasks.map(task => {
      const deadline = new Date(task.deadline);
      // Create a 1 hour event ending at the deadline
      const start = new Date(deadline.getTime() - (task.estimatedHours * 60 * 60 * 1000));
      
      return {
        title: `Deadline: ${task.title}`,
        description: `Priority: ${task.priority}\nCategory: ${task.category}\n\n${task.description || ''}`,
        start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
        end: [deadline.getFullYear(), deadline.getMonth() + 1, deadline.getDate(), deadline.getHours(), deadline.getMinutes()],
        status: 'CONFIRMED',
        busyStatus: 'BUSY'
      };
    });

    const { error, value } = ics.createEvents(events);

    if (error) {
      return res.status(500).json({ message: 'Failed to generate calendar', error });
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="deadline-guardian-tasks.ics"');
    res.send(value);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getDashboardSummary,
  getInsight,
  toggleSubTask,
  exportCalendar
};
