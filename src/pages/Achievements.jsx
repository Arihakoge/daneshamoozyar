import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Trophy, Star, Target, TrendingUp, Award, Flame, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BadgeCard, { badgeConfigs } from "@/components/gamification/BadgeCard";
import LevelSystem from "@/components/gamification/LevelSystem";
import BadgeDetailModal from "@/components/gamification/BadgeDetailModal";
import ProgressRing from "@/components/gamification/ProgressRing";
import StreakDisplay from "@/components/gamification/StreakDisplay";
import LeaderboardTabs from "@/components/gamification/LeaderboardTabs";
import SubjectProgressChart from "@/components/gamification/SubjectProgressChart";
import { toPersianNumber, toPersianDate } from "@/components/utils";

export default function Achievements() {
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [streakData, setStreakData] = useState({ current: 0, longest: 0, weeklyActivity: [] });
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const userBadges = await base44.entities.Badge.filter({ user_id: currentUser.id });
      setBadges(userBadges || []);

      const userSubmissions = await base44.entities.Submission.filter({ student_id: currentUser.id });
      setSubmissions(userSubmissions || []);

      let gradeAssignments = [];
      if (currentUser.grade) {
        gradeAssignments = await base44.entities.Assignment.filter({ grade: currentUser.grade });
        setAssignments(gradeAssignments || []);

        // Load all students for leaderboard
        try {
          const profiles = await base44.entities.PublicProfile.filter({ grade: currentUser.grade, student_role: "student" });
          const allSubs = await base44.entities.Submission.list();
          const studentsWithSubs = (profiles || []).map(p => ({
            ...p,
            submissions: (allSubs || []).filter(s => s.student_id === p.user_id)
          }));
          setAllStudents(studentsWithSubs);
        } catch (e) {
          console.error("Error loading leaderboard:", e);
          setAllStudents([]);
        }
      }

      // Calculate streak
      const streak = calculateStreak(userSubmissions || []);
      setStreakData(streak);

      // Check and award badges
      try {
        await checkAndAwardBadges(currentUser, userSubmissions || [], userBadges || [], gradeAssignments || []);
      } catch (e) {
        console.error("Error checking badges:", e);
      }
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
    setLoading(false);
  };

  const calculateStreak = (submissions) => {
    if (!submissions || submissions.length === 0) {
      return { current: 0, longest: 0, weeklyActivity: [false, false, false, false, false, false, false] };
    }

    const dates = submissions
      .map(s => new Date(s.created_date).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date();
    const todayStr = today.toDateString();
    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString();

    if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const curr = new Date(dates[i - 1]);
        const prev = new Date(dates[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    for (let i = 1; i < dates.length; i++) {
      const curr = new Date(dates[i - 1]);
      const prev = new Date(dates[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Weekly activity (Saturday to Friday)
    const weeklyActivity = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() - 1); // Saturday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weeklyActivity.push(dates.includes(day.toDateString()));
    }

    return { current: currentStreak, longest: longestStreak, weeklyActivity };
  };

  const checkAndAwardBadges = async (user, submissions, existingBadges, assignments) => {
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

    // Streak badges
    const streak = calculateStreak(submissions);
    if (streak.current >= 3 && !earnedTypes.includes("streak_3")) {
      newBadges.push({ user_id: user.id, badge_type: "streak_3", earned_at: new Date().toISOString() });
    }
    if (streak.current >= 7 && !earnedTypes.includes("streak_7")) {
      newBadges.push({ user_id: user.id, badge_type: "streak_7", earned_at: new Date().toISOString() });
    }
    if (streak.current >= 30 && !earnedTypes.includes("streak_30")) {
      newBadges.push({ user_id: user.id, badge_type: "streak_30", earned_at: new Date().toISOString() });
    }

    // Early bird (5 early submissions)
    const earlySubmissions = submissions.filter(s => {
      const assignment = assignments.find(a => a.id === s.assignment_id);
      if (!assignment || !assignment.due_date) return false;
      return new Date(s.created_date) < new Date(assignment.due_date);
    });
    if (earlySubmissions.length >= 5 && !earnedTypes.includes("early_bird")) {
      newBadges.push({ user_id: user.id, badge_type: "early_bird", earned_at: new Date().toISOString() });
    }

    // Subject master badges
    const subjectStats = {};
    submissions.forEach(sub => {
      const assignment = assignments.find(a => a.id === sub.assignment_id);
      if (assignment && sub.score !== null) {
        if (!subjectStats[assignment.subject]) {
          subjectStats[assignment.subject] = { total: 0, count: 0 };
        }
        subjectStats[assignment.subject].total += sub.score;
        subjectStats[assignment.subject].count += 1;
      }
    });

    Object.entries(subjectStats).forEach(([subject, data]) => {
      if (data.count >= 3) {
        const avg = data.total / data.count;
        if (avg >= 18) {
          if (subject === "ریاضی" && !earnedTypes.includes("math_master")) {
            newBadges.push({ user_id: user.id, badge_type: "math_master", earned_at: new Date().toISOString() });
          } else if (subject === "علوم" && !earnedTypes.includes("science_master")) {
            newBadges.push({ user_id: user.id, badge_type: "science_master", earned_at: new Date().toISOString() });
          } else if (subject === "فارسی" && !earnedTypes.includes("literature_master")) {
            newBadges.push({ user_id: user.id, badge_type: "literature_master", earned_at: new Date().toISOString() });
          }
        }
      }
    });

    // All subjects badge
    const allSubjectsGood = Object.values(subjectStats).length >= 3 && 
      Object.values(subjectStats).every(s => s.count >= 1 && (s.total / s.count) >= 15);
    if (allSubjectsGood && !earnedTypes.includes("all_subjects")) {
      newBadges.push({ user_id: user.id, badge_type: "all_subjects", earned_at: new Date().toISOString() });
    }

    // Create new badges
    for (const badge of newBadges) {
      await base44.entities.Badge.create(badge);
    }

    if (newBadges.length > 0) {
      setBadges([...existingBadges, ...newBadges]);
    }
  };

  const getCompletionRate = () => {
    if (!assignments || assignments.length === 0) return 0;
    return Math.round(((submissions || []).length / assignments.length) * 100);
  };

  const getAverageScore = () => {
    if (!submissions || submissions.length === 0) return 0;
    const graded = submissions.filter(s => s.score !== null && s.score !== undefined);
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

  const allBadgeTypes = Object.keys(badgeConfigs || {});
  const earnedBadgeTypes = (badges || []).map(b => b.badge_type);
  
  const progressData = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    const sortedSubs = [...submissions]
      .filter(s => s.score !== null && s.score !== undefined)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      .slice(-10);

    return sortedSubs.map((s, i) => ({
      name: `تکلیف ${i + 1}`,
      score: s.score,
      date: toPersianDate(s.created_date)
    }));
  }, [submissions]);
  
  const subjectStatsData = useMemo(() => {
    if (!submissions || !assignments) return [];
    const stats = {};
    submissions.forEach(sub => {
      const assignment = assignments.find(a => a.id === sub.assignment_id);
      if (assignment && sub.score !== null && sub.score !== undefined) {
        if (!stats[assignment.subject]) {
          stats[assignment.subject] = { total: 0, count: 0 };
        }
        stats[assignment.subject].total += sub.score;
        stats[assignment.subject].count += 1;
      }
    });

    return Object.entries(stats).map(([subject, data]) => ({
      subject,
      average: data.count > 0 ? Math.round(data.total / data.count) : 0,
      count: data.count
    }));
  }, [submissions, assignments]);

  // آمار کاربر برای محاسبه پیشرفت نشان‌ها
  const userStats = useMemo(() => {
    const subs = submissions || [];
    const assigns = assignments || [];
    
    const gradedSubs = subs.filter(s => s.score !== null && s.score !== undefined);
    const perfectScores = subs.filter(s => s.score === 20).length;
    const earlySubmissions = subs.filter(s => {
      const assignment = assigns.find(a => a.id === s.assignment_id);
      if (!assignment?.due_date) return false;
      return new Date(s.created_date) < new Date(assignment.due_date);
    }).length;

    // محاسبه میانگین هر درس
    const subjectStats = {};
    subs.forEach(sub => {
      const assignment = assigns.find(a => a.id === sub.assignment_id);
      if (assignment && sub.score !== null && sub.score !== undefined) {
        if (!subjectStats[assignment.subject]) {
          subjectStats[assignment.subject] = { total: 0, count: 0 };
        }
        subjectStats[assignment.subject].total += sub.score;
        subjectStats[assignment.subject].count += 1;
      }
    });
    Object.keys(subjectStats).forEach(key => {
      subjectStats[key].average = subjectStats[key].count > 0 
        ? subjectStats[key].total / subjectStats[key].count 
        : 0;
    });

    return {
      totalSubmissions: subs.length,
      perfectScores,
      currentStreak: streakData?.current || 0,
      coins: user?.coins || 0,
      averageScore: gradedSubs.length > 0 ? gradedSubs.reduce((sum, s) => sum + s.score, 0) / gradedSubs.length : 0,
      earlySubmissions,
      subjectStats
    };
  }, [submissions, assignments, streakData, user]);

  const handleBadgeClick = (badgeType, config) => {
    if (badgeType && config) {
      setSelectedBadge({ type: badgeType, config, earned: earnedBadgeTypes.includes(badgeType) });
    }
  };

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

      {/* Level Progress & Streak */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LevelSystem coins={user?.coins || 0} showDetails={true} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <StreakDisplay 
            currentStreak={streakData.current} 
            longestStreak={streakData.longest} 
            weeklyActivity={streakData.weeklyActivity} 
          />
        </motion.div>
      </div>

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
                  onClick={handleBadgeClick}
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
        {/* Weekly/Monthly Leaderboard */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <LeaderboardTabs students={allStudents} currentUserId={user?.id} />
        </motion.div>

        {/* Subject Progress Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <SubjectProgressChart subjectStats={subjectStatsData} viewType="bar" />
        </motion.div>
      </div>

      {/* Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mt-8"
      >
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-6 h-6 text-green-400" />
              نمودار پیشرفت در طول زمان
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
      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailModal 
          badge={selectedBadge} 
          userStats={userStats} 
          onClose={() => setSelectedBadge(null)} 
        />
      )}
    </div>
  );
}