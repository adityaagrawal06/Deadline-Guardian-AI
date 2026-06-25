const mongoose = require('mongoose');

const academicPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  triggerReason: { type: String, required: true },
  tasksInvolved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  currentRiskScore: { type: Number },
  whatToDoRightNow: { type: String },
  immediateTriageSteps: [{
    action: String,
    completed: { type: Boolean, default: false }
  }],
  strictSchedule: [{
    time: String,
    action: String
  }],
  projectedRiskDrop: { type: Number },
  active: { type: Boolean, default: true },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AcademicPlan', academicPlanSchema);
