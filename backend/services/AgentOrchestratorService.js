const { generateWithFallback } = require('../utils/geminiClient');
const AgentLog = require('../models/AgentLog');
const Task = require('../models/Task');

const runAgentOrchestrator = async (taskInput, isReplan = false) => {
  try {
    const now = new Date();
    const currentDate = now.toLocaleString('en-US');
    const deadlineDate = new Date(taskInput.deadline);
    const hoursRemainingFloat = (deadlineDate - now) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, hoursRemainingFloat).toFixed(1);
    
    let calculatedRiskScore = 0;
    if (hoursRemainingFloat <= 0) {
      calculatedRiskScore = 100;
    } else {
      const daysRemaining = hoursRemainingFloat / 24;
      // Calculate how many hours per day they need to work on this specific task
      const hoursPerDayRequired = taskInput.estimatedHours / daysRemaining;
      
      // Assume max reasonable working hours per day on a single task is 8.
      // If they need to work 8 hours/day just on this, risk is 100%.
      const riskRatio = hoursPerDayRequired / 8; 
      calculatedRiskScore = Math.min(100, Math.max(0, Math.round(riskRatio * 100)));
      
      // Bump risk for High priority
      if (taskInput.priority === 'High' && calculatedRiskScore < 85) {
          calculatedRiskScore += 10;
      } else if (taskInput.priority === 'Low') {
          calculatedRiskScore -= 10;
      }
      calculatedRiskScore = Math.min(100, Math.max(0, calculatedRiskScore));
    }

    let replanContext = '';
    if (isReplan) {
      const remainingTasks = taskInput.subTasks?.filter(t => !t.completed).map(t => t.title).join(', ') || 'Unknown remaining tasks';
      replanContext = `\n🚨 EMERGENCY REPLANNING INITIATED 🚨\nThe user fell behind on this task. The following subtasks are STILL REMAINING: [${remainingTasks}].\nYou MUST completely ignore what they have already done. Your entire goal is to build a compressed, emergency schedule for the remaining work in the time left. Focus ONLY on the remaining subtasks.`;
    }

    const prompt = `You are a Multi-Agent System consisting of 4 distinct AI agents working together to plan a task for a human user.
Your goal is to provide actionable, highly user-friendly, and encouraging advice addressed directly to the user (use "you", "your", "I suggest").
${replanContext}

Task Details:
Title: ${taskInput.title}
Category: ${taskInput.category}
Deadline: ${taskInput.deadline}
Estimated Hours Needed: ${taskInput.estimatedHours}
Priority: ${taskInput.priority}
Description: ${taskInput.description || 'None'}
Current Date & Time: ${currentDate}
Hours Remaining Until Deadline: ${hoursRemaining} hours
MATHEMATICAL RISK SCORE: ${calculatedRiskScore}%

IMPORTANT: Never infer the current date/time. You must use the "Current Date & Time" provided above. If the "Hours Remaining" is less than the "Estimated Hours Needed", the agents MUST recognize this as a severe time deficit and propose an EMERGENCY compressed plan instead of a normal schedule. 

CRITICAL MATH RULE: The Risk Agent MUST output exactly ${calculatedRiskScore} for the riskScore. Do NOT generate your own number. Justify this score mathematically in your mitigations by mentioning the required hours per day.

CRITICAL TONE INSTRUCTION: You MUST speak like an empathetic, highly encouraging human productivity coach talking directly to a friend. 
- Use "you", "your", "I suggest", "let's".
- DO NOT use robotic, corporate, or backend-oriented language (e.g., "administrative closure", "validate assumptions", "execute audit").
- Use extremely natural, conversational, and warm language (e.g., "It looks like you might have already finished this!", "Let's double check if you need more time", "I suggest you take a quick look").
- Be supportive, but firm on deadlines.
- If a task has 0 estimated hours or a past deadline, don't talk about it like a database error. Say something like: "Hey, I noticed this deadline passed and it has 0 hours estimated. Did you already finish this? If so, great job! Just mark it complete."

CRITICAL SUBJECT-MATTER SPECIFICITY INSTRUCTION (NO GENERIC ANSWERS!):
- You are strictly FORBIDDEN from using generic project management verbs like "Understand requirements", "Review concepts", "Draft solution", "Brainstorm", "Break it into phases". 
- Your advice, subtasks, and schedule MUST be highly specific to the actual topic, subject matter, and domain of the task.
- If the task title or description is vague (e.g., "Math Assignment", "Coding Project"), you MUST make educated guesses and invent realistic, highly specific subtasks (e.g., for Math: "Solve quadratic equations", "Review derivative rules").
- Every single subtask and recommendation MUST contain domain-specific nouns and technical terms. Prove your subject-matter expertise!

Simulate the thought process and outputs of the following 4 agents in order:
1. Planner Agent: Creates the ideal task completion strategy, subtasks, and timeline.
2. Realist Agent: Critiques the Planner's strategy, identifies bottlenecks, and removes over-optimistic assumptions.
3. Risk Agent: Evaluates the combined plan and assigns a Risk Score. 
   Risk Score Rules: 
   - 0-30: Low
   - 31-70: Medium
   - 71-100: High
   Calculate risk using: Days until deadline, Estimated hours, Task complexity, Current progress, and Proof submissions.
4. Coordinator Agent: Takes all the above inputs and produces the final, balanced schedule and recommendation.

Return ONLY a JSON object with this exact structure:
{
  "planner": {
    "subtasks": ["string"],
    "timeline": "string",
    "recommendations": ["string"]
  },
  "realist": {
    "bottlenecks": ["string"],
    "adjustments": ["string"]
  },
  "risk": {
    "riskScore": number,
    "probabilityOfFailure": number,
    "keyRisks": ["string"],
    "mitigation": ["string"]
  },
  "coordinator": {
    "schedule": ["string"],
    "keyAdvice": ["string"],
    "recommendation": "string",
    "plannerConfidence": number,
    "realistConfidence": number,
    "estimatedCompletionProbability": number,
    "recommendedStartTime": "string",
    "deadlineUrgency": "string"
  }
}`;

    const response = await generateWithFallback(prompt, {
      responseMimeType: "application/json",
    });

    const output = JSON.parse(response.text);

    // Force the risk score to be the mathematically correct one, just in case the LLM disobeys
    output.risk.riskScore = calculatedRiskScore;

    const timeline = [
      { agent: 'Planner', stepType: 'Strategy', message: JSON.stringify(output.planner, null, 2) },
      { agent: 'Realist', stepType: 'Critique', message: JSON.stringify(output.realist, null, 2) },
      { agent: 'Risk', stepType: 'Analysis', message: JSON.stringify({
          riskScore: output.risk.riskScore,
          probabilityOfFailure: output.risk.probabilityOfFailure,
          keyRisks: output.risk.keyRisks || [],
          mitigation: output.risk.mitigation || []
      }, null, 2) },
      { agent: 'Coordinator', stepType: 'Final Plan', message: JSON.stringify({
          schedule: output.coordinator.schedule || [],
          keyAdvice: output.coordinator.keyAdvice || []
      }, null, 2) }
    ];

    const summary = {
      plannerConfidence: output.coordinator.plannerConfidence || 85,
      realistConfidence: output.coordinator.realistConfidence || 75,
      riskScore: output.risk.riskScore,
      riskSeverity: output.risk.riskScore >= 71 ? 'High' : output.risk.riskScore >= 31 ? 'Medium' : 'Low',
      estimatedCompletionProbability: output.coordinator.estimatedCompletionProbability || 95,
      recommendedStartTime: output.coordinator.recommendedStartTime || 'Today',
      deadlineUrgency: output.coordinator.deadlineUrgency || 'Medium',
      finalRecommendation: output.coordinator.recommendation || "Proceed with the final plan."
    };

    const agentLog = await AgentLog.create({
      taskId: taskInput._id,
      timeline,
      summary,
      rawOutput: response.text
    });

    // If replanning, keep the already completed subtasks and just append the new ones, or replace the uncompleted ones.
    // For simplicity, let's keep the completed ones and append the new ones.
    let finalSubTasks = [];
    if (isReplan && taskInput.subTasks) {
      finalSubTasks = taskInput.subTasks.filter(t => t.completed);
    }
    const newSubTasks = (output.planner.subtasks || []).map(title => ({ title, completed: false }));
    finalSubTasks = [...finalSubTasks, ...newSubTasks];

    // Update risk score on task
    await Task.findByIdAndUpdate(taskInput._id, { 
      riskScore: calculatedRiskScore,
      aiPlan: output.coordinator.recommendation,
      completionProbability: output.coordinator.estimatedCompletionProbability,
      subTasks: finalSubTasks
    });

    return { logId: agentLog._id, generatedSubtasks: output.planner.subtasks || [] };

  } catch (error) {
    console.error("Orchestrator error:", error);
    throw error;
  }
};

module.exports = { runAgentOrchestrator };
