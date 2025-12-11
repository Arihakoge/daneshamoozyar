import { base44 } from "@/api/base44Client";
import { Zap, BookOpen, MessageCircle, FileText } from "lucide-react";
import { toast } from "sonner";

export const DAILY_TASKS_DEFINITIONS = [
  { id: "login", title: "ورود روزانه", reward: 10, icon: Zap, description: "ورود به اپلیکیشن" },
  { id: "check_assignments", title: "بررسی تکالیف", reward: 15, icon: BookOpen, description: "باز کردن صفحه تکالیف" },
  { id: "send_message", title: "مشارکت کلاسی", reward: 20, icon: MessageCircle, description: "ارسال پیام در گروه کلاس" },
  { id: "submit_assignment", title: "ارسال تکلیف", reward: 30, icon: FileText, description: "ارسال موفق یک تکلیف" }
];

export async function updateDailyChallenge(userId, taskIds) {
  if (!userId) return;
  const ids = Array.isArray(taskIds) ? taskIds : [taskIds];
  const today = new Date().toISOString().split("T")[0];

  try {
    const existing = await base44.entities.DailyChallenge.filter({
      user_id: userId,
      date: today
    });

    let challenge;
    if (existing.length > 0) {
      challenge = existing[0];
    } else {
      // Create new if not exists
      challenge = await base44.entities.DailyChallenge.create({
        user_id: userId,
        date: today,
        progress: { login: true }, // Auto login
        claimed: {}
      });
    }

    const currentProgress = challenge.progress || {};
    let hasUpdates = false;

    // Check which tasks are new completions
    const updates = {};
    ids.forEach(id => {
      // Validate task ID against definitions
      const def = DAILY_TASKS_DEFINITIONS.find(t => t.id === id);
      if (def && !currentProgress[id]) {
        updates[id] = true;
        hasUpdates = true;
        toast.success(`چالش "${def.title}" تکمیل شد!`);
      }
    });

    if (hasUpdates) {
      await base44.entities.DailyChallenge.update(challenge.id, {
        progress: { ...currentProgress, ...updates }
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating daily challenge:", error);
    return false;
  }
}