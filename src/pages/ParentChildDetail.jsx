import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight,
  BookOpen,
  Trophy,
  TrendingUp,
  Calendar,
  Award,
  Target,
  Star,
  AlertCircle
} from "lucide-react";
import { toPersianNumber, toPersianDateShort, formatDaysRemaining, normalizeScore } from "@/components/utils";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { createPageUrl } from "@/utils";

export default function ParentChildDetail() {
  const [child, setChild] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildData();
  }, []);

  const loadChildData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const childId = urlParams.get("childId");

      if (!childId) {
        window.location.href = createPageUrl("ParentDashboard");
        return;
      }

      const [childProfile, childAssignments, childSubmissions, childBadges] = await Promise.all([
        base44.entities.PublicProfile.filter({ user_id: childId }),
        base44.entities.Assignment.list(),
        base44.entities.Submission.filter({ student_id: childId }),
        base44.entities.Badge.filter({ user_id: childId })
      ]);

      if (childProfile.length === 0) {
        window.location.href = createPageUrl("ParentDashboard");
        return;
      }

      const profile = childProfile[0];
      const relevantAssignments = childAssignments.filter(a => a.grade === profile.grade);

      setChild(profile);
      setAssignments(relevantAssignments);
      setSubmissions(childSubmissions);
      setBadges(childBadges);
    } catch (error) {
      console.error("خطا در بارگیری اطلاعات:", error);
    }
    setLoading(false);
  };

  const getAverageScore = () => {
    const gradedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
    if (gradedSubmissions.length === 0) return 0;
    
    const totalNormalized = gradedSubmissions.reduce((sum, sub) => {
      const assignment = assignments.find(a => a.id === sub.assignment_id);
      return sum + normalizeScore(sub.score, assignment?.max_score);
    }, 0);
    
    return (totalNormalized / gradedSubmissions.length).toFixed(1);
  };

  const getProgressData = () => {
    const recentSubmissions = submissions
      .filter(s => s.score !== null)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      .slice(-10);

    return recentSubmissions.map(sub => {
      const assignment = assignments.find(a => a.id === sub.assignment_id);
      return {
        name: assignment?.title?.substring(0, 15) + "..." || "تکلیف",
        score: normalizeScore(sub.score, assignment?.max_score)
      };
    });
  };

  const getSubjectStats = () => {
    const subjectData = {};
    
    submissions.forEach(sub => {
      if (sub.score === null || sub.score === undefined) return;
      const assignment = assignments.find(a => a.id === sub.assignment_id);
      if (!assignment) return;
      
      if (!subjectData[assignment.subject]) {
        subjectData[assignment.subject] = { total: 0, count: 0 };
      }
      
      subjectData[assignment.subject].total += normalizeScore(sub.score, assignment.max_score);
      subjectData[assignment.subject].count += 1;
    });

    return Object.entries(subjectData).map(([subject, data]) => ({
      subject,
      average: (data.total / data.count).toFixed(1)
    }));
  };

  const getPendingAssignments = () => {
    return assignments.filter(a => 
      a.due_date && 
      new Date(a.due_date) > new Date() &&
      !submissions.some(s => s.assignment_id === a.id)
    ).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">در حال بارگیری...</p>
        </div>
      </div>
    );
  }

  const progressData = getProgressData();
  const subjectStats = getSubjectStats();
  const pendingAssignments = getPendingAssignments();

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button 
          onClick={() => window.location.href = createPageUrl("ParentDashboard")}
          variant="ghost"
          className="clay-button mb-4 text-white"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت به پنل والدین
        </Button>
        
        <div className="flex items-center gap-4">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl"
            style={{ backgroundColor: child?.avatar_color || "#8B5CF6" }}
          >
            {(child?.display_name || child?.full_name || "؟").charAt(0)}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {child?.display_name || child?.full_name}
            </h1>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">
                پایه {child?.grade}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                سطح {toPersianNumber(child?.level || 1)}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800">
                🪙 {toPersianNumber(child?.coins || 0)}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="clay-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span className="text-gray-400 text-sm">میانگین نمرات</span>
          </div>
          <p className="text-3xl font-bold text-white">{getAverageScore()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="clay-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <span className="text-gray-400 text-sm">تکالیف ارسالی</span>
          </div>
          <p className="text-3xl font-bold text-white">{toPersianNumber(submissions.length)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="clay-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-purple-400" />
            <span className="text-gray-400 text-sm">نشان‌ها</span>
          </div>
          <p className="text-3xl font-bold text-white">{toPersianNumber(badges.length)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="clay-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-6 h-6 text-orange-400" />
            <span className="text-gray-400 text-sm">سطح فعلی</span>
          </div>
          <p className="text-3xl font-bold text-white">{toPersianNumber(child?.level || 1)}</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="clay-card p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            روند پیشرفت
          </h2>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis domain={[0, 20]} stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">هنوز نمره‌ای ثبت نشده</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="clay-card p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            عملکرد در دروس
          </h2>
          {subjectStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="subject" stroke="#9CA3AF" />
                <YAxis domain={[0, 20]} stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="average" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">هنوز نمره‌ای ثبت نشده</p>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="clay-card p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          تکالیف در انتظار ({toPersianNumber(pendingAssignments.length)})
        </h2>
        {pendingAssignments.length > 0 ? (
          <div className="space-y-3">
            {pendingAssignments.map(assignment => (
              <div key={assignment.id} className="clay-card p-4 border-r-4 border-orange-400">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white mb-1">{assignment.title}</h3>
                    <p className="text-sm text-gray-400">📚 {assignment.subject}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-orange-300 mb-1">
                      مهلت: {toPersianDateShort(assignment.due_date)}
                    </p>
                    <p className="text-xs text-orange-400">
                      {formatDaysRemaining(assignment.due_date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">تمام تکالیف ارسال شده‌اند! 🎉</p>
        )}
      </motion.div>
    </div>
  );
}