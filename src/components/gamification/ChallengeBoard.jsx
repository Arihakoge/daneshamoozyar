import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Gift, Zap, BookOpen, MessageCircle } from "lucide-react";
import { toPersianNumber } from "@/components/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { DAILY_TASKS_DEFINITIONS } from "@/components/gamification/ChallengeUtils";

export default function ChallengeBoard({ currentUser }) {
  const [dailyState, setDailyState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyChallenge();
  }, [currentUser]);

  const loadDailyChallenge = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const challenges = await base44.entities.DailyChallenge.filter({
        user_id: currentUser.id,
        date: today
      });

      let currentChallenge;
      if (challenges.length > 0) {
        currentChallenge = challenges[0];
      } else {
        // Create new record for today if checking logic happens elsewhere or initialize here
        // Usually creation happens on first action, but we can init display
        currentChallenge = {
           user_id: currentUser.id,
           date: today,
           progress: { login: true }, // Auto complete login if they are here
           claimed: {}
        };
        // We don't necessarily create the entity here to avoid spam, 
        // but we can render based on this transient state.
        // If we want to persist the 'login' immediately:
        await base44.entities.DailyChallenge.create(currentChallenge);
      }
      setDailyState(currentChallenge);
    } catch (error) {
      console.error("Error loading daily challenges:", error);
    }
    setLoading(false);
  };

  const handleClaim = async (taskId) => {
    if (!dailyState || dailyState.claimed[taskId]) return;
    
    try {
       const task = DAILY_TASKS_DEFINITIONS.find(t => t.id === taskId);
       const today = new Date().toISOString().split("T")[0];
       
       // Update remote
       // Since we might have fetched a transient object or existing one, we need to be careful.
       // Re-fetch to get ID is safest or rely on logic.
       const existing = await base44.entities.DailyChallenge.filter({
           user_id: currentUser.id, 
           date: today
       });
       
       let challengeId;
       let currentClaimed = {};
       
       if (existing.length > 0) {
           challengeId = existing[0].id;
           currentClaimed = existing[0].claimed || {};
       } else {
           // Should exist from load, but fallback
           const res = await base44.entities.DailyChallenge.create({
               user_id: currentUser.id, 
               date: today,
               progress: { login: true, [taskId]: true },
               claimed: {}
           });
           challengeId = res.id;
       }
       
       // Update User Coins
       await base44.auth.updateMe({
           coins: (currentUser.coins || 0) + task.reward
       });

       // Update Challenge Entity
       const newClaimed = { ...currentClaimed, [taskId]: true };
       await base44.entities.DailyChallenge.update(challengeId, {
           claimed: newClaimed
       });

       setDailyState(prev => ({
           ...prev,
           claimed: newClaimed
       }));

       confetti({
         particleCount: 100,
         spread: 70,
         origin: { y: 0.6 }
       });
       
       toast.success(`${toPersianNumber(task.reward)} سکه دریافت شد!`);

    } catch (error) {
       console.error("Claim error:", error);
       toast.error("خطا در دریافت پاداش");
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-400">در حال بارگیری چالش‌ها...</div>;

  const completedCount = dailyState ? Object.keys(dailyState.progress || {}).length : 0;
  const progressPercent = (completedCount / DAILY_TASKS_DEFINITIONS.length) * 100;

  return (
    <div className="space-y-6">
       <div className="clay-card p-6 bg-gradient-to-r from-indigo-900 to-purple-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progressPercent}%` }}
               className="h-full bg-green-500"
             />
          </div>
          
          <div className="flex justify-between items-center mb-6 mt-2">
             <h2 className="text-2xl font-bold text-white flex items-center gap-2">
               <Zap className="text-yellow-400" />
               چالش‌های روزانه
             </h2>
             <div className="text-sm text-gray-300">
                {toPersianNumber(completedCount)} از {toPersianNumber(DAILY_TASKS_DEFINITIONS.length)} تکمیل شده
             </div>
          </div>

          <div className="grid gap-4">
             {DAILY_TASKS_DEFINITIONS.map(task => {
                const isCompleted = dailyState?.progress?.[task.id];
                const isClaimed = dailyState?.claimed?.[task.id];
                const Icon = task.icon;

                return (
                   <motion.div 
                     key={task.id}
                     whileHover={{ scale: 1.01 }}
                     className={`p-4 rounded-xl border flex items-center gap-4 transition-colors ${
                         isCompleted 
                         ? "bg-slate-800/80 border-green-500/50" 
                         : "bg-slate-800/40 border-slate-700"
                     }`}
                   >
                      <div className={`p-3 rounded-full ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-gray-400'}`}>
                         <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                         <h3 className={`font-bold ${isCompleted ? 'text-white' : 'text-gray-400'}`}>{task.title}</h3>
                         <p className="text-xs text-gray-500">{task.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded">
                            <span className="text-sm">+{toPersianNumber(task.reward)}</span>
                            <span className="text-[10px]">سکه</span>
                         </div>
                         
                         {isClaimed ? (
                            <Button size="sm" variant="ghost" disabled className="text-green-500">
                               <CheckCircle2 className="w-5 h-5" />
                            </Button>
                         ) : isCompleted ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleClaim(task.id)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold animate-pulse"
                            >
                               دریافت
                            </Button>
                         ) : (
                            <div className="w-8 h-8 flex items-center justify-center">
                               <Circle className="w-5 h-5 text-gray-600" />
                            </div>
                         )}
                      </div>
                   </motion.div>
                );
             })}
          </div>
       </div>
    </div>
  );
}