const Proof = require('../models/Proof');
const Task = require('../models/Task');
const User = require('../models/User');
const { validateProofImage } = require('../services/VisionService');

// @desc    Upload and validate a proof for a task
// @route   POST /api/proofs
// @access  Private
const uploadProof = async (req, res) => {
  try {
    const { taskId, imageUrl, content } = req.body;

    if (!taskId || (!imageUrl && !content)) {
      return res.status(400).json({ message: 'Task ID and either Image URL or Content are required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Call VisionService to validate
    const validationResult = await validateProofImage(task, imageUrl, content);

    // User Rule: If confidence is >= 80%, force it to be VALID and completed
    if (validationResult.confidence >= 80) {
      validationResult.validationStatus = 'VALID';
    }

    // Create Proof record
    const proof = await Proof.create({
      taskId: task._id,
      imageUrl,
      content,
      validationStatus: validationResult.validationStatus,
      confidence: validationResult.confidence,
      validationReason: validationResult.validationReason,
      observations: validationResult.observations,
      qualityGrade: validationResult.qualityGrade
    });

    // Update Task proof status
    task.proofStatus = validationResult.validationStatus;
    task.proofCount += 1;
    task.lastProofSubmittedAt = new Date();
    
    let xpGained = 0;
    // Auto-update task overall status
    // User Rule: A or B grade auto-completes task
    if (validationResult.qualityGrade === 'A' || validationResult.qualityGrade === 'B' || validationResult.validationStatus === 'VALID') {
      if (task.status !== 'completed') {
        task.status = 'completed';
        xpGained = Math.round(task.estimatedHours * 20); // Base XP
        if (validationResult.qualityGrade === 'A') xpGained += 50; // Bonus
        else if (validationResult.qualityGrade === 'B') xpGained += 25; // Bonus
        
        const userDoc = await User.findById(req.user._id);
        userDoc.xp += xpGained;
        userDoc.level = Math.floor(userDoc.xp / 100) + 1;
        userDoc.currentStreak += 1;
        await userDoc.save();
      }
    } else if (validationResult.validationStatus === 'PARTIAL' && task.status === 'pending') {
      task.status = 'in_progress';
    }
    
    await task.save();

    res.status(201).json({
      proof,
      updatedTask: task
    });
  } catch (error) {
    res.status(500).json({ message: 'Proof validation failed', error: error.message });
  }
};

// @desc    Get proofs for a task
// @route   GET /api/proofs/:taskId
// @access  Private
const getProofs = async (req, res) => {
  try {
    const proofs = await Proof.find({ taskId: req.params.taskId }).sort({ createdAt: -1 });
    res.status(200).json(proofs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { uploadProof, getProofs };
