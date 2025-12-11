import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  User as UserIcon, 
  Trophy, 
  BookOpen, 
  TrendingUp,
  Star,
  Award,
  Edit
} from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createPageUrl } from "@/utils";
import { toPersianNumber, normalizeScore } from "@/components/utils";

export default function StudentProfile() {
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allSubmissions = await base44.entities.Submission.list();
      const userSubmissions = allSubmissions.filter(s => s.student_id === currentUser.id);
      setSubmissions(userSubmissions);

      if (currentUser.grade) {
        const allAssignments = await base44.entities.Assignment.list();
        const classAssignments = allAssignments.filter(a => a.grade === currentUser.grade);
        setAssignments(classAssignments);
      }
    } catch (error) {
      console.error("خطا در بارگیری پروفایل:", error);
    }
    setLoading(false);
  };

  const getAverageScore = () => {
    const gradedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
    if (gradedSubmissions.length === 0) return 0;
    
    const totalNormalized = gradedSubmissions.reduce((sum, s) => {
      const assignment = assignments.find(a => a.id === s.assignment_id);
      return sum + normalizeScore(s.score, assignment?.max_score);
    }, 0);
    
    return (totalNormalized / gradedSubmissions.length).toFixed(1);
  };

  const getProgressData = () => {
    return submissions
      .filter(s => s.score !== null)
      .slice(-10)
      .map((s, index) => {
        const assignment = assignments.find(a => a.id === s.assignment_id);
        return {
          assignment: `تکلیف ${index + 1}`,
          score: normalizeScore(s.score, assignment?.max_score)
        };
      });
  };

  const getSubjectStats = () => {
    const stats = {};
    submissions.forEach(submission => {
      const assignment = assignments.find(a => a.id === submission.assignment_id);
      if (assignment && submission.score !== null) {
        if (!stats[assignment.subject]) {
          stats[assignment.subject] = { total: 0, count: 0, scores: [] };
        }
        const normalized = normalizeScore(submission.score, assignment.max_score);
        stats[assignment.subject].total += normalized;
        stats[assignment.subject].count += 1;
        stats[assignment.subject].scores.push(normalized);
      }
    });

    return Object.keys(stats).map(subject => ({
      subject,
      average: (stats[subject].total / stats[subject].count).toFixed(1),
      count: stats[subject].count
    }));
  };

  const getLevelProgress = () => {
    const baseCoinsPerLevel = 100;
    const currentLevel = user?.level || 1;
    const currentCoins = user?.coins || 0;
    const coinsForCurrentLevelStart = (currentLevel - 1) * baseCoinsPerLevel;
    const coinsEarnedInCurrentLevel = currentCoins - coinsForCurrentLevelStart;
    const coinsToReachNextLevel = baseCoinsPerLevel;
    const progress = (coinsEarnedInCurrentLevel / coinsToReachNextLevel) * 100;
    
    return {
      currentLevel,
      nextLevel: currentLevel + 1,
      progress: Math.min(Math.max(progress, 0), 100),
      coinsNeeded: Math.max(0, coinsToReachNextLevel - coinsEarnedInCurrentLevel)
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری پروفایل...</p>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelProgress();
  const subjectStats = getSubjectStats();
  const progressData = getProgressData();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <UserIcon className="w-10 h-10 text-purple-500" />
            پروفایل من
          </h1>
          <p className="text-gray-300 text-lg">نمای کلی از پیشرفت تحصیلی شما</p>
        </div>
        <Link to={createPageUrl("EditProfile")}>
          <Button className="clay-button bg-purple-500 text-white hover:bg-purple-600">
            <Edit className="w-4 h-4 ml-2" />
            ویرایش پروفایل
          </Button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="clay-card p-6"
        >
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center relative ${user?.active_frame || "border-4 border-purple-500"}`}>
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-bold"
                    style={{ backgroundColor: user?.avatar_color || "#8B5CF6" }}
                  >
                    {(user?.full_name || "کاربر").charAt(0)}
                  </div>
                )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {user?.full_name || "دانش‌آموز"}
            </h2>
            <Badge className="bg-purple-100 text-purple-800 mb-4">
              دانش‌آموز
            </Badge>
            
            {/* Level Progress */}
            <div className="clay-card p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">سطح {toPersianNumber(levelInfo.currentLevel)}</span>
                <span className="text-sm font-medium text-gray-300">سطح {toPersianNumber(levelInfo.nextLevel)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {toPersianNumber(levelInfo.coinsNeeded)} سکه تا سطح بعدی
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="clay-card p-4 text-center">
                <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{toPersianNumber(user?.coins || 0)}</div>
                <div className="text-sm text-gray-300">سکه</div>
              </div>
              <div className="clay-card p-4 text-center">
                <Star className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{toPersianNumber(user?.level || 1)}</div>
                <div className="text-sm text-gray-300">سطح</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="clay-card">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{toPersianNumber(submissions.length)}</div>
                <div className="text-sm text-gray-300">تکالیف ارسال شده</div>
              </CardContent>
            </Card>

            <Card className="clay-card">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{toPersianNumber(getAverageScore())}</div>
                <div className="text-sm text-gray-300">میانگین نمرات</div>
              </CardContent>
            </Card>

            <Card className="clay-card">
              <CardContent className="p-6 text-center">
                <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {toPersianNumber(submissions.filter(s => s.status === "graded").length)}
                </div>
                <div className="text-sm text-gray-300">تکالیف نمره گرفته</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Progress Chart */}
          {progressData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="clay-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    نمودار پیشرفت
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="assignment" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#8B5CF6" 
                        strokeWidth={3}
                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Subject Stats */}
          {subjectStats.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="clay-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    عملکرد در دروس
                  </h3>
                  <div className="space-y-4">
                    {subjectStats.map((stat) => (
                      <div key={stat.subject} className="clay-card p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white">
                              📚 {stat.subject}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {toPersianNumber(stat.count)} تکلیف ارسال شده
                            </p>
                          </div>
                          <div className="text-left">
                            <div className="text-2xl font-bold text-purple-400">
                              {toPersianNumber(stat.average)}
                            </div>
                            <div className="text-sm text-gray-500">میانگین</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}