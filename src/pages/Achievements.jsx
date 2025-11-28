import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Trophy, Star, TrendingUp, Award, Flame, Zap, Target, Medal, Crown, Shield, Rocket, Gem, Heart, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toPersianNumber, toPersianDate } from "@/components/utils";

// تنظیمات نشان‌ها
const badgeConfigs = {
  first_submission: { name: "اولین قدم", icon: Zap, color: "from-blue-400 to-blue-600", description: "ارسال اولین تکلیف" },
  perfect_score: { name: "نمره کامل", icon: Star, color: "from-purple-400 to-purple-600", description: "کسب نمره ۲۰" },
  streak_3: { name: "شروع خوب", icon: Flame, color: "from-yellow-400 to-orange-400", description: "۳ روز فعالیت متوالی" },
  streak_7: { name: "هفته فعال", icon: Flame, color: "from-orange-400 to-red-500", description: "۷ روز فعالیت متوالی" },
  streak_30: { name: "ماه درخشان", icon: Flame, color: "from-red-500 to-pink-600", description: "۳۰ روز فعالیت متوالی" },
  champion: { name: "قهرمان", icon: Trophy, color: "from-amber-400 to-yellow-500", description: "کسب ۱۰۰۰ سکه" },
  consistent: { name: "پایدار", icon: Target, color: "from-green-400 to-emerald-600", description: "میانگین بالای ۱۵" },
  early_bird: { name: "سحرخیز", icon: Zap, color: "from-amber-400 to-orange-500", description: "۵ تکلیف زودتر از مهلت" },
  top_student: { name: "دانش‌آموز برتر", icon: Crown, color: "from-yellow-400 to-yellow-600", description: "رتبه اول" },
  helper: { name: "یاریگر", icon: Heart, color: "from-pink-400 to-rose-500", description: "کمک به دیگران" },
  rising_star: { name: "ستاره در حال طلوع", icon: TrendingUp, color: "from-indigo-400 to-purple-500", description: "پیشرفت چشمگیر" },
  math_master: { name: "استاد ریاضی", icon: Medal, color: "from-blue-500 to-indigo-600", description: "میانگین بالای ۱۸ در ریاضی" },
  science_master: { name: "استاد علوم", icon: Medal, color: "from-green-500 to-emerald-600", description: "میانگین بالای ۱۸ در علوم" },
  all_subjects: { name: "همه‌فن‌حریف", icon: Star, color: "from-violet-400 to-fuchsia-500", description: "نمره بالای ۱۵ در همه دروس" }
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
  { min: 91, max: 100, name: "اسطوره", color: "from-amber-300 via-yellow-400 to-amber-500" }
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
function BadgeCard({ badgeType, earned, onClick }) {
  const config = badgeConfigs[badgeType];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(badgeType, config, earned)}
      className={`cursor-pointer text-center ${earned ? '' : 'opacity-40 grayscale'}`}
    >
      <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${config.color} p-1 shadow-lg`}>
        <div className="w-full h-full rounded-full bg-gray-900/80 flex items-center justify-center">
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
      {earned && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}
      <p className="text-sm font-bold text-white mt-2">{config.name}</p>
      <p className="text-xs text-gray-400">{config.description}</p>
    </motion.div>
  );
}

// کامپوننت مودال جزئیات نشان
function BadgeModal({ badge, onClose }) {
  if (!badge) return null;
  const { type, config, earned } = badge;
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
          <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${config.color} p-1 shadow-xl mb-4 ${!earned ? 'opacity-50 grayscale' : ''}`}>
            <div className="w-full h-full rounded-full bg-gray-900/80 flex items-center justify-center">
              <Icon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{config.name}</h2>
          <p className="text-gray-400 mb-4">{config.description}</p>
          
          {earned ? (
            <div className="clay-card p-3 bg-green-900/30">
              <p className="text-green-300 font-bold">🎉 این نشان را کسب کردی!</p>
            </div>
          ) : (
            <div className="clay-card p-3 bg-yellow-900/30">
              <p className="text-yellow-300">💡 برای کسب این نشان تلاش کن!</p>
            </div>
          )}
          
          <button onClick={onClose} className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [userBadges, userSubmissions] = await Promise.all([
        base44.entities.Badge.filter({ user_id: currentUser.id }),
        base44.entities.Submission.filter({ student_id: currentUser.id })
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
  const earnedBadgeTypes = badges.map(b => b.badge_type);
  const allBadgeTypes = Object.keys(badgeConfigs);
  
  const completionRate = assignments.length > 0 ? Math.round((submissions.length / assignments.length) * 100) : 0;
  const gradedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
  const averageScore = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length) 
    : 0;

  const progressChartData = submissions
    .filter(s => s.score !== null)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-10)
    .map((s, i) => ({ name: `${i + 1}`, score: s.score }));

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
  const subjectChartData = Object.entries(subjectStats).map(([subject, data]) => ({
    subject,
    average: Math.round(data.total / data.count)
  }));

  const handleBadgeClick = (type, config, earned) => {
    setSelectedBadge({ type, config, earned });
  };

  const daysOfWeek = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  return (
    <div className="max-w-7xl mx-auto pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          دستاوردها و پیشرفت
        </h1>
        <p className="text-gray-300">مسیر موفقیت تو اینجاست!</p>
      </motion.div>

      {/* Level & Streak Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Level Card */}
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

        {/* Streak Card */}
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
          <p className="text-3xl font-bold text-yellow-400">{toPersianNumber(earnedBadgeTypes.length)}</p>
          <p className="text-sm text-gray-400">نشان کسب شده</p>
        </motion.div>
      </div>

      {/* Badges Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Award className="w-6 h-6 text-purple-400" />
              نشان‌های من ({toPersianNumber(earnedBadgeTypes.length)} از {toPersianNumber(allBadgeTypes.length)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
              {allBadgeTypes.map((type) => (
                <BadgeCard
                  key={type}
                  badgeType={type}
                  earned={earnedBadgeTypes.includes(type)}
                  onClick={handleBadgeClick}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
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

        {/* Subject Chart */}
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

      {/* Badge Modal */}
      {selectedBadge && (
        <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      )}
    </div>
  );
}