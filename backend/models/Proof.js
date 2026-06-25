const mongoose = require('mongoose');

const proofSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  imageUrl: { type: String },
  content: { type: String },
  validationStatus: { 
    type: String, 
    enum: ['VALID', 'PARTIAL', 'INVALID', 'PENDING_REVIEW'], 
    required: true 
  },
  confidence: { type: Number, min: 0, max: 100 },
  validationReason: { type: String },
  observations: [{ type: String }],
  qualityGrade: { type: String, enum: ["A", "B", "C", "D", "F"] }
}, { timestamps: true });

module.exports = mongoose.model('Proof', proofSchema);
