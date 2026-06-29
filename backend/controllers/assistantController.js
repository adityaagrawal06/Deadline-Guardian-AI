const { GoogleGenAI } = require('@google/genai');
const Task = require('../models/Task');
const AcademicPlan = require('../models/AcademicPlan');
const { runRescueOrchestrator } = require('../services/RescueOrchestratorService');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getContext = async (userId) => {
  const tasks = await Task.find({ userId, status: { $nin: ['completed', 'missed'] } }).sort({ deadline: 1 });
  const activePlan = await AcademicPlan.findOne({ userId, active: true });
  
  const now = new Date();
  
  return {
    currentDate: now.toLocaleDateString(),
    currentTime: now.toLocaleTimeString(),
    tasks: tasks.map(t => ({
      id: t._id,
      title: t.title,
      category: t.category,
      deadline: t.deadline,
      riskScore: t.riskScore,
      priority: t.priority
    })),
    rescueModeActive: !!activePlan,
    activePlanDetails: activePlan ? {
      triggerReason: activePlan.triggerReason,
      whatToDoRightNow: activePlan.whatToDoRightNow
    } : null
  };
};

const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const context = await getContext(req.user._id);

    const systemInstruction = `You are Guardian AI, a premium, highly intelligent personal productivity coach for Deadline Guardian.
Your goal is to help the user manage their academic workload, prioritize tasks, and reduce risk.
Always be encouraging, concise, and professional. Use formatting (bolding, lists, emojis) to make your responses beautiful and easy to read.

USER CONTEXT (Automatically injected, do NOT ask the user for this):
Current Date/Time: ${context.currentDate} ${context.currentTime}
Active Tasks: ${JSON.stringify(context.tasks, null, 2)}
Rescue Mode Active: ${context.rescueModeActive}
${context.rescueModeActive ? `Current Emergency Directive: ${context.activePlanDetails.whatToDoRightNow}` : ''}

CRITICAL RULES:
- If the user asks for a dashboard summary or progress, you ALREADY HAVE the tasks. Just analyze them and provide a summary. DO NOT say you don't have access.
- If a task has a risk score >= 85%, warn them.
- If the user wants to trigger rescue mode or an emergency plan, use the trigger_rescue_mode function.
- If the user wants to delete a task, use the delete_task function.
- If the user wants to add a task, use the create_task function.
- If the user wants to update a task, use the update_task function.
- If the user wants to mark a task complete, use the mark_task_complete function.
- If the user wants to validate proofs, use the validate_proof function.
- If the user wants to view their calendar, just tell them their tasks from the context.
- If you call a function, you don't need to return a widget manually, the system will handle it.`;

    const tools = [{
      functionDeclarations: [
        {
          name: 'trigger_rescue_mode',
          description: 'Activates emergency Rescue Mode for the user.',
          parameters: { type: 'OBJECT', properties: { reason: { type: 'STRING' } }, required: ['reason'] }
        },
        {
          name: 'create_task',
          description: 'Creates a new academic task for the user.',
          parameters: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              category: { type: 'STRING' },
              deadline: { type: 'STRING' },
              estimatedHours: { type: 'NUMBER' },
              priority: { type: 'STRING' }
            },
            required: ['title', 'category', 'deadline', 'estimatedHours', 'priority']
          }
        },
        {
          name: 'update_task',
          description: 'Updates an existing task by its ID.',
          parameters: {
            type: 'OBJECT',
            properties: {
              taskId: { type: 'STRING' },
              title: { type: 'STRING' },
              estimatedHours: { type: 'NUMBER' },
              deadline: { type: 'STRING' }
            },
            required: ['taskId']
          }
        },
        {
          name: 'delete_task',
          description: 'Deletes a task by its ID.',
          parameters: { type: 'OBJECT', properties: { taskId: { type: 'STRING' } }, required: ['taskId'] }
        },
        {
          name: 'mark_task_complete',
          description: 'Marks a task as completed by its ID.',
          parameters: { type: 'OBJECT', properties: { taskId: { type: 'STRING' } }, required: ['taskId'] }
        },
        {
          name: 'validate_proof',
          description: 'Simulates proof validation or brings up the proof tab context.',
          parameters: { type: 'OBJECT', properties: { taskId: { type: 'STRING' } }, required: ['taskId'] }
        }
      ]
    }];

    const formattedHistory = history.map(msg => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts || [{ text: msg.text || msg.content }]
    }));

    const contents = [...formattedHistory, { role: 'user', parts: [{ text: message }] }];

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: { systemInstruction, tools }
    });

    let functionCall = null;
    let textBuffer = "";

    for await (const chunk of responseStream) {
      if (chunk.functionCalls && chunk.functionCalls.length > 0) {
        functionCall = chunk.functionCalls[0];
        break; // Stop streaming text if a function is called
      }
      if (chunk.text) {
        textBuffer += chunk.text;
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    if (functionCall) {
      let functionResult = {};
      let widgetPayload = null;
      const { name, args } = functionCall;

      if (name === 'trigger_rescue_mode') {
        const fullTasks = await Task.find({ userId: req.user._id, status: { $nin: ['completed', 'missed'] }, deadline: { $gte: new Date() } }).sort({ deadline: 1 });
        const orchestratorResult = await runRescueOrchestrator(req.user, fullTasks, args.reason || "Manual Assistant Trigger");
        await AcademicPlan.updateMany({ userId: req.user._id }, { active: false });
        const newPlan = await AcademicPlan.create({
          userId: req.user._id,
          triggerReason: args.reason || "Manual Assistant Trigger",
          tasksInvolved: fullTasks.map(t => t._id),
          currentRiskScore: fullTasks.length > 0 ? Math.max(...fullTasks.map(t => t.riskScore)) : 0,
          whatToDoRightNow: orchestratorResult.whatToDoRightNow,
          immediateTriageSteps: (orchestratorResult.immediateTriageSteps || []).map(action => ({ action, completed: false })),
          strictSchedule: orchestratorResult.strictSchedule,
          projectedRiskDrop: orchestratorResult.projectedRiskDrop,
          active: true
        });
        functionResult = { success: true, message: "Rescue Mode activated successfully." };
        widgetPayload = { type: 'rescuePlan', data: { whatToDoRightNow: newPlan.whatToDoRightNow, projectedRiskDrop: newPlan.projectedRiskDrop } };
      } else if (name === 'create_task') {
         const task = await Task.create({ userId: req.user._id, ...args });
         functionResult = { success: true, taskId: task._id };
         widgetPayload = { type: 'taskCard', data: task };
      } else if (name === 'delete_task') {
         await Task.findOneAndDelete({ _id: args.taskId, userId: req.user._id });
         functionResult = { success: true, message: "Task deleted" };
      } else if (name === 'update_task') {
         const updated = await Task.findOneAndUpdate({ _id: args.taskId, userId: req.user._id }, { $set: args }, { new: true });
         functionResult = { success: true, taskId: updated._id };
         widgetPayload = { type: 'taskCard', data: updated };
      } else if (name === 'mark_task_complete') {
         await Task.findOneAndUpdate({ _id: args.taskId, userId: req.user._id }, { status: 'completed' });
         functionResult = { success: true, message: "Task marked complete" };
      } else if (name === 'validate_proof') {
         await Task.findOneAndUpdate({ _id: args.taskId, userId: req.user._id }, { proofStatus: 'PENDING_REVIEW' });
         functionResult = { success: true, message: "Proof submitted for validation" };
      }

      if (widgetPayload) {
        res.write(`data: ${JSON.stringify({ widget: widgetPayload })}\n\n`);
      }

      const followUpContents = [
        ...contents,
        { role: 'model', parts: [{ functionCall }] },
        { role: 'user', parts: [{ functionResponse: { name, response: functionResult } }] }
      ];

      const followUpStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: followUpContents,
        config: { systemInstruction }
      });

      for await (const chunk of followUpStream) {
        if (chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    } else {
       // Custom widget parsing for text-only messages
       if (message.toLowerCase().includes("show my tasks") || message.toLowerCase().includes("what do i have due")) {
           res.write(`data: ${JSON.stringify({ widget: { type: 'taskList', data: context.tasks } })}\n\n`);
       }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (error) {
    console.error("Assistant Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to communicate with Guardian AI." });
    } else {
      res.write(`data: ${JSON.stringify({ text: "\n\n(Error: Connection to neural network interrupted)" })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
};

module.exports = { chat };
