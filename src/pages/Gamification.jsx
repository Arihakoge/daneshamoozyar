import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Star, Target, Zap, Award, Crown, 
  TrendingUp, BookOpen, CheckCircle, Gift
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toPersianNumber, toPersianDate } from "@/components/utils";

import BadgeCard, { BADGE_CONFIG } from "@/components/gamification/BadgeCard";
import ProgressChart from "@/components/gamification/ProgressChart";
import LevelProgress from "@/components/gamification/LevelProgress";
import LeaderboardCard from "@/components/gamification/LeaderboardCard";

export default function Gamification() {
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [userBadges, userAchievements, userSubmissions, allStudents] = await Promise.all([
        base44.entities.Badge.filter({ user_id: currentUser.id }),
        base44.entities.Achievement.filter({ user_id: currentUser.id }, "-created_date"),
        base44.entities.Submission.filter({ student_id: currentUser.id }),
        base44.entities.PublicProfile.filter({ student_role: "student", grade: currentUser.grade })
      ]);

      setBadges(userBadges);
      setAchievements(userAchievements);
      setSubmissions(userSubmissions);

      // Calculate scores for leaderboard
      const allSubmissions = await base44.entities.Submission.list();
      const studentsWithScores = allStudents.map(student => {
        const studentSubs = allSubmissions.filter(s => s.student_id === student.user_id);
        const gradedSubs = studentSubs.filter(s => s.score !== null);
        const avgScore = gradedSubs.length > 0 
          ? gradedSubs.reduce((sum, s) => sum + s.score, 0) / gradedSubs.length 
          : 0;
        const totalScore = (student.coins || 0) + (avgScore * 5);
        return { ...student, score: Math.round(totalScore), avgScore };
      }).sort((a, b) => b.score - a.score);

      setStudents(studentsWithScores);

      // Check and award badges
      await checkAndAwardBadges(currentUser, userSubmissions, userBadges);

    } catch (error) {
      console.error("خطا در بارگیری:", error);
    }
    setLoading(false);
  };

  const checkAndAwardBadges = async (user, submissions, existingBadges) => {
    const earnedTypes = existingBadges.map(b => b.badge_type);
    const newBadges = [];

    // First submission badge
    if (submissions.length >= 1 && !earnedTypes.includes("first_submission")) {
      newBadges.push({ user_id: user.id, badge_type: "first_submission", earned_at: new Date().toISOString() });
    }

    // 10 submissions
    if (submissions.length >= 10 && !earnedTypes.includes("ten_submissions")) {
      newBadges.push({ user_id: user.id, badge_type: "ten_submissions", earned_at: new Date().toISOString() });
    }

    // 50 submissions
    if (submissions.length >= 50 && !earnedTypes.includes("fifty_submissions")) {
      newBadges.push({ user_id: user.id, badge_type: "fifty_submissions", earned_at: new Date().toISOString() });
    }

    // Perfect score
    const perfectScores = submissions.filter(s => s.score === 20);
    if (perfectScores.length > 0 && !earnedTypes.includes("perfect_score")) {
      newBadges.push({ user_id: user.id, badge_type: "perfect_score", earned_at: new Date().toISOString() });
    }

    // Level badges
    if ((user.level || 1) >= 5 && !earnedTypes.includes("level_5")) {
      newBadges.push({ user_id: user.id, badge_type: "level_5", earned_at: new Date().toISOString() });
    }
    if ((user.level || 1) >= 10 && !earnedTypes.includes("level_10")) {
      newBadges.push({ user_id: user.id, badge_type: "level_10", earned_at: new Date().toISOString() });
    }

    // Coin master
    if ((user.coins || 0) >= 500 && !earnedTypes.includes("coin_master")) {
      newBadges.push({ user_id: user.id, badge_type: "coin_master", earned_at: new Date().toISOString() });
    }

    // Award new badges
    for (const badge of newBadges) {
      await base44.entities.Badge.create(badge);
    }

    if (newBadges.length > 0) {
      setBadges([...existingBadges, ...newBadges]);
    }
  };

  const getProgressData = () => {
    const gradedSubs = submissions.filter(s => s.score !== null).slice(-10);
    return gradedSubs.map((s, i) => ({
      label: `تکلیف ${i + 1}`,
      score: s.score
    }));
  };

  const getStats = () => {
    const gradedSubs = submissions.filter(s => s.score !== null);
    const avgScore = gradedSubs.length > 0 
      ? (gradedSubs.reduce((sum, s) => sum + s.score, 0) / gradedSubs.length).toFixed(1) 
      : 0;
    const perfectCount = gradedSubs.filter(s => s.score === 20).length;
    const rank = students.findIndex(s => s.user_id === user?.id) + 1;

    return { avgScore, perfectCount, rank, total: submissions.length };
  };

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

  const stats = getStats();
  const progressData = getProgressData();
  const allBadgeTypes = Object.keys(BADGE_CONFIG);
  const earnedBadgeTypes = badges.map(b => b.badge_type);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-400" />
          دستاوردها و پیشرفت
        </h1>
        <p className="text-gray-300 text-lg">پیشرفت خود را دنبال کنید و جوایز کسب کنید!</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="clay-card">
            <CardContent className="p-4 text-center">
              <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{toPersianNumber(stats.rank || '-')}</p>
              <p className="text-sm text-gray-400">رتبه در کلاس</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="clay-card">
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{toPersianNumber(stats.avgScore)}</p>
              <p className="text-sm text-gray-400">میانگین نمره</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="clay-card">
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{toPersianNumber(badges.length)}</p>
              <p className="text-sm text-gray-400">نشان کسب شده</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="clay-card">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{toPersianNumber(stats.total)}</p>
              <p className="text-sm text-gray-400">تکلیف ارسالی</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="clay-card p-2 bg-gray-800/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500">نمای کلی</TabsTrigger>
          <TabsTrigger value="badges" className="data-[state=active]:bg-purple-500">نشان‌ها</TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-purple-500">رتبه‌بندی</TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-purple-500">پیشرفت</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LevelProgress 
              currentLevel={user?.level || 1} 
              coins={user?.coins || 0}
              xp={(user?.coins || 0)}
            />
            <LeaderboardCard 
              students={students.slice(0, 5)} 
              currentUserId={user?.id}
              title="برترین‌ها"
            />
          </div>
          
          {progressData.length > 0 && (
            <ProgressChart data={progressData} title="روند نمرات اخیر" />
          )}

          {/* Recent Badges */}
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-400" />
                نشان‌های اخیر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 justify-center">
                {badges.slice(0, 4).map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} size="small" />
                ))}
                {badges.length === 0 && (
                  <p className="text-gray-400 text-center py-4">هنوز نشانی کسب نکرده‌اید!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges">
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                همه نشان‌ها ({toPersianNumber(badges.length)} / {toPersianNumber(allBadgeTypes.length)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {allBadgeTypes.map((type) => {
                  const earnedBadge = badges.find(b => b.badge_type === type);
                  return (
                    <BadgeCard 
                      key={type} 
                      badge={earnedBadge || { badge_type: type }} 
                      locked={!earnedBadge}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <LeaderboardCard 
            students={students} 
            currentUserId={user?.id}
            title="رتبه‌بندی کلاس"
          />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <LevelProgress 
            currentLevel={user?.level || 1} 
            coins={user?.coins || 0}
            xp={(user?.coins || 0)}
          />
          
          {progressData.length > 0 ? (
            <ProgressChart data={progressData} title="نمودار پیشرفت تحصیلی" />
          ) : (
            <Card className="clay-card">
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">هنوز نمره‌ای ثبت نشده است</p>
              </CardContent>
            </Card>
          )}

          {/* Stats Summary */}
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="text-white">خلاصه عملکرد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="clay-card p-4 text-center bg-green-500/10">
                  <p className="text-2xl font-bold text-green-400">{toPersianNumber(stats.total)}</p>
                  <p className="text-sm text-gray-400">تکلیف ارسالی</p>
                </div>
                <div className="clay-card p-4 text-center bg-purple-500/10">
                  <p className="text-2xl font-bold text-purple-400">{toPersianNumber(stats.avgScore)}</p>
                  <p className="text-sm text-gray-400">میانگین نمره</p>
                </div>
                <div className="clay-card p-4 text-center bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-400">{toPersianNumber(stats.perfectCount)}</p>
                  <p className="text-sm text-gray-400">نمره کامل</p>
                </div>
                <div className="clay-card p-4 text-center bg-blue-500/10">
                  <p className="text-2xl font-bold text-blue-400">{toPersianNumber(user?.coins || 0)}</p>
                  <p className="text-sm text-gray-400">سکه</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}