import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { BookOpen, Clock, Trophy, TrendingUp, Calendar, AlertCircle, Star, Award, Target } from "lucide-react";
import { toPersianDate, toPersianDateShort, formatDaysRemaining, isOverdue, toPersianNumber } from "@/components/utils";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import BadgeCard from "@/components/gamification/BadgeCard";
import LevelProgress from "@/components/gamification/LevelProgress";

function StatsCard({ title, value, icon: Icon, color = "purple", trend, delay = 0 }) {
  const colorClasses = {
    purple: "text-purple-400",
    blue: "text-blue-400", 
    pink: "text-pink-400",
    green: "text-green-400",
    orange: "text-orange-400",
    red: "text-red-400"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="clay-card p-6 relative overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {trend && (
            <p className="text-xs text-green-400 font-medium">↗ {trend}</p>
          )}
        </div>
        <Icon className={`w-10 h-10 ${colorClasses[color]}`} />
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.grade) {
        const gradeAssignments = await base44.entities.Assignment.filter(
          { grade: currentUser.grade }, 
          "-created_date"
        );
        setAssignments(gradeAssignments);

        const userSubmissions = await base44.entities.Submission.filter(
          { student_id: currentUser.id }, 
          "-created_date"
        );
        setSubmissions(userSubmissions);

        const userBadges = await base44.entities.Badge.filter({ user_id: currentUser.id });
        setBadges(userBadges);
      }
    } catch (error) {
      console.error("خطا در بارگیری داده‌ها:", error);
    }
    setLoading(false);
  };

  const getUpcomingAssignments = () => {
    return assignments.filter((assignment) =>
      assignment.due_date &&
      !isOverdue(assignment.due_date) &&
      !submissions.some((sub) => sub.assignment_id === assignment.id)
    ).slice(0, 3);
  };

  const getAverageScore = () => {
    const gradedSubmissions = submissions.filter((sub) => sub.score !== null && sub.score !== undefined);
    if (gradedSubmissions.length === 0) return 0;
    return (gradedSubmissions.reduce((sum, sub) => sum + sub.score, 0) / gradedSubmissions.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">در حال بارگیری داشبورد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          سلام {user?.full_name || "دانش‌آموز"}! 👋
        </h1>
        <p className="text-gray-300 text-lg">آماده یادگیری جدید هستی؟</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="سکه‌های من"
          value={`🪙 ${user?.coins || 0}`}
          icon={Trophy}
          color="purple"
          trend="+5 امروز"
          delay={0.1}
        />

        <StatsCard
          title="میانگین نمرات"
          value={getAverageScore()}
          icon={TrendingUp}
          color="blue"
          delay={0.2}
        />

        <StatsCard
          title="تکالیف انجام شده"
          value={submissions.length}
          icon={BookOpen}
          color="green"
          delay={0.3}
        />

        <StatsCard
          title="سطح فعلی"
          value={`⭐ ${user?.level || 1}`}
          icon={Star}
          color="orange"
          delay={0.4}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="clay-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">تکالیف نزدیک به مهلت</h2>
            </div>
            
            <div className="space-y-4">
              {getUpcomingAssignments().length > 0 ?
                getUpcomingAssignments().map((assignment, index) =>
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="clay-card p-5 border-r-4 border-red-400 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-2 text-lg">{assignment.title}</h3>
                        <p className="text-gray-300 mb-3">
                          📚 {assignment.subject}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-red-300">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">
                              مهلت: {toPersianDateShort(assignment.due_date)}
                            </span>
                          </div>
                          <div className="text-orange-300 font-medium">
                            ⏰ {formatDaysRemaining(assignment.due_date)}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-sm">
                          <span className="text-white font-bold">
                            🪙 {assignment.coins_reward}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) :
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center py-12">
                  <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">هیچ تکلیف نزدیک به مهلتی نداری! 🎉</p>
                </motion.div>
              }
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-6">
          
          {/* Level Progress Card */}
          <LevelProgress level={user?.level || 1} coins={user?.coins || 0} />

          {/* Recent Badges */}
          <div className="clay-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-md">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">نشان‌های اخیر</h2>
              </div>
              <Link to={createPageUrl("Achievements")} className="text-purple-400 text-sm hover:underline">
                مشاهده همه
              </Link>
            </div>
            
            {badges.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {badges.slice(0, 3).map((badge) => (
                  <BadgeCard key={badge.id} badgeType={badge.badge_type} earned={true} size="small" />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">هنوز نشانی کسب نشده</p>
                <Link to={createPageUrl("Achievements")} className="text-purple-400 text-xs hover:underline">
                  چگونه نشان کسب کنم؟
                </Link>
              </div>
            )}
          </div>

          {/* Daily Stats */}
          <div className="clay-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">آمار امروز</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="clay-card p-3 bg-green-900/30 text-center">
                <p className="text-2xl font-bold text-green-200">
                  {toPersianNumber(submissions.filter((sub) => {
                    const today = new Date().toDateString();
                    return sub.created_date && new Date(sub.created_date).toDateString() === today;
                  }).length)}
                </p>
                <p className="text-xs text-green-300">ارسالی امروز</p>
              </div>
              <div className="clay-card p-3 bg-blue-900/30 text-center">
                <p className="text-2xl font-bold text-blue-200">{toPersianNumber(getAverageScore())}</p>
                <p className="text-xs text-blue-300">میانگین نمره</p>
              </div>
            </div>
          </div>

          <div className="clay-card p-6 bg-yellow-900/30">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💡</span>
              <h3 className="font-bold text-white">نکته روز</h3>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">
              برای کسب سکه بیشتر، تکالیف را زودتر از مهلت ارسال کن و نشان‌های جدید کسب کن!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}