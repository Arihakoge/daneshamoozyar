import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Lock, CheckCircle, Play, Star, Zap, Trophy, 
  BookOpen, FileQuestion, Target, Clock, Award, Flame, ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toPersianNumber } from "@/components/utils";

const stageTypeConfig = {
  lesson: { icon: BookOpen, label: "درس", color: "from-blue-500 to-blue-600" },
  quiz: { icon: FileQuestion, label: "آزمون", color: "from-purple-500 to-purple-600" },
  assignment: { icon: Target, label: "تکلیف", color: "from-green-500 to-green-600" },
  challenge: { icon: Flame, label: "چالش", color: "from-orange-500 to-red-500" }
};

export default function PathDetail() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [path, setPath] = useState(null);
  const [stages, setStages] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const pathId = urlParams.get("id");

  useEffect(() => {
    if (pathId) loadData();
  }, [pathId]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [pathData, pathStages, userProgress] = await Promise.all([
        base44.entities.LearningPath.filter({ id: pathId }),
        base44.entities.PathStage.filter({ path_id: pathId }),
        base44.entities.StudentProgress.filter({ student_id: currentUser.id, path_id: pathId })
      ]);

      setPath(pathData[0] || null);
      setStages((pathStages || []).sort((a, b) => a.order - b.order));
      setProgress(userProgress || []);

      // Initialize progress for first stage if not exists
      if (pathStages?.length > 0 && (!userProgress || userProgress.length === 0)) {
        const firstStage = pathStages.sort((a, b) => a.order - b.order)[0];
        await base44.entities.StudentProgress.create({
          student_id: currentUser.id,
          path_id: pathId,
          stage_id: firstStage.id,
          status: "unlocked"
        });
        setProgress([{ student_id: currentUser.id, path_id: pathId, stage_id: firstStage.id, status: "unlocked" }]);
      }
    } catch (error) {
      console.error("Error loading path:", error);
    }
    setLoading(false);
  };

  const getStageStatus = (stageId) => {
    const stageProgress = progress.find(p => p.stage_id === stageId);
    return stageProgress?.status || "locked";
  };

  const getStageProgress = (stageId) => {
    return progress.find(p => p.stage_id === stageId);
  };

  const handleStartStage = async (stage) => {
    const status = getStageStatus(stage.id);
    if (status === "locked") return;

    // Update status to in_progress
    const existingProgress = getStageProgress(stage.id);
    if (existingProgress && existingProgress.status === "unlocked") {
      await base44.entities.StudentProgress.update(existingProgress.id, {
        status: "in_progress",
        attempts: (existingProgress.attempts || 0) + 1
      });
    }

    // Navigate to stage content
    if (stage.stage_type === "quiz") {
      navigate(createPageUrl(`TakeQuiz?stageId=${stage.id}&pathId=${pathId}`));
    } else if (stage.stage_type === "lesson") {
      navigate(createPageUrl(`ViewLesson?stageId=${stage.id}&pathId=${pathId}`));
    } else if (stage.stage_type === "assignment" && stage.assignment_id) {
      navigate(createPageUrl(`StudentAssignments?highlight=${stage.assignment_id}`));
    } else {
      navigate(createPageUrl(`ViewLesson?stageId=${stage.id}&pathId=${pathId}`));
    }
  };

  const totalXP = stages.reduce((sum, s) => sum + (s.xp_reward || 0), 0);
  const earnedXP = progress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);
  const completedCount = progress.filter(p => p.status === "completed").length;
  const overallProgress = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری...</p>
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white">مسیر یافت نشد</p>
          <Link to={createPageUrl("LearningPaths")}>
            <Button className="mt-4">بازگشت</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Back Button */}
      <Link to={createPageUrl("LearningPaths")} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
        <ArrowRight className="w-5 h-5" />
        بازگشت به مسیرها
      </Link>

      {/* Path Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="clay-card p-6 mb-8"
        style={{ borderTop: `4px solid ${path.color || '#8B5CF6'}` }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ background: `linear-gradient(135deg, ${path.color || '#8B5CF6'}, ${path.color || '#8B5CF6'}88)` }}
          >
            {path.subject === "ریاضی" ? "📐" : path.subject === "علوم" ? "🔬" : "📚"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{path.title}</h1>
            <p className="text-gray-400 mb-3">{path.description}</p>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-purple-600">{path.subject}</Badge>
              <Badge className="bg-blue-600">{path.grade}</Badge>
              <Badge className="bg-green-600">
                {toPersianNumber(stages.length)} مرحله
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="clay-card p-3 text-center bg-purple-900/30">
            <p className="text-2xl font-bold text-purple-400">{toPersianNumber(overallProgress)}%</p>
            <p className="text-xs text-gray-400">پیشرفت کل</p>
          </div>
          <div className="clay-card p-3 text-center bg-green-900/30">
            <p className="text-2xl font-bold text-green-400">{toPersianNumber(completedCount)}/{toPersianNumber(stages.length)}</p>
            <p className="text-xs text-gray-400">مراحل</p>
          </div>
          <div className="clay-card p-3 text-center bg-yellow-900/30">
            <p className="text-2xl font-bold text-yellow-400">{toPersianNumber(earnedXP)}/{toPersianNumber(totalXP)}</p>
            <p className="text-xs text-gray-400">XP</p>
          </div>
          <div className="clay-card p-3 text-center bg-amber-900/30">
            <p className="text-2xl font-bold text-amber-400">🪙 {toPersianNumber(path.coins_reward)}</p>
            <p className="text-xs text-gray-400">پاداش تکمیل</p>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={overallProgress} className="h-3" />
        </div>
      </motion.div>

      {/* Stages List */}
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Target className="w-6 h-6 text-purple-400" />
        مراحل مسیر
      </h2>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage.id);
          const stageProgress = getStageProgress(stage.id);
          const config = stageTypeConfig[stage.stage_type] || stageTypeConfig.lesson;
          const Icon = config.icon;
          const isLocked = status === "locked";
          const isCompleted = status === "completed";
          const isExpanded = expandedStage === stage.id;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`clay-card overflow-hidden ${isLocked ? "opacity-60" : ""} ${isCompleted ? "ring-2 ring-green-500" : ""}`}>
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Stage Number */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      isCompleted ? "bg-green-500" : isLocked ? "bg-gray-600" : `bg-gradient-to-br ${config.color}`
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : isLocked ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        toPersianNumber(index + 1)
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">{config.label}</span>
                        {stage.time_limit && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {toPersianNumber(stage.time_limit)} دقیقه
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white">{stage.title}</h3>
                      {stage.description && (
                        <p className="text-sm text-gray-400 line-clamp-1">{stage.description}</p>
                      )}
                    </div>

                    {/* Rewards */}
                    <div className="text-left">
                      <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <Zap className="w-4 h-4" />
                        <span>{toPersianNumber(stage.xp_reward)} XP</span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <span>🪙 {toPersianNumber(stage.coins_reward)}</span>
                      </div>
                    </div>

                    {/* Expand Arrow */}
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-700"
                    >
                      <div className="p-4 bg-gray-800/50">
                        {stage.description && (
                          <p className="text-gray-300 mb-4">{stage.description}</p>
                        )}

                        {stageProgress && isCompleted && (
                          <div className="clay-card p-3 bg-green-900/30 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-green-300">نمره: {toPersianNumber(stageProgress.score || 0)}%</span>
                              <span className="text-yellow-300">+{toPersianNumber(stageProgress.xp_earned)} XP</span>
                            </div>
                          </div>
                        )}

                        <Button 
                          onClick={() => handleStartStage(stage)}
                          disabled={isLocked}
                          className={`w-full ${isLocked ? "bg-gray-600" : "bg-purple-600 hover:bg-purple-700"}`}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="w-4 h-4 ml-2" />
                              قفل است
                            </>
                          ) : isCompleted ? (
                            <>
                              <Play className="w-4 h-4 ml-2" />
                              تکرار مرحله
                            </>
                          ) : status === "in_progress" ? (
                            <>
                              <Play className="w-4 h-4 ml-2" />
                              ادامه
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 ml-2" />
                              شروع
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Completion Reward */}
      {overallProgress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="clay-card p-6 mt-8 bg-gradient-to-r from-yellow-900/50 to-amber-900/50 text-center"
        >
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">🎉 تبریک! این مسیر را تکمیل کردی!</h3>
          <p className="text-gray-300 mb-4">پاداش‌های تو به حسابت اضافه شد</p>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">{toPersianNumber(earnedXP)}</p>
              <p className="text-sm text-gray-400">XP</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">🪙 {toPersianNumber(path.coins_reward)}</p>
              <p className="text-sm text-gray-400">سکه</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}