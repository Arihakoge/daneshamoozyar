import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Trophy, Star, TrendingUp, Award, Flame, Zap, Target, Medal, Crown, Shield, Rocket, Gem, Heart, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toPersianNumber, toPersianDate, normalizeScore } from "@/components/utils";
import { checkAllRetroactiveBadges } from "@/components/gamification/BadgeSystem";
import { toast } from "sonner";
import { Share2, Download, Clock, Users, List } from "lucide-react";
import html2canvas from "html2canvas";
import Leaderboard from "@/components/gamification/Leaderboard";
import ChallengeBoard from "@/components/gamification/ChallengeBoard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// تنظیمات نشان‌ها
const badgeConfigs = {
  first_submission: { name: "اولین قدم", icon: Zap, color: "from-blue-400 to-blue-600", description: "ارسال اولین تکلیف" },
  perfect_score: { name: "نمره کامل", icon: Star, color: "from-purple-400 to-purple-600", description: "کسب نمره ۲۰" },
  streak_3: { name: "شروع خوب", icon: Flame, color: "from-yellow-400 to-orange-400", description: "۳ روز فعالیت متوالی" },
  streak_7: { name: "هفته فعال", icon: Flame, color: "from-orange-400 to-red-500", description: "۷ روز فعالیت متوالی" },
  streak_30: { name: "ماه درخشان", icon: Flame, color: "from-red-500 to-pink-600", description: "۳۰ روز فعالیت متوالی" },
  champion: { name: "قهرمان", icon: Trophy, color: "from-amber-400 to-yellow-500", description: "کسب ۱۰۰۰ سکه" },
  consistent: { name: "پایدار", icon: Target, color: "from-green-400 to-emerald-600", description: "میانگین بالای ۱۵" },
  early_bird: { name: "سحرخیز", icon: Zap, color: "from-amber-400 to-orange-500", description: "ارسال زودهنگام تکالیف" },
  top_student: { name: "دانش‌آموز برتر", icon: Crown, color: "from-yellow-400 to-yellow-600", description: "رتبه اول" },
  helper: { name: "یاریگر", icon: Heart, color: "from-pink-400 to-rose-500", description: "کمک به دیگران" },
  fast_learner: { name: "یادگیرنده سریع", icon: Zap, color: "from-cyan-400 to-blue-500", description: "یادگیری سریع" },
  rising_star: { name: "ستاره در حال طلوع", icon: TrendingUp, color: "from-indigo-400 to-purple-500", description: "پیشرفت چشمگیر" },
  math_master: { name: "استاد ریاضی", icon: Medal, color: "from-blue-500 to-indigo-600", description: "میانگین بالای ۱۸ در ریاضی" },
  science_master: { name: "استاد علوم", icon: Medal, color: "from-green-500 to-emerald-600", description: "میانگین بالای ۱۸ در علوم" },
  literature_master: { name: "استاد فارسی", icon: Medal, color: "from-rose-500 to-pink-600", description: "میانگین بالای ۱۸ در فارسی" },
  weekly_champion: { name: "قهرمان هفته", icon: Trophy, color: "from-cyan-400 to-blue-500", description: "رتبه اول هفته" },
  monthly_champion: { name: "قهرمان ماه", icon: Crown, color: "from-purple-500 to-violet-600", description: "رتبه اول ماه" },
  all_subjects: { name: "همه‌فن‌حریف", icon: Star, color: "from-violet-400 to-fuchsia-500", description: "نمره بالای ۱۵ در همه دروس" },
  team_player: { name: "بازیکن تیمی", icon: Users, color: "from-cyan-400 to-blue-500", description: "همکاری موثر با کلاس" },
  class_champion: { name: "قهرمان کلاس", icon: Crown, color: "from-rose-400 to-pink-500", description: "بهترین عملکرد کلاسی" }
};

const tierConfigs = {
  bronze: { name: "برنز", color: "from-orange-700 to-amber-600", icon: "🥉", border: "border-orange-600" },
  silver: { name: "نقره", color: "from-gray-400 to-slate-300", icon: "🥈", border: "border-gray-400" },
  gold: { name: "طلا", color: "from-yellow-400 to-amber-300", icon: "🥇", border: "border-yellow-400" }
};

// تنظیمات سطح‌ها
const levelTiers = [
  { min: 1, max: 10, name: "تازه‌کار", color: "from-gray-400 to-gray-600" },
  { min: 11, max: 20, name: "مبتدی", color: "from-green-400 to-green-600" },
  { min: 21, max: 30, name: "یادگیرنده", color: "from-blue-400 to-blue-600" },
  { min: 31, max: 40, name: "پیشرفته", color: "from-purple-400 to-purple-600" },
  { min: 41, max: 50, name: "حرفه‌ای", color: "from-pink-400 to-pink-600" },
  { min: 51, max: 60, name: "استاد", color: "from-orange-400 to-orange-600" },
  { min: 61, max: 70, name: "نخبه", color: "from-red-400 to-red-600" },
  { min: 71, max: 80, name: "قهرمان", color: "from-yellow-400 to-yellow-600" },
  { min: 81, max: 90, name: "افسانه‌ای", color: "from-cyan-400 to-cyan-600" },
  { min: 91, max: 100, name: "لجند", color: "from-amber-300 via-yellow-400 to-amber-500" }
];

function getLevelInfo(coins) {
  const safeCoins = coins || 0;
  let level = 1;
  let totalXP = 0;
  
  while (level < 100) {
    const xpNeeded = Math.floor(50 * Math.pow(1.15, level - 1));
    if (totalXP + xpNeeded > safeCoins) break;
    totalXP += xpNeeded;
    level++;
  }
  
  const xpForNext = Math.floor(50 * Math.pow(1.15, level - 1));
  const currentXP = safeCoins - totalXP;
  const progress = xpForNext > 0 ? Math.min((currentXP / xpForNext) * 100, 100) : 0;
  
  const tier = levelTiers.find(t => level >= t.min && level <= t.max) || levelTiers[0];
  
  return { level, currentXP, xpForNext, progress, tier };
}

function calculateStreak(submissions) {
  if (!submissions || submissions.length === 0) {
    return { current: 0, longest: 0, weeklyActivity: [false, false, false, false, false, false, false] };
  }

  const dates = [...new Set(submissions.map(s => new Date(s.created_date).toDateString()))]
    .sort((a, b) => new Date(b) - new Date(a));

  const today = new Date();
  const todayStr = today.toDateString();
  const yesterdayStr = new Date(today.getTime() - 86400000).toDateString();

  let currentStreak = 0;
  if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i - 1]) - new Date(dates[i])) / 86400000;
      if (Math.round(diff) === 1) currentStreak++;
      else break;
    }
  }

  let longestStreak = currentStreak;
  let tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i - 1]) - new Date(dates[i])) / 86400000;
    if (Math.round(diff) === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  const weeklyActivity = [];
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() - 1);
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weeklyActivity.push(dates.includes(day.toDateString()));
  }

  return { current: currentStreak, longest: longestStreak, weeklyActivity };
}

// کامپوننت نمایش نشان
function BadgeCard({ badgeType, tier, earned, onClick }) {
  const config = badgeConfigs[badgeType];
  const tierConfig = tier ? tierConfigs[tier] : null;
  if (!config) return null;
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(badgeType, config, tier, earned)}
      className={`cursor-pointer text-center relative ${earned ? '' : 'opacity-40 grayscale'}`}
    >
      <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${config.color} p-1 shadow-lg ${tierConfig ? `ring-2 ${tierConfig.border}` : ''}`}>
        <div className="w-full h-full rounded-full bg-gray-900/80 flex items-center justify-center">
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
      {earned && tierConfig && (
        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${tierConfig.color} flex items-center justify-center text-xs border-2 border-slate-900 shadow-lg`}>
          {tierConfig.icon}
        </div>
      )}
      {earned && !tierConfig && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}
      <p className="text-sm font-bold text-white mt-2">{config.name}</p>
      <p className="text-xs text-gray-400">{tierConfig ? tierConfig.name : config.description}</p>
    </motion.div>
  );
}

// کامپوننت مودال جزئیات نشان
function BadgeModal({ badge, onClose, onShare, onDownload }) {
  if (!badge) return null;
  const { type, config, tier, earned } = badge;
  const tierConfig = tier ? tierConfigs[tier] : null;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="clay-card p-6 max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div id={`badge-${type}`} className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${config.color} p-1.5 shadow-2xl mb-4 ${!earned ? 'opacity-50 grayscale' : ''} ${tierConfig ? `ring-4 ${tierConfig.border}` : ''}`}>
            <div className="w-full h-full rounded-full bg-gray-900/80 flex items-center justify-center relative">
              <Icon className="w-16 h-16 text-white" />
              {earned && tierConfig && (
                <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br ${tierConfig.color} flex items-center justify-center text-lg border-4 border-slate-900 shadow-xl`}>
                  {tierConfig.icon}
                </div>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{config.name}</h2>
          {tierConfig && <p className="text-lg text-purple-300 mb-2">سطح {tierConfig.name}</p>}
          <p className="text-gray-400 mb-4">{config.description}</p>
          
          {earned ? (
            <>
              <div className="clay-card p-3 bg-green-900/30 mb-4">
                <p className="text-green-300 font-bold">🎉 این نشان را کسب کردی!</p>
              </div>
              <div className="flex gap-2 mb-4">
                <Button onClick={() => onShare(type, config, tierConfig)} className="flex-1 clay-button bg-purple-600">
                  <Share2 className="w-4 h-4 mr-2" /> اشتراک
                </Button>
                <Button onClick={() => onDownload(type)} className="flex-1 clay-button bg-blue-600">
                  <Download className="w-4 h-4 mr-2" /> دانلود
                </Button>
              </div>
            </>
          ) : (
            <div className="clay-card p-3 bg-yellow-900/30 mb-4">
              <p className="text-yellow-300">💡 برای کسب این نشان تلاش کن!</p>
            </div>
          )}
          
          <button onClick={onClose} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition w-full">
            بستن
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Achievements() {
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [streakData, setStreakData] = useState({ current: 0, longest: 0, weeklyActivity: [] });
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const newRetroBadges = await checkAllRetroactiveBadges(currentUser.id);
      if (newRetroBadges.length > 0) {
        toast.success(`شما ${newRetroBadges.length} نشان جدید از فعالیت‌های گذشته دریافت کردید!`);
      }

      const [userBadges, userSubmissions] = await Promise.all([
        base44.entities.Badge.filter({ user_id: currentUser.id }, "-earned_at", 1000),
        base44.entities.Submission.filter({ student_id: currentUser.id }, "-created_date", 1000)
      ]);
      
      setBadges(userBadges || []);
      setSubmissions(userSubmissions || []);

      if (currentUser.grade) {
        const gradeAssignments = await base44.entities.Assignment.filter({ grade: currentUser.grade });
        setAssignments(gradeAssignments || []);
      }

      setStreakData(calculateStreak(userSubmissions || []));
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
    setLoading(false);
  };

  const handleBadgeClick = (type, config, tier, earned) => {
    setSelectedBadge({ type, config, tier, earned });
  };

  const handleShare = async (type, config, tierConfig) => {
    const shareText = `🎉 من نشان "${config.name}"${tierConfig ? ` سطح ${tierConfig.name}` : ''} را در سیستم دانش‌آموزیار کسب کردم!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'دستاورد جدید', text: shareText });
        toast.success("اشتراک‌گذاری شد");
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(shareText);
          toast.success("متن در کلیپ‌بورد کپی شد");
        }
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("متن در کلیپ‌بورد کپی شد");
    }
  };

  const handleDownload = async (badgeType) => {
    const element = document.getElementById(`badge-story-${badgeType}`);
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { 
        backgroundColor: '#1e293b',
        scale: 2,
        width: 1080,
        height: 1920
      });
      const link = document.createElement('a');
      link.download = `badge-${badgeType}-story.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("تصویر ذخیره شد");
    } catch (err) {
      console.error('Error downloading:', err);
      toast.error("خطا در ذخیره تصویر");
    }
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

  const levelInfo = getLevelInfo(user?.coins || 0);
  const sortedBadges = [...badges].sort((a, b) => new Date(b.earned_at) - new Date(a.earned_at));
  const allBadgeTypes = Object.keys(badgeConfigs);
  
  const completionRate = assignments.length > 0 ? Math.round((submissions.length / assignments.length) * 100) : 0;
  const gradedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
  const averageScore = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((sum, s) => {
        const assignment = assignments.find(a => a.id === s.assignment_id);
        return sum + normalizeScore(s.score, assignment?.max_score);
      }, 0) / gradedSubmissions.length) 
    : 0;

  const progressChartData = submissions
    .filter(s => s.score !== null)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-10)
    .map((s, i) => {
      const assignment = assignments.find(a => a.id === s.assignment_id);
      return { 
        name: `${i + 1}`, 
        score: normalizeScore(s.score, assignment?.max_score) 
      };
    });

  const subjectStats = {};
  submissions.forEach(sub => {
    const assignment = assignments.find(a => a.id === sub.assignment_id);
    if (assignment && sub.score !== null) {
      if (!subjectStats[assignment.subject]) {
        subjectStats[assignment.subject] = { total: 0, count: 0 };
      }
      subjectStats[assignment.subject].total += normalizeScore(sub.score, assignment.max_score);
      subjectStats[assignment.subject].count += 1;
    }
  });
  const subjectChartData = Object.entries(subjectStats).map(([subject, data]) => ({
    subject,
    average: Math.round(data.total / data.count)
  }));

  const daysOfWeek = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  return (
    <div className="max-w-7xl mx-auto pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          دستاوردها و پیشرفت
        </h1>
        <p className="text-gray-300">مسیر موفقیت تو اینجاست!</p>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700 w-full md:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" /> نمای کلی
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <List className="w-4 h-4" /> رتبه‌بندی
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Zap className="w-4 h-4" /> چالش‌ها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Level & Streak Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${levelInfo.tier.color} p-1`}>
              <div className="w-full h-full rounded-full bg-gray-900/80 flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">سطح {toPersianNumber(levelInfo.level)}</h3>
              <p className={`text-transparent bg-clip-text bg-gradient-to-r ${levelInfo.tier.color} font-bold`}>
                {levelInfo.tier.name}
              </p>
            </div>
            <div className="mr-auto text-left">
              <p className="text-2xl font-bold text-yellow-400">🪙 {toPersianNumber(user?.coins || 0)}</p>
              <p className="text-xs text-gray-400">سکه</p>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">پیشرفت به سطح بعدی</span>
              <span className="text-purple-300">{toPersianNumber(levelInfo.currentXP)} / {toPersianNumber(levelInfo.xpForNext)}</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1 }}
                className={`h-full bg-gradient-to-r ${levelInfo.tier.color} rounded-full`}
              />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="clay-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">فعالیت مستمر</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="clay-card p-3 bg-orange-900/30 text-center">
              <p className="text-3xl font-bold text-orange-400">{toPersianNumber(streakData.current)}</p>
              <p className="text-xs text-orange-300">روز متوالی فعلی</p>
            </div>
            <div className="clay-card p-3 bg-purple-900/30 text-center">
              <p className="text-3xl font-bold text-purple-400">{toPersianNumber(streakData.longest)}</p>
              <p className="text-xs text-purple-300">بیشترین رکورد</p>
            </div>
          </div>

          <div className="flex justify-between gap-1">
            {daysOfWeek.map((day, i) => (
              <div
                key={day}
                className={`flex-1 aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                  streakData.weeklyActivity[i] 
                    ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" 
                    : "bg-gray-700/50 text-gray-500"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="clay-card p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{toPersianNumber(completionRate)}%</p>
          <p className="text-sm text-gray-400">نرخ تکمیل</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="clay-card p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{toPersianNumber(averageScore)}</p>
          <p className="text-sm text-gray-400">میانگین نمره</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="clay-card p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{toPersianNumber(submissions.length)}</p>
          <p className="text-sm text-gray-400">تکالیف ارسالی</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="clay-card p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{toPersianNumber(badges.length)}</p>
          <p className="text-sm text-gray-400">نشان کسب شده</p>
        </motion.div>
      </div>

      {/* Badges Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
        <Card className="clay-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-white">
                <Award className="w-6 h-6 text-purple-400" />
                نشان‌های من ({toPersianNumber(badges.length)})
              </CardTitle>
              <Button onClick={() => setShowTimeline(!showTimeline)} className="clay-button text-white" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                {showTimeline ? 'مشاهده همه' : 'تاریخچه'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showTimeline ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {sortedBadges.length > 0 ? (
                  sortedBadges.map((badge, index) => {
                    const config = badgeConfigs[badge.badge_type];
                    const tierConfig = badge.tier ? tierConfigs[badge.tier] : null;
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="clay-card p-4 flex items-center gap-4"
                      >
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${config.color} p-1 relative flex-shrink-0 ${tierConfig ? `ring-2 ${tierConfig.border}` : ''}`}>
                          <div className="w-full h-full rounded-full bg-gray-900/80 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          {tierConfig && (
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${tierConfig.color} flex items-center justify-center text-xs border-2 border-slate-900`}>
                              {tierConfig.icon}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white">{config.name}</h3>
                          {tierConfig && <p className="text-xs text-purple-300">{tierConfig.name}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">{toPersianDate(badge.earned_at)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleShare(badge.badge_type, config, tierConfig)} className="clay-button text-white">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDownload(badge.badge_type)} className="clay-button text-white">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-400 py-8">هنوز هیچ نشانی کسب نکرده‌اید</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
                {allBadgeTypes.map((type) => {
                  const userBadgesOfType = badges.filter(b => b.badge_type === type);
                  const highestTier = userBadgesOfType.sort((a, b) => {
                    const tierOrder = { bronze: 1, silver: 2, gold: 3 };
                    return (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
                  })[0];
                  
                  return (
                    <BadgeCard
                      key={type}
                      badgeType={type}
                      tier={highestTier?.tier}
                      earned={!!highestTier}
                      onClick={handleBadgeClick}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-green-400" />
                روند پیشرفت نمرات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={progressChartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" domain={[0, 20]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="score" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>هنوز داده‌ای نیست</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-blue-400" />
                میانگین در هر درس
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subjectChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={subjectChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" domain={[0, 20]} stroke="#9CA3AF" />
                    <YAxis dataKey="subject" type="category" stroke="#9CA3AF" width={50} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="average" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>هنوز داده‌ای نیست</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tips */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8">
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
                <p className="text-sm text-gray-300">تکالیف را قبل از مهلت ارسال کن!</p>
              </div>
              <div className="clay-card p-4 bg-yellow-900/30">
                <Star className="w-8 h-8 text-yellow-400 mb-2" />
                <h4 className="font-bold text-white mb-1">نمره کامل</h4>
                <p className="text-sm text-gray-300">با گرفتن نمره ۲۰، نشان بگیر!</p>
              </div>
              <div className="clay-card p-4 bg-purple-900/30">
                <Flame className="w-8 h-8 text-orange-400 mb-2" />
                <h4 className="font-bold text-white mb-1">فعالیت مداوم</h4>
                <p className="text-sm text-gray-300">۷ روز متوالی فعالیت کن!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {selectedBadge && (
        <BadgeModal 
          badge={selectedBadge} 
          onClose={() => setSelectedBadge(null)}
          onShare={handleShare}
          onDownload={handleDownload}
        />
      )}

        </TabsContent>
        
        <TabsContent value="leaderboard">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Leaderboard currentUser={user} />
          </motion.div>
        </TabsContent>

        <TabsContent value="challenges">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <ChallengeBoard currentUser={user} />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Hidden Story Cards for Download */}
      {badges.map(badge => {
        const config = badgeConfigs[badge.badge_type];
        const tierConfig = badge.tier ? tierConfigs[badge.tier] : null;
        if (!config) return null;
        
        const Icon = config.icon;
        // Percentage calculation removed for performance
        const percentage = 0;
        
        return (
          <div 
            key={badge.id}
            id={`badge-story-${badge.badge_type}`}
            className="fixed"
            style={{ 
              left: '-9999px',
              top: 0,
              width: '1080px', 
              height: '1920px',
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
              padding: '80px',
              direction: 'rtl',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <div style={{ 
                fontSize: '48px', 
                color: '#fff', 
                fontWeight: 'bold',
                marginBottom: '20px'
              }}>
                🎓 سیستم دانش‌آموزیار
              </div>
              <div style={{ 
                fontSize: '32px', 
                color: '#94a3b8',
                fontWeight: '500'
              }}>
                دستاورد جدید کسب شد!
              </div>
            </div>

            {/* Badge Display */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: '60px'
            }}>
              <div style={{
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${config.color.includes('from-') ? '#8B5CF6' : '#8B5CF6'}, ${config.color.includes('to-') ? '#EC4899' : '#EC4899'})`,
                padding: '12px',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                border: tierConfig ? `8px solid ${tierConfig.border.includes('border-orange') ? '#ea580c' : tierConfig.border.includes('border-gray') ? '#9ca3af' : '#fbbf24'}` : 'none'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '180px'
                }}>
                  {config.icon === Star && '⭐'}
                  {config.icon === Trophy && '🏆'}
                  {config.icon === Flame && '🔥'}
                  {config.icon === Zap && '⚡'}
                  {config.icon === Target && '🎯'}
                  {config.icon === Medal && '🏅'}
                  {config.icon === Crown && '👑'}
                  {config.icon === Heart && '❤️'}
                  {config.icon === TrendingUp && '📈'}
                  {config.icon === Users && '👥'}
                </div>
                {tierConfig && (
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: tierConfig.color.includes('from-orange') ? 'linear-gradient(135deg, #c2410c, #d97706)' : tierConfig.color.includes('from-gray') ? 'linear-gradient(135deg, #9ca3af, #cbd5e1)' : 'linear-gradient(135deg, #fbbf24, #fcd34d)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '60px',
                    border: '6px solid #0f172a',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }}>
                    {tierConfig.icon}
                  </div>
                )}
              </div>
            </div>

            {/* Badge Info */}
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <div style={{ 
                fontSize: '72px', 
                color: '#fff', 
                fontWeight: 'bold',
                marginBottom: '20px'
              }}>
                {config.name}
              </div>
              {tierConfig && (
                <div style={{ 
                  fontSize: '48px', 
                  color: '#a78bfa',
                  marginBottom: '20px'
                }}>
                  سطح {tierConfig.name}
                </div>
              )}
              <div style={{ 
                fontSize: '36px', 
                color: '#94a3b8',
                lineHeight: '1.6'
              }}>
                {config.description}
              </div>
            </div>

            {/* Stats */}
            <div style={{
              background: 'rgba(100, 116, 139, 0.2)',
              borderRadius: '30px',
              padding: '50px',
              marginBottom: '60px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '40px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '80px', color: '#10b981', fontWeight: 'bold' }}>
                    ✨
                  </div>
                  <div style={{ fontSize: '28px', color: '#94a3b8' }}>
                     نشان کسب شده
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '10px' }}>
                    📅
                  </div>
                  <div style={{ fontSize: '28px', color: '#94a3b8' }}>
                    {toPersianDate(badge.earned_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              textAlign: 'center',
              fontSize: '32px',
              color: '#64748b'
            }}>
              {user?.display_name || user?.full_name || 'دانش‌آموز'}
            </div>
          </div>
        );
      })}
    </div>
  );
}