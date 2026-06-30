const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  estimatedHours: { type: Number, required: true },
  actualHours: { type: Number, default: 0 },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'missed'],
    default: 'pending',
    required: true
  },
  category: {
    type: String,
    default: 'Work'
  },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  completionProbability: { type: Number, default: 100, min: 0, max: 100 },
  subTasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  aiPlan: { type: String },
  finalSchedule: { type: String },
  proofStatus: { 
    type: String, 
    enum: ['NOT_SUBMITTED', 'PENDING_REVIEW', 'VALID', 'PARTIAL', 'INVALID'],
    default: 'NOT_SUBMITTED'
  },
  proofCount: { type: Number, default: 0 },
  lastProofSubmittedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
