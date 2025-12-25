import { base44 } from "@/api/base44Client";
import { calculateStreak } from "@/components/utils";

export const checkAndAwardBadges = async (userId, actionType, data = {}) => {
  try {
    // 1. Fetch current badges to avoid duplicates
    const existingBadges = await base44.entities.Badge.filter({ user_id: userId });
    const earnedBadgeTypes = new Set(existingBadges.map(b => b.badge_type));
    const newBadges = [];

    // 2. Fetch User & Submissions if needed
    let submissions = [];
    if (['submission', 'graded', 'login'].includes(actionType)) {
      submissions = await base44.entities.Submission.filter({ student_id: userId });
    }

    // Helper to award badge
    const award = async (type) => {
      if (!earnedBadgeTypes.has(type)) {
        await base44.entities.Badge.create({
          user_id: userId,
          badge_type: type,
          earned_at: new Date().toISOString()
        });
        newBadges.push(type);
        earnedBadgeTypes.add(type); // Prevent double awarding in same run
      }
    };

    // 3. Logic based on Action

    // --- First Submission ---
    if (actionType === 'submission') {
      if (submissions.length >= 1) {
        await award('first_submission');
      }
      
      // Early Bird Check (submitted before due date)
      if (data.assignment && data.assignment.due_date) {
        const dueDate = new Date(data.assignment.due_date);
        const submittedAt = new Date(); // now
        // If submitted at least 24h before due date
        if (dueDate - submittedAt > 86400000) {
           // We need to count early submissions. This is complex to track without a separate counter.
           // For now, let's just award 'early_bird' if they have 5 submissions (simplification or need to check all)
           // Let's iterate submissions and check.
           let earlyCount = 0;
           // We need assignments for all submissions to check... might be expensive.
           // Simplified: Just check current one for now, but to be accurate we'd need more data.
           // Let's skip complex 'early_bird' logic for now to ensure speed, or implement if simple.
        }
      }
    }

    // --- Perfect Score ---
    if (actionType === 'graded') {
      if (data.score === data.maxScore && data.maxScore > 0) {
        await award('perfect_score');
      }
      
      // Quiz Master Logic
      if (data.assignmentType === 'quiz' && data.score === data.maxScore) {
          // Check past quizzes
          const pastQuizzes = submissions.filter(s => {
              // Note: We need assignment details for all submissions to verify type='quiz'
              // This is a simplified check assuming we passed assignmentType or check elsewhere.
              // For accuracy in this simplified function, we rely on the counter.
              // In a real app, we'd join tables or fetch assignments.
              return s.status === 'graded'; 
          });
          // Assuming we want to award if they hit 3 perfect quizzes. 
          // Since we don't have full history here easily without fetching assignments, 
          // we will rely on the Retroactive check for the full logic, 
          // or assume this is the 3rd one if we tracked it.
          // For now, let's allow the retroactive check to handle the heavy lifting 
          // or do a lightweight check if possible.
      }
    }

    // --- Streaks (Checked on submission or login) ---
    if (['submission', 'login'].includes(actionType)) {
      const { current } = calculateStreak(submissions);
      
      if (current >= 3) await award('streak_3');
      if (current >= 7) await award('streak_7');
      if (current >= 30) await award('streak_30');
    }

    // --- Champion (Coins) ---
    // We can pass current coins in data or fetch user
    let userCoins = data.coins;
    if (userCoins === undefined) {
       const user = await base44.entities.PublicProfile.filter({ user_id: userId });
       if (user.length > 0) userCoins = user[0].coins;
    }

    if (userCoins >= 1000) await award('champion');

    // --- Top Student (Passed via data) ---
    if (actionType === 'rank_check') {
        if (data.isTopStudent) await award('top_student');
        if (data.isClassChampion) await award('class_champion');
    }

    return newBadges;

  } catch (error) {
    console.error("Error checking badges:", error);
    return [];
  }
};

export const checkAllRetroactiveBadges = async (userId) => {
  try {
    const [submissions, existingBadges, userProfile] = await Promise.all([
      base44.entities.Submission.filter({ student_id: userId }, "-created_date", 1000),
      base44.entities.Badge.filter({ user_id: userId }, "-earned_at", 1000),
      base44.entities.PublicProfile.filter({ user_id: userId })
    ]);

    // Fetch assignments related to the user's grade to optimize
    let assignments = [];
    if (userProfile[0] && userProfile[0].grade) {
       assignments = await base44.entities.Assignment.filter({ grade: userProfile[0].grade });
    } else {
       assignments = await base44.entities.Assignment.list();
    }
    
    const assignmentMap = {};
    assignments.forEach(a => assignmentMap[a.id] = a);

    const earnedTypes = new Set(existingBadges.map(b => `${b.badge_type}_${b.tier || 'bronze'}`));
    const newBadges = [];
    
    const award = async (type, tier = 'bronze') => {
       const key = `${type}_${tier}`;
       if (!earnedTypes.has(key)) {
         await base44.entities.Badge.create({
           user_id: userId,
           badge_type: type,
           tier: tier,
           earned_at: new Date().toISOString()
         });
         newBadges.push({ type, tier });
         earnedTypes.add(key);
       }
    };

    // --- Logic ---
    
    // 1. Submissions Count (First Submission)
    if (submissions.length > 0) await award('first_submission');

    // 2. Iterative Checks
    let perfectScores = 0;
    let earlySubmissions = 0;
    let totalScore = 0;
    let gradedCount = 0;
    let mathScores = [];
    let scienceScores = [];
    let perfectQuizzes = 0;

    submissions.forEach(sub => {
        const assignment = assignmentMap[sub.assignment_id];
        if (assignment) {
             // Max Score Check
             const maxScore = assignment.max_score || 20;
             if (sub.status === 'graded' && sub.score === maxScore && maxScore > 0) {
                 perfectScores++;
                 if (assignment.type === 'quiz') {
                     perfectQuizzes++;
                 }
             }
             
             // Average & Subject Mastery
             if (sub.status === 'graded' && typeof sub.score === 'number') {
                 const normalizedScore = (sub.score / maxScore) * 20;
                 totalScore += normalizedScore;
                 gradedCount++;

                 if (assignment.subject === 'ریاضی') mathScores.push(normalizedScore);
                 if (assignment.subject === 'علوم') scienceScores.push(normalizedScore);
             }

             // Early Bird
             if (assignment.due_date && sub.submitted_at) {
                 const due = new Date(assignment.due_date);
                 const submitted = new Date(sub.submitted_at);
                 // Check if valid dates
                 if (!isNaN(due) && !isNaN(submitted)) {
                     if (due.getTime() - submitted.getTime() > 86400000) {
                         earlySubmissions++;
                     }
                 }
             }
        }
    });

    // Perfect Score (Tiered)
    if (perfectScores >= 1) await award('perfect_score', 'bronze');
    if (perfectScores >= 5) await award('perfect_score', 'silver');
    if (perfectScores >= 10) await award('perfect_score', 'gold');
    
    // Early Bird (Tiered)
    if (earlySubmissions >= 3) await award('early_bird', 'bronze');
    if (earlySubmissions >= 7) await award('early_bird', 'silver');
    if (earlySubmissions >= 15) await award('early_bird', 'gold');

    // Consistent (Avg > 15, min 3 assignments)
    if (gradedCount >= 3) {
        if ((totalScore / gradedCount) >= 15) await award('consistent');
    }

    // Math Master (Avg > 18, min 3)
    if (mathScores.length >= 3) {
        const avg = mathScores.reduce((a,b)=>a+b,0) / mathScores.length;
        if (avg >= 18) await award('math_master');
    }

    // Science Master (Avg > 18, min 3)
    if (scienceScores.length >= 3) {
        const avg = scienceScores.reduce((a,b)=>a+b,0) / scienceScores.length;
        if (avg >= 18) await award('science_master');
    }

    // Streaks (Tiered)
    const { longest } = calculateStreak(submissions);
    if (longest >= 3) await award('streak_3', 'bronze');
    if (longest >= 7) await award('streak_7', 'silver');
    if (longest >= 30) await award('streak_30', 'gold');

    // Champion (Coins)
    const coins = userProfile[0]?.coins || 0;
    if (coins >= 1000) await award('champion');

    // Quiz Master
    if (perfectQuizzes >= 3) await award('quiz_master');

    // Social Butterfly (Simulated by generic activity for now, or use message count if available)
    // For now we'll skip complex message counting here to avoid performance hit
    
    return newBadges;

  } catch (e) {
    console.error("Retroactive check error:", e);
    return [];
  }
};