const Task = require('../models/Task');
const AcademicPlan = require('../models/AcademicPlan');
const { runRescueOrchestrator } = require('../services/RescueOrchestratorService');

// Helper to calculate progress strictly
const getTaskProgress = (task) => {
  if (task.status === 'completed') return 100;
  if (task.status === 'in_progress') return 50;
  return 0;
};

// Helper to check triggers in Priority Order
const checkTriggers = (tasks) => {
  const now = new Date();

  // PRIORITY 1: AI Risk
  const highestRiskTask = tasks.find(t => t.riskScore >= 80);
  if (highestRiskTask) return `High AI Risk (${highestRiskTask.riskScore}%)`;

  // PRIORITY 2: Multiple Medium-Risk Tasks
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  if (activeTasks.length >= 3) {
    const avgRisk = activeTasks.reduce((acc, t) => acc + t.riskScore, 0) / activeTasks.length;
    if (avgRisk >= 80) return "Multiple Critical Tasks";
  }


  // Note: Trigger Manual is handled in activateRescueMode as "Manual Rescue"
  return null;
};

// @desc    Check if rescue mode should be active
// @route   GET /api/rescue/status
// @access  Private
const checkRescueStatus = async (req, res) => {
  try {
    const now = new Date();
    const tasks = await Task.find({ 
      userId: req.user._id, 
      status: { $nin: ['completed', 'missed'] },
      deadline: { $gte: now }
    });
    const triggerReason = checkTriggers(tasks);
    
    let activePlan = await AcademicPlan.findOne({ userId: req.user._id, active: true }).sort({ createdAt: -1 });

    // Auto-Exit Logic Check
    if (activePlan) {
      if (activePlan.completed) {
        activePlan.active = false;
        await activePlan.save();
      } else {
        // Fetch the tasks involved in the plan
        const involvedTasks = await Task.find({ _id: { $in: activePlan.tasksInvolved } });
        const allCompleted = involvedTasks.every(t => t.status === 'completed');
        const noHighRisk = !tasks.some(t => t.riskScore >= 80);

        // Do not auto-close if it was a manual rescue unless all tasks are completed
        const isManualRescue = activePlan.triggerReason === 'Manual Rescue';

        if (allCompleted || (!isManualRescue && noHighRisk)) {
          activePlan.completed = true;
          activePlan.active = false;
          await activePlan.save();
        }
      }
    }

    res.status(200).json({
      shouldActivate: !!triggerReason,
      triggerReason,
      isRescueModeActive: activePlan ? activePlan.active : false,
      activePlanId: activePlan ? activePlan._id : null,
      isRescueCompleted: activePlan ? activePlan.completed : false
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Activate rescue mode and generate plan
// @route   POST /api/rescue/activate
// @access  Private
const activateRescueMode = async (req, res) => {
  try {
    const { manualTriggerReason } = req.body;
    const now = new Date();
    const tasks = await Task.find({ 
      userId: req.user._id, 
      status: { $nin: ['completed', 'missed'] },
      deadline: { $gte: now }
    }).sort({ deadline: 1 });
    
    const triggerReason = manualTriggerReason ? "Manual Rescue" : checkTriggers(tasks) || "Manual Rescue";
    
    // Calculate aggregate risk
    const currentRiskScore = tasks.length > 0 ? Math.max(...tasks.map(t => t.riskScore)) : 0;

    const orchestratorResult = await runRescueOrchestrator(req.user, tasks, triggerReason);

    // Deactivate previous plans
    await AcademicPlan.updateMany({ userId: req.user._id }, { active: false });

    const newPlan = await AcademicPlan.create({
      userId: req.user._id,
      triggerReason,
      tasksInvolved: tasks.map(t => t._id),
      currentRiskScore,
      whatToDoRightNow: orchestratorResult.whatToDoRightNow,
      immediateTriageSteps: (orchestratorResult.immediateTriageSteps || []).map(action => ({ action, completed: false })),
      strictSchedule: orchestratorResult.strictSchedule,
      projectedRiskDrop: orchestratorResult.projectedRiskDrop,
      active: true
    });

    res.status(201).json(newPlan);
  } catch (error) {
    res.status(500).json({ message: 'Rescue activation failed', error: error.message });
  }
};

// @desc    Get active rescue plan
// @route   GET /api/rescue/plan
// @access  Private
const getActiveRescuePlan = async (req, res) => {
  try {
    const plan = await AcademicPlan.findOne({ userId: req.user._id, active: true })
      .populate('tasksInvolved', 'title category deadline riskScore status');
      
    if (!plan) return res.status(404).json({ message: 'No active rescue plan found' });

    // Ensure auto-exit is also checked here in case the user navigates directly to the dashboard
    if (plan.completed) {
      plan.active = false;
      await plan.save();
      return res.status(404).json({ message: 'Rescue plan auto-deactivated' });
    } else {
      const allCompleted = plan.tasksInvolved.every(t => t.status === 'completed');
      const noHighRisk = !plan.tasksInvolved.some(t => t.riskScore >= 80);
      
      const isManualRescue = plan.triggerReason === 'Manual Rescue';

      if (allCompleted || (!isManualRescue && noHighRisk)) {
        plan.completed = true;
        plan.active = false;
        await plan.save();
        return res.status(404).json({ message: 'Rescue plan auto-deactivated' });
      }
    }
    
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Deactivate current rescue plan
// @route   POST /api/rescue/deactivate
// @access  Private
const deactivateRescueMode = async (req, res) => {
  try {
    await AcademicPlan.updateMany({ userId: req.user._id, active: true }, { active: false });
    res.status(200).json({ message: 'Rescue mode deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle triage step completion
// @route   POST /api/rescue/triage/:stepId/toggle
// @access  Private
const toggleTriageStep = async (req, res) => {
  try {
    const plan = await AcademicPlan.findOne({ userId: req.user._id, active: true });
    if (!plan) return res.status(404).json({ message: 'No active plan' });
    
    const step = plan.immediateTriageSteps.id(req.params.stepId);
    if (!step) return res.status(404).json({ message: 'Step not found' });
    
    step.completed = !step.completed;
    await plan.save();
    
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { checkRescueStatus, activateRescueMode, getActiveRescuePlan, deactivateRescueMode, toggleTriageStep };
