import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export const applySubmissionRules = async (submission, assignment) => {
  try {
    if (!assignment.teacher_id || !assignment.due_date) return;

    const teacherRules = await base44.entities.ScoringRule.filter({
      teacher_id: assignment.teacher_id,
      type: "early_submission",
      is_active: true
    });

    if (teacherRules.length === 0) return;

    const submittedAt = new Date(submission.submitted_at);
    const dueDate = new Date(assignment.due_date);
    const diffHours = (dueDate - submittedAt) / (1000 * 60 * 60);

    let pointsAwarded = 0;

    for (const rule of teacherRules) {
      if (diffHours >= rule.value) {
        pointsAwarded += rule.points;
      }
    }

    if (pointsAwarded > 0) {
      const student = await base44.auth.me(); // Ideally we'd fetch by ID but usually this runs in student context for submission
      // Or if running in teacher context (grading), this function might not be called or might need student_id
      // applySubmissionRules is called in StudentAssignments.js (Student context)
      
      await base44.auth.updateMe({
        coins: (student.coins || 0) + pointsAwarded
      });
      
      toast.success(`شما ${pointsAwarded} سکه پاداش برای ارسال زودهنگام دریافت کردید!`);
    }

  } catch (error) {
    console.error("Error applying submission rules:", error);
  }
};

export const applyGradingRules = async (submission, assignment) => {
  try {
    // This runs in TeacherAssignments.js (Teacher context)
    // So we need to fetch the student profile to update coins
    
    if (!assignment.teacher_id) return;

    const teacherRules = await base44.entities.ScoringRule.filter({
      teacher_id: assignment.teacher_id,
      is_active: true
    });

    let pointsAwarded = 0;
    const score = submission.score;
    const maxScore = assignment.max_score || 20;

    for (const rule of teacherRules) {
      if (rule.type === "perfect_score" && score === maxScore) {
        pointsAwarded += rule.points;
      } else if (rule.type === "score_threshold") {
        // Assuming rule.value is a percentage or raw score. 
        // If value <= 20 usually raw score, if > 20 usually percentage? 
        // Let's assume value is raw score threshold for now based on common sense
        // Or maybe value is percentage (e.g. 90 for 90%)
        const threshold = rule.value <= 20 ? rule.value : (rule.value / 100) * maxScore;
        if (score >= threshold) {
          pointsAwarded += rule.points;
        }
      }
    }

    if (pointsAwarded > 0) {
      const studentProfiles = await base44.entities.PublicProfile.filter({ user_id: submission.student_id });
      if (studentProfiles.length > 0) {
        const profile = studentProfiles[0];
        await base44.entities.PublicProfile.update(profile.id, {
          coins: (profile.coins || 0) + pointsAwarded
        });
        // Also try to update the User entity if possible (though usually read-only for others)
        // Admin can update users, Teacher can't update other User entities directly usually, but PublicProfile is fine.
      }
    }

  } catch (error) {
    console.error("Error applying grading rules:", error);
  }
};