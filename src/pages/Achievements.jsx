import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Trophy, Star, Target, TrendingUp, Award, Flame, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import BadgeCard, { badgeConfigs } from "@/components/gamification/BadgeCard";
import LevelProgress from "@/components/gamification/LevelProgress";
import ProgressRing from "@/components/gamification/ProgressRing";
import { toPersianNumber, toPersianDate } from "@/components/utils";

export default function Achievements() {
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const userBadges = await base44.entities.Badge.filter({ user_id: currentUser.id });
      setBadges(userBadges);

      const userSubmissions = await base44.entities.Submission.filter({ student_id: currentUser.id });
      setSubmissions(userSubmissions);

      if (currentUser.grade) {
        const gradeAssignments = await base44.entities.Assignment.filter({ grade: currentUser.grade });
        setAssignments(gradeAssignments);
      }

      // Check and award badges
      await checkAndAwardBadges(currentUser, userSubmissions, userBadges);
    } catch (error) {
      console.error("Error loading achievements:", error);
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

    // Perfect score badge
    const perfectScores = submissions.filter(s => s.score === 20);
    if (perfectScores.length > 0 && !earnedTypes.includes("perfect_score")) {
      newBadges.push({ user_id: user.id, badge_type: "perfect_score", earned_at: new Date().toISOString() });
    }

    // Champion badge (1000 coins)
    if ((user.coins || 0) >= 1000 && !earnedTypes.includes("champion")) {
      newBadges.push({ user_id: user.id, badge_type: "champion", earned_at: new Date().toISOString() });
    }

    // Consistent badge (avg > 15)
    const gradedSubs = submissions.filter(s => s.score !== null);
    if (gradedSubs.length >= 5) {
      const avg = gradedSubs.reduce((sum, s) => sum + s.score, 0) / gradedSubs.length;
      if (avg >= 15 && !earnedTypes.includes("consistent")) {
        newBadges.push({ user_id: user.id, badge_type: "consistent", earned_at: new Date().toISOString() });
      }
    }

    // Create new badges
    for (const badge of newBadges) {
      await base44.entities.Badge.create(badge);
    }

    if (newBadges.length > 0) {
      setBadges([...existingBadges, ...newBadges]);
    }
  };

  const getProgressData = () => {
    const sortedSubs = [...submissions]
      .filter(s => s.score !== null)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      .slice(-10);

    return sortedSubs.map((s, i) => ({
      name: `تکلیف ${i + 1}`,
      score: s.score,
      date: toPersianDate(s.created_date)
    }));
  };

  const getSubjectStats = () => {
    const stats = {};
    submissions.forEach(sub => {
      const assignment = assignments.find(a => a.id === sub.assignment_id);
      if (assignment && sub.score !== null) {
        if (!stats[assignment.subject]) {
          stats[assignment.subject] = { total: 0, count: 0 };
        }
        stats[assignment.subject].total += sub.score;
        stats[assignment.subject].count += 1;
      }
    });

    return Object.entries(stats).map(([subject, data]) => ({
      subject,
      average: Math.round(data.total / data.count),
      count: data.count
    }));
  };

  const getCompletionRate = () => {
    if (assignments.length === 0) return 0;
    return Math.round((submissions.length / assignments.length) * 100);
  };

  const getAverageScore = () => {
    const graded = submissions.filter(s => s.score !== null);
    if (graded.length === 0) return 0;
    return Math.round(graded.reduce((sum, s) => sum + s.score, 0) / graded.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری دستاوردها...</p>
        </div>
      </div>
    );
  }

  const allBadgeTypes = Object.keys(badgeConfigs);
  const earnedBadgeTypes = badges.map(b => b.badge_type);
  const progressData = getProgressData();
  const subjectStats = getSubjectStats();

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
        <p className="text-gray-300 text-lg">مسیر موفقیت تو اینجاست!</p>
      </motion.div>

      {/* Level Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <LevelProgress level={user?.level || 1} coins={user?.coins || 0} />
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="clay-card p-6 text-center">
          <ProgressRing progress={getCompletionRate()} size={80} value={`${toPersianNumber(getCompletionRate())}%`} />
          <p className="text-sm text-gray-400 mt-2">نرخ تکمیل</p>
        </div>
        <div className="clay-card p-6 text-center">
          <ProgressRing progress={(getAverageScore() / 20) * 100} size={80} color="#10B981" value={toPersianNumber(getAverageScore())} />
          <p className="text-sm text-gray-400 mt-2">میانگین نمره</p>
        </div>
        <div className="clay-card p-6 text-center">
          <div className="text-4xl font-bold text-purple-400 mb-2">{toPersianNumber(submissions.length)}</div>
          <p className="text-sm text-gray-400">تکالیف ارسالی</p>
        </div>
        <div className="clay-card p-6 text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-2">{toPersianNumber(earnedBadgeTypes.length)}</div>
          <p className="text-sm text-gray-400">نشان کسب شده</p>
        </div>
      </motion.div>

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Award className="w-6 h-6 text-purple-400" />
              نشان‌های من
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
              {allBadgeTypes.map((type) => (
                <BadgeCard
                  key={type}
                  badgeType={type}
                  earned={earnedBadgeTypes.includes(type)}
                  size="medium"
                />
              ))}
            </div>
            <div className="mt-6 clay-card p-4 bg-purple-900/30">
              <p className="text-purple-200 text-center">
                🎯 {toPersianNumber(earnedBadgeTypes.length)} از {toPersianNumber(allBadgeTypes.length)} نشان کسب شده
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Progress Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="clay-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-6 h-6 text-green-400" />
                نمودار پیشرفت
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" domain={[0, 20]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>هنوز داده‌ای برای نمایش وجود ندارد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Subject Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="clay-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="w-6 h-6 text-blue-400" />
                عملکرد در هر درس
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectStats.length > 0 ? (
                  subjectStats.map((stat) => (
                    <div key={stat.subject} className="clay-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white">📚 {stat.subject}</span>
                        <span className="text-purple-400 font-bold">{toPersianNumber(stat.average)}/۲۰</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(stat.average / 20) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{toPersianNumber(stat.count)} تکلیف</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>هنوز نمره‌ای ثبت نشده</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Card className="clay-card bg-gradient-to-r from-purple-900/50 to-pink-900/50">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              راه‌های کسب امتیاز بیشتر
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="clay-card p-4 bg-green-900/30">
                <Zap className="w-8 h-8 text-green-400 mb-2" />
                <h4 className="font-bold text-white mb-1">ارسال زودهنگام</h4>
                <p className="text-sm text-gray-300">تکالیف را قبل از مهلت ارسال کن و ۵ سکه اضافی بگیر!</p>
              </div>
              <div className="clay-card p-4 bg-yellow-900/30">
                <Star className="w-8 h-8 text-yellow-400 mb-2" />
                <h4 className="font-bold text-white mb-1">نمره کامل</h4>
                <p className="text-sm text-gray-300">با گرفتن نمره ۲۰، نشان "نمره کامل" را کسب کن!</p>
              </div>
              <div className="clay-card p-4 bg-purple-900/30">
                <Flame className="w-8 h-8 text-orange-400 mb-2" />
                <h4 className="font-bold text-white mb-1">فعالیت مداوم</h4>
                <p className="text-sm text-gray-300">۷ روز متوالی فعالیت کن و نشان "هفته فعال" بگیر!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}