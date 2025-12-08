import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export const applySubmissionRules = async (submission, assignment) => {
  try {
    if (!assignment.teacher_id) return;

    // Fetch active rules for the teacher
    const rules = await base44.entities.ScoringRule.filter({
      teacher_id: assignment.teacher_id,
      is_active: true,
      type: "early_submission"
    });

    if (rules.length === 0) return;

    const dueDate = new Date(assignment.due_date);
    const submittedAt = new Date(submission.submitted_at);
    
    // Calculate hours before deadline
    const hoursBefore = (dueDate - submittedAt) / (1000 * 60 * 60);

    let totalBonus = 0;
    const triggeredRules = [];

    for (const rule of rules) {
      if (hoursBefore >= rule.value) {
        totalBonus += rule.points;
        triggeredRules.push(rule.title);
      }
    }

    if (totalBonus > 0) {
      const userProfile = await base44.entities.PublicProfile.filter({ user_id: submission.student_id });
      if (userProfile.length > 0) {
        const currentCoins = userProfile[0].coins || 0;
        await base44.entities.PublicProfile.update(userProfile[0].id, {
          coins: currentCoins + totalBonus
        });
        
        // Log activity or notify
        toast.success(`تبریک! ${totalBonus} امتیاز برای "${triggeredRules.join('، ')}" دریافت کردید.`);
      }
    }
  } catch (error) {
    console.error("Error applying submission rules:", error);
  }
};

export const applyGradingRules = async (submission, assignment) => {
  try {
    if (!assignment.teacher_id || submission.score === null) return;

    const rules = await base44.entities.ScoringRule.filter({
      teacher_id: assignment.teacher_id,
      is_active: true
    });

    const scoreRules = rules.filter(r => ["score_threshold", "perfect_score"].includes(r.type));
    if (scoreRules.length === 0) return;

    const scorePercent = (submission.score / assignment.max_score) * 100;
    
    let totalBonus = 0;
    const triggeredRules = [];

    for (const rule of scoreRules) {
      let triggered = false;
      
      if (rule.type === "perfect_score" && submission.score === assignment.max_score) {
        triggered = true;
      } else if (rule.type === "score_threshold" && scorePercent >= rule.value) {
        triggered = true;
      }

      if (triggered) {
        totalBonus += rule.points;
        triggeredRules.push(rule.title);
      }
    }

    if (totalBonus > 0) {
      const userProfile = await base44.entities.PublicProfile.filter({ user_id: submission.student_id });
      if (userProfile.length > 0) {
        const currentCoins = userProfile[0].coins || 0;
        await base44.entities.PublicProfile.update(userProfile[0].id, {
          coins: currentCoins + totalBonus
        });
        
        // Note: Since this runs on teacher's side, toast might not reach student directly, 
        // but we update the coins which is the important part.
        console.log(`Awarded ${totalBonus} points to student for rules: ${triggeredRules.join(', ')}`);
      }
    }
  } catch (error) {
    console.error("Error applying grading rules:", error);
  }
};