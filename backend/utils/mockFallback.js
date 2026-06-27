const generateMockFallback = (task) => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const hoursRemaining = Math.max(0, ((deadline - now) / (1000 * 60 * 60)));
  
  now.setHours(0,0,0,0);
  deadline.setHours(0,0,0,0);
  const daysUntilDeadline = Math.max(0, Math.round((deadline - now) / (1000 * 60 * 60 * 24)));
  
  let riskScore = 20;
  
  // Calculate dynamic risk score based on task details
  if (daysUntilDeadline <= 1 || hoursRemaining < task.estimatedHours) {
    riskScore = 85;
  } else if (daysUntilDeadline <= 3) {
    riskScore = 65;
  } else if (daysUntilDeadline <= 7) {
    riskScore = 40;
  } else {
    riskScore = 20;
  }

  // Strictly enforce severity mapping
  let riskSeverity = 'Low';
  if (riskScore >= 71) {
    riskSeverity = 'High';
  } else if (riskScore >= 31) {
    riskSeverity = 'Medium';
  } else {
    riskSeverity = 'Low';
  }

  // Urgency mapping
  let urgency = 'Low';
  if (daysUntilDeadline <= 1 || hoursRemaining < task.estimatedHours) urgency = 'Critical';
  else if (daysUntilDeadline <= 3) urgency = 'High';
  else if (daysUntilDeadline <= 7) urgency = 'Medium';

  const completionProb = 100 - riskScore + 5;
  const isEmergency = hoursRemaining < task.estimatedHours;
  const recommendedTime = isEmergency ? Math.max(0.5, (hoursRemaining * 0.9)).toFixed(1) : task.estimatedHours;

  const mockTimeline = [
    {
      agent: "Planner",
      stepType: "Strategy",
      message: JSON.stringify({
        "subtasks": isEmergency ? [
          `Triage: Identify bare minimum requirements for ${task.title} (0.2 hr)`,
          `Rapid Drafting / Implementation of core logic`,
          `Final Code/Document Assembly (0.5 hr)`
        ] : [
          `Understand Requirements for ${task.title} (0.5 hr)`,
          `Review Core Concepts related to ${task.category || 'topic'} (1.0 hr)`,
          `Draft Initial Solution/Outline (2.0 hrs)`,
          `Implement Final Solution (2.0 hrs)`,
          `Test and Refine (1.0 hr)`,
          `Final Review (0.5 hr)`
        ],
        "timeline": isEmergency ? 
          `EMERGENCY: Allocate ${recommendedTime} hours of continuous hyper-focus immediately to finish before the deadline.` :
          `Allocate ${recommendedTime} hours of focused work before the deadline ${daysUntilDeadline === 0 ? 'today' : `in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'}`}.`,
        "recommendations": isEmergency ? [
          "Skip all non-essential requirements.",
          "Do not polish. Submit a functional draft."
        ] : [
          "Start by thoroughly reading the prompt.",
          "Break down complex problems into smaller parts."
        ]
      }, null, 2)
    },
    {
      agent: "Realist",
      stepType: "Critique",
      message: JSON.stringify({
        "bottlenecks": [
          isEmergency ? "There is not enough time to complete the original estimated hours." : "Conceptual challenges might require more review time.",
          "Debugging or refinement often takes longer than anticipated."
        ],
        "adjustments": [
          isEmergency ? "Cut scope by 50% immediately." : "Allocate an additional 20% buffer time for debugging.",
          "Strongly recommend a preliminary review immediately."
        ]
      }, null, 2)
    },
    {
      agent: "Risk",
      stepType: "Analysis",
      message: JSON.stringify({
        riskScore: riskScore,
        probabilityOfFailure: riskScore > 80 ? riskScore - 10 : 5,
        keyRisks: [
          isEmergency ? `SEVERE: Only ${hoursRemaining.toFixed(1)} hours remaining for an ${task.estimatedHours}-hour task.` : (daysUntilDeadline === 0 ? "Deadline is today." : `Deadline is ${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} away.`),
          "Potential underestimation of assignment complexity.",
          "Procrastination risks."
        ],
        mitigation: [
          isEmergency ? "Submit partial work before the deadline hits." : "Start preliminary review immediately.",
          "Set an earlier artificial deadline for drafts."
        ]
      }, null, 2)
    },
    {
      agent: "Coordinator",
      stepType: "Final Plan",
      message: JSON.stringify({
        schedule: isEmergency ? [
          "Phase 1: Bare Minimum Implementation (Target 80% of remaining time, NOW)",
          "Phase 2: Submission Packaging (Target 20% of remaining time)"
        ] : [
          "Phase 1: Understanding & Initial Design (Target 20% of time, Today)",
          "Phase 2: Implementation (Target 50% of time)",
          "Phase 3: Testing & Refinement (Target 30% of time)"
        ],
        keyAdvice: [
          isEmergency ? "Do not aim for perfection. Aim for submission." : "Start early to utilize the available time.",
          isEmergency ? "If time runs out, submit what you have." : "Focus heavily on the initial design phase."
        ]
      }, null, 2)
    }
  ];

  const mockSummary = {
    plannerConfidence: 85,
    realistConfidence: 75,
    riskScore: riskScore,
    riskSeverity: riskSeverity,
    estimatedCompletionProbability: completionProb > 100 ? 99 : completionProb,
    recommendedStartTime: 'Today',
    deadlineUrgency: urgency,
    finalRecommendation: 'Begin Phase 1 immediately and complete the initial design work today to maintain a low-risk trajectory.'
  };

  return { mockTimeline, mockSummary };
};

module.exports = { generateMockFallback };
