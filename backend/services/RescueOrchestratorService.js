const { generateWithFallback } = require('../utils/geminiClient');
const AcademicPlan = require('../models/AcademicPlan');
const Task = require('../models/Task');

const runRescueOrchestrator = async (user, tasks, triggerReason) => {
  try {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const context = `Current Date: ${today}\nRescue Trigger: ${triggerReason}\nCritical Tasks:\n` + tasks.map(t => 
      `- ${t.title} (Category: ${t.category}, Deadline: ${t.deadline}, Risk: ${t.riskScore}%)`
    ).join('\n');

    const prompt = `You are an Emergency Academic Rescue System consisting of 4 agents.
Context:
${context}

CRITICAL RULES FOR SCHEDULING:
- You MUST NEVER schedule work or submission for a task AFTER its explicitly listed Deadline.
- All tasks must be marked as "submitted" on or before the day they are due.
- Provide a strict hour-by-hour schedule starting from NOW for the next 24 hours.

Simulate the thought process and outputs of the 4 agents in RESCUE MODE:
1. Planner Agent: Creates minimum viable survival plan. Focus only on essential work to pass/survive.
2. Realist Agent: Aggressively removes low-priority work. Critiques the plan by stating what to skip.
3. Risk Agent: Identifies highest-impact actions to reduce failure.
4. Coordinator Agent: Generates final emergency action plan with immediate triage steps and a strict timeline.

Return ONLY a JSON object with this exact structure:
{
  "planner": {
    "survivalPlan": "string",
    "essentialTasks": ["string"]
  },
  "realist": {
    "tasksToSkip": ["string"],
    "focusAreas": ["string"]
  },
  "risk": {
    "impactfulActions": [
      { "action": "string", "riskReductionPercent": number }
    ]
  },
  "coordinator": {
    "whatToDoRightNow": "string",
    "immediateTriageSteps": [
      "string"
    ],
    "strictSchedule": [
      { "time": "string (e.g. 10:00 AM)", "action": "string" }
    ],
    "projectedRiskDrop": number
  }
}`;

    let output;
    try {
      const res = await generateWithFallback(prompt, {
        responseMimeType: "application/json",
      });
      output = JSON.parse(res.text);
    } catch (apiError) {
      console.warn("Rescue Orchestrator API failed, using dynamic fallback:", apiError.message);
      // Fallback rescue plan
      
      const sortedTasks = [...tasks].sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
      const topTasks = sortedTasks.slice(0, 2);
      
      const triageSteps = [
        "Take a deep breath and close all distracting tabs.",
        `Email professor requesting 24hr extension for ${topTasks[0]?.title || 'your most urgent task'} if possible.`,
        "Open a blank document and write down the bare minimum requirements for your immediate deadline."
      ];

      const now = new Date();
      const getAmPm = (hoursToAdd) => {
        const d = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      };

      const schedule = [
        { time: getAmPm(1), action: `Triage and outline ${topTasks[0]?.title || 'urgent task'}. Do not perfect, just draft.` },
        { time: getAmPm(2), action: "Focus on producing the core deliverables. Ignore formatting." },
        { time: getAmPm(3), action: "Review against rubric, submit whatever you have for partial credit." }
      ];

      output = {
        coordinator: {
          whatToDoRightNow: `STOP EVERYTHING. Focus 100% of your energy on delivering the bare minimum for ${topTasks[0]?.title || 'your nearest deadline'}.`,
          immediateTriageSteps: triageSteps,
          strictSchedule: schedule,
          projectedRiskDrop: 45
        }
      };
    }

    return output.coordinator;

  } catch (error) {
    console.error("Rescue Orchestrator Error:", error);
    throw error;
  }
};

module.exports = { runRescueOrchestrator };
