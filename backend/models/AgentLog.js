const mongoose = require('mongoose');

const agentLogSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  timeline: [{
    agent: String,
    stepType: String, // 'plan', 'critique', 'analysis', 'decision'
    message: String,
    rawOutput: mongoose.Schema.Types.Mixed
  }],
  summary: {
    plannerConfidence: Number,
    realistConfidence: Number,
    riskSeverity: String,
    finalRecommendation: String
  }
}, { timestamps: true });

module.exports = mongoose.model('AgentLog', agentLogSchema);
