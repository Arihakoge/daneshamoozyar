import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { 
  ArrowRight, CheckCircle, BookOpen, Zap, Clock, Play
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toPersianNumber } from "@/components/utils";

export default function ViewLesson() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stage, setStage] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  const urlParams = new URLSearchParams(window.location.search);
  const stageId = urlParams.get("stageId");
  const pathId = urlParams.get("pathId");

  useEffect(() => {
    if (stageId) loadLesson();
  }, [stageId]);

  const loadLesson = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [stageData, progressData] = await Promise.all([
        base44.entities.PathStage.filter({ id: stageId }),
        base44.entities.StudentProgress.filter({ student_id: currentUser.id, stage_id: stageId })
      ]);

      setStage(stageData[0] || null);
      setProgress(progressData[0] || null);
      setCompleted(progressData[0]?.status === "completed");
    } catch (error) {
      console.error("Error loading lesson:", error);
    }
    setLoading(false);
  };

  const completeLesson = async () => {
    if (completed) {
      navigate(createPageUrl(`PathDetail?id=${pathId}`));
      return;
    }

    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const xpEarned = stage?.xp_reward || 50;
      const coinsEarned = stage?.coins_reward || 10;

      // Update progress
      if (progress) {
        await base44.entities.StudentProgress.update(progress.id, {
          status: "completed",
          score: 100,
          xp_earned: xpEarned,
          coins_earned: coinsEarned,
          completed_at: new Date().toISOString(),
          time_spent: timeSpent
        });
      }

      // Unlock next stage
      if (pathId) {
        const allStages = await base44.entities.PathStage.filter({ path_id: pathId });
        const sortedStages = allStages.sort((a, b) => a.order - b.order);
        const currentStageIndex = sortedStages.findIndex(s => s.id === stageId);
        
        if (currentStageIndex < sortedStages.length - 1) {
          const nextStage = sortedStages[currentStageIndex + 1];
          const nextProgress = await base44.entities.StudentProgress.filter({
            student_id: user.id,
            stage_id: nextStage.id
          });

          if (nextProgress.length === 0) {
            await base44.entities.StudentProgress.create({
              student_id: user.id,
              path_id: pathId,
              stage_id: nextStage.id,
              status: "unlocked"
            });
          } else if (nextProgress[0].status === "locked") {
            await base44.entities.StudentProgress.update(nextProgress[0].id, {
              status: "unlocked"
            });
          }
        }
      }

      // Update user coins
      await base44.auth.updateMe({
        coins: (user.coins || 0) + coinsEarned
      });

      setCompleted(true);
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری درس...</p>
        </div>
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center clay-card p-8">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">درسی یافت نشد</h2>
          <Button onClick={() => navigate(createPageUrl(`PathDetail?id=${pathId}`))}>
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate(createPageUrl(`PathDetail?id=${pathId}`))}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
      >
        <ArrowRight className="w-5 h-5" />
        بازگشت به مسیر
      </button>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="clay-card p-6 mb-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{stage.title}</h1>
            {stage.description && (
              <p className="text-gray-400">{stage.description}</p>
            )}
          </div>
          {completed && (
            <div className="flex items-center gap-2 text-green-400 bg-green-900/30 px-3 py-1 rounded-full">
              <CheckCircle className="w-5 h-5" />
              <span>تکمیل شده</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-yellow-400">
            <Zap className="w-4 h-4" />
            <span>{toPersianNumber(stage.xp_reward || 50)} XP</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span>🪙 {toPersianNumber(stage.coins_reward || 10)} سکه</span>
          </div>
          {stage.time_limit && (
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span>حدود {toPersianNumber(stage.time_limit)} دقیقه</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="clay-card">
          <CardContent className="p-6">
            <div className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold text-white mt-6 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold text-white mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-300">{children}</li>,
                  strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                  em: ({ children }) => <em className="text-purple-300">{children}</em>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-r-4 border-purple-500 pr-4 my-4 text-gray-400 italic">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-800 px-2 py-1 rounded text-purple-300 text-sm">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto my-4">
                      {children}
                    </pre>
                  ),
                }}
              >
                {stage.content || "محتوایی برای این درس تعریف نشده است."}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Complete Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <Button 
          onClick={completeLesson}
          size="lg"
          className={`w-full ${completed ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}`}
        >
          {completed ? (
            <>
              <CheckCircle className="w-5 h-5 ml-2" />
              بازگشت به مسیر
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 ml-2" />
              درس را خواندم - ادامه
            </>
          )}
        </Button>
      </motion.div>

      {/* Rewards Info */}
      {!completed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="clay-card p-4 mt-4 bg-yellow-900/30 text-center"
        >
          <p className="text-yellow-300">
            با تکمیل این درس <span className="font-bold">{toPersianNumber(stage.xp_reward || 50)} XP</span> و 
            <span className="font-bold"> 🪙 {toPersianNumber(stage.coins_reward || 10)} سکه</span> دریافت می‌کنی!
          </p>
        </motion.div>
      )}
    </div>
  );
}