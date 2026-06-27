const { runAgentOrchestrator } = require('../services/AgentOrchestratorService');
const AgentLog = require('../models/AgentLog');
const Task = require('../models/Task');

// @desc    Analyze a task using multi-agent system
// @route   POST /api/agents/analyze
// @access  Private
const analyzeTask = async (req, res) => {
  try {
    const { taskId, refresh, replan } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Check cache first
    if (!refresh && !replan) {
      const existingLog = await AgentLog.findOne({ taskId: task._id }).sort({ createdAt: -1 });
      if (existingLog) {
        if (!task.subTasks || task.subTasks.length === 0) {
          try {
            const parsed = JSON.parse(existingLog.rawOutput);
            if (parsed.planner && parsed.planner.subtasks) {
              const formattedSubTasks = parsed.planner.subtasks.map(t => ({ title: t, completed: false }));
              await Task.findByIdAndUpdate(taskId, { subTasks: formattedSubTasks });
              task.subTasks = formattedSubTasks;
            }
          } catch (e) {
            console.error("Failed to backfill subtasks", e);
          }
        }
        return res.status(200).json({ log: existingLog, updatedTask: task });
      }
    }

    // Run agents
    let result;
    try {
      result = await runAgentOrchestrator(task, replan);
    } catch (apiError) {
      // If it's a replan and the API fails, we must NOT fall back to the old cache, 
      // otherwise the user thinks the replan failed to change anything.
      if (replan) {
        return res.status(429).json({ error: "Google AI rate limit reached. Please wait 1 minute before generating a new emergency plan." });
      }

      // If API fails, try to fallback to cache if it exists
      const existingLog = await AgentLog.findOne({ taskId: task._id }).sort({ createdAt: -1 });
      if (existingLog) {
        if (!task.subTasks || task.subTasks.length === 0) {
          try {
            const parsed = JSON.parse(existingLog.rawOutput);
            if (parsed.planner && parsed.planner.subtasks) {
              const formattedSubTasks = parsed.planner.subtasks.map(t => ({ title: t, completed: false }));
              await Task.findByIdAndUpdate(taskId, { subTasks: formattedSubTasks });
              task.subTasks = formattedSubTasks;
            }
          } catch (e) {
            console.error("Failed to backfill subtasks", e);
          }
        }
        return res.status(200).json({ log: existingLog, updatedTask: task, cachedFallback: true });
      }
      
      // If NO cache exists (e.g. brand new task), and API is dead, use mock data to prevent UI lockup
      const { generateMockFallback } = require('../utils/mockFallback');
      const { mockTimeline, mockSummary } = generateMockFallback(task);
      
      const newMockLog = await AgentLog.create({
        taskId: task._id,
        timeline: mockTimeline,
        summary: mockSummary,
        rawOutput: JSON.stringify({ mockTimeline, mockSummary })
      });

      const mockSubTasks = [
        { title: `Review requirements for ${task.title}`, completed: false },
        { title: `Draft initial outline for ${task.category || 'topic'}`, completed: false },
        { title: `Complete first section`, completed: false }
      ];
      await Task.findByIdAndUpdate(task._id, { 
        riskScore: mockSummary.riskSeverity === 'High' ? 85 : mockSummary.riskSeverity === 'Medium' ? 65 : 20,
        subTasks: mockSubTasks
      });
      const updatedMockTask = await Task.findById(task._id);

      return res.status(200).json({ log: newMockLog, updatedTask: updatedMockTask, isMock: true });
    }

    if (result && result.generatedSubtasks && task.subTasks.length === 0) {
      const formattedSubTasks = result.generatedSubtasks.map(t => ({ title: t, completed: false }));
      await Task.findByIdAndUpdate(taskId, { subTasks: formattedSubTasks });
    }

    // Refresh task to get the updated riskScore and subtasks from orchestrator
    const updatedTask = await Task.findById(taskId);

    res.status(200).json({
      log: await AgentLog.findById(result.logId),
      updatedTask
    });
  } catch (error) {
    res.status(503).json({ message: 'Agent analysis failed', error: error.message });
  }
};

// @desc    Get agent logs for a task
// @route   GET /api/agents/logs/:taskId
// @access  Private
const getAgentLogs = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const logs = await AgentLog.findOne({ taskId: req.params.taskId }).sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { analyzeTask, getAgentLogs };
