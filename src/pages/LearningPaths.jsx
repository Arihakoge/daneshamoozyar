import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, Star, Trophy, Lock, CheckCircle, Play, 
  BookOpen, Target, Zap, Award, ChevronLeft, Flame,
  GraduationCap, Clock, Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toPersianNumber } from "@/components/utils";

const difficultyLabels = {
  beginner: { label: "مبتدی", color: "bg-green-500" },
  intermediate: { label: "متوسط", color: "bg-yellow-500" },
  advanced: { label: "پیشرفته", color: "bg-red-500" }
};

const subjectIcons = {
  "ریاضی": "📐",
  "علوم": "🔬",
  "فارسی": "📚",
  "زبان": "🌍",
  "عربی": "📖"
};

export default function LearningPaths() {
  const [user, setUser] = useState(null);
  const [paths, setPaths] = useState([]);
  const [stages, setStages] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allPaths, allStages, userProgress] = await Promise.all([
        base44.entities.LearningPath.filter({ grade: currentUser.grade, is_active: true }),
        base44.entities.PathStage.list(),
        base44.entities.StudentProgress.filter({ student_id: currentUser.id })
      ]);

      setPaths(allPaths || []);
      setStages(allStages || []);
      setProgress(userProgress || []);
    } catch (error) {
      console.error("Error loading paths:", error);
    }
    setLoading(false);
  };

  const getPathProgress = (pathId) => {
    const pathStages = stages.filter(s => s.path_id === pathId);
    const completedStages = progress.filter(
      p => p.path_id === pathId && p.status === "completed"
    );
    
    if (pathStages.length === 0) return 0;
    return Math.round((completedStages.length / pathStages.length) * 100);
  };

  const getPathStats = (pathId) => {
    const pathStages = stages.filter(s => s.path_id === pathId);
    const pathProgress = progress.filter(p => p.path_id === pathId);
    
    const totalXP = pathProgress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);
    const completedCount = pathProgress.filter(p => p.status === "completed").length;
    
    return { totalStages: pathStages.length, completedCount, totalXP };
  };

  const filteredPaths = selectedSubject === "all" 
    ? paths 
    : paths.filter(p => p.subject === selectedSubject);

  const subjects = ["all", ...new Set(paths.map(p => p.subject))];

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

  return (
    <div className="max-w-7xl mx-auto pb-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Rocket className="w-8 h-8 text-purple-400" />
          مسیرهای یادگیری
        </h1>
        <p className="text-gray-300">مسیرهای یادگیری گیمیفای شده برای پیشرفت بهتر!</p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="clay-card p-4 text-center"
        >
          <BookOpen className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{toPersianNumber(paths.length)}</p>
          <p className="text-sm text-gray-400">مسیر فعال</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="clay-card p-4 text-center"
        >
          <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {toPersianNumber(progress.filter(p => p.status === "completed").length)}
          </p>
          <p className="text-sm text-gray-400">مرحله تکمیل شده</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="clay-card p-4 text-center"
        >
          <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {toPersianNumber(progress.reduce((sum, p) => sum + (p.xp_earned || 0), 0))}
          </p>
          <p className="text-sm text-gray-400">XP کسب شده</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="clay-card p-4 text-center"
        >
          <Trophy className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {toPersianNumber(paths.filter(p => getPathProgress(p.id) === 100).length)}
          </p>
          <p className="text-sm text-gray-400">مسیر تکمیل شده</p>
        </motion.div>
      </div>

      {/* Subject Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {subjects.map(subject => (
          <Button
            key={subject}
            onClick={() => setSelectedSubject(subject)}
            variant={selectedSubject === subject ? "default" : "outline"}
            className={`clay-button whitespace-nowrap ${
              selectedSubject === subject ? "bg-purple-600" : ""
            }`}
          >
            {subject === "all" ? "همه دروس" : `${subjectIcons[subject] || "📚"} ${subject}`}
          </Button>
        ))}
      </div>

      {/* Paths Grid */}
      {filteredPaths.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="clay-card p-12 text-center"
        >
          <Rocket className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">هنوز مسیری وجود ندارد</h3>
          <p className="text-gray-400">معلم شما به زودی مسیرهای یادگیری جدید ایجاد خواهد کرد!</p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPaths.map((path, index) => {
              const pathProgress = getPathProgress(path.id);
              const stats = getPathStats(path.id);
              const isCompleted = pathProgress === 100;
              
              return (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={createPageUrl(`PathDetail?id=${path.id}`)}>
                    <Card className={`clay-card overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer ${
                      isCompleted ? "ring-2 ring-green-500" : ""
                    }`}>
                      {/* Header with gradient */}
                      <div 
                        className="h-24 relative"
                        style={{ 
                          background: `linear-gradient(135deg, ${path.color || '#8B5CF6'}, ${path.color || '#8B5CF6'}88)` 
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-5xl">{subjectIcons[path.subject] || "🎯"}</span>
                        </div>
                        {isCompleted && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            تکمیل شده
                          </div>
                        )}
                        <Badge className={`absolute top-2 right-2 ${difficultyLabels[path.difficulty]?.color}`}>
                          {difficultyLabels[path.difficulty]?.label}
                        </Badge>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="text-lg font-bold text-white mb-1">{path.title}</h3>
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{path.description}</p>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">پیشرفت</span>
                            <span className="text-purple-300">{toPersianNumber(pathProgress)}%</span>
                          </div>
                          <Progress value={pathProgress} className="h-2" />
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Target className="w-4 h-4" />
                            <span>{toPersianNumber(stats.completedCount)}/{toPersianNumber(stats.totalStages)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Zap className="w-4 h-4" />
                            <span>{toPersianNumber(stats.totalXP)} XP</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-400">
                            <span>🪙 {toPersianNumber(path.coins_reward)}</span>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <Button className="w-full mt-4 clay-button bg-purple-600 hover:bg-purple-700">
                          {pathProgress === 0 ? (
                            <>
                              <Play className="w-4 h-4 ml-2" />
                              شروع مسیر
                            </>
                          ) : isCompleted ? (
                            <>
                              <Trophy className="w-4 h-4 ml-2" />
                              مشاهده نتایج
                            </>
                          ) : (
                            <>
                              <ChevronLeft className="w-4 h-4 ml-2" />
                              ادامه مسیر
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}