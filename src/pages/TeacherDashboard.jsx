import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, BookOpen, CheckCircle, Clock, AlertTriangle, TrendingUp, FileText, Calendar } from "lucide-react";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { toPersianDate, toPersianNumber } from "@/components/utils";
import { createPageUrl } from "@/utils";

function StatsCard({ title, value, icon: Icon, color = "purple", delay = 0 }) {
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
        </div>
        <Icon className={`w-10 h-10 ${colorClasses[color]}`} />
      </div>
    </motion.div>
  );
}

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allAssignments = await base44.entities.Assignment.list("-created_date");
      const teacherAssignments = allAssignments.filter(a => 
        a.teacher_id === currentUser.id && a.is_active === true
      );
      setAssignments(teacherAssignments);

      if (teacherAssignments.length > 0) {
        const assignmentIds = teacherAssignments.map(a => a.id);
        const allSubmissions = await base44.entities.Submission.list("-created_date");
        // Only include submissions for active assignments
        const teacherSubmissions = allSubmissions.filter(sub => assignmentIds.includes(sub.assignment_id));
        setSubmissions(teacherSubmissions);
      } else {
        setSubmissions([]);
      }

      const allPublicProfiles = await base44.entities.PublicProfile.list();
      // Fetch all students to ensure we can identify them in submissions regardless of teacher's primary grade
      const allStudents = allPublicProfiles
        .filter(p => p.student_role === 'student')
        .map(p => ({ ...p, id: p.user_id }));
      setStudents(allStudents);

    } catch (error) {
      console.error("خطا در بارگیری داده‌ها:", error);
    }
    setLoading(false);
  };

  const getPendingSubmissions = () => {
    return submissions.filter(sub => sub.status === "pending");
  };

  const getUnansweredAssignments = () => {
    return assignments.filter(assignment => {
      const assignmentSubmissions = submissions.filter(s => s.assignment_id === assignment.id);
      return assignmentSubmissions.length === 0;
    });
  };

  const getAverageScore = () => {
    const gradedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
    if (gradedSubmissions.length === 0) return 0;
    return (gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length).toFixed(1);
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
        id="teacher-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          سلام استاد {user?.display_name || user?.full_name || "محترم"}! 👨‍🏫
        </h1>
        <p className="text-gray-300 text-lg">
          معلم {(user?.teaching_assignments && user.teaching_assignments.length > 0) ? [...new Set(user.teaching_assignments.map(a => a.subject))].join("، ") : (user?.subjects ? user.subjects.join("، ") : (user?.subject || ""))}
        </p>
      </motion.div>

      <div id="teacher-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="تکالیف من"
          value={toPersianNumber(assignments.length)}
          icon={BookOpen}
          color="purple"
          delay={0.1}
        />
        <StatsCard
          title="در انتظار بررسی"
          value={toPersianNumber(getPendingSubmissions().length)}
          icon={Clock}
          color="orange"
          delay={0.2}
        />
        <StatsCard
          title="تصحیح شده"
          value={toPersianNumber(submissions.filter(s => s.status === "graded").length)}
          icon={CheckCircle}
          color="green"
          delay={0.3}
        />
        <StatsCard
          title="دانش‌آموزان پایه"
          value={toPersianNumber(students.length)}
          icon={Users}
          color="blue"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="clay-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">تکالیف بدون پاسخ</p>
                  <p className="text-3xl font-bold text-red-400">{toPersianNumber(getUnansweredAssignments().length)}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="clay-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">میانگین نمرات</p>
                  <p className="text-3xl font-bold text-blue-400">{toPersianNumber(getAverageScore())}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="clay-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">ارسال‌های دیرکرد</p>
                  <p className="text-3xl font-bold text-yellow-400">{toPersianNumber(submissions.filter(s => s.status === "late").length)}</p>
                </div>
                <Calendar className="w-12 h-12 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div 
            id="pending-reviews"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="clay-card p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">در انتظار بررسی</h2>
                  <p className="text-sm text-gray-400">تکالیفی که نیاز به تصحیح دارند</p>
                </div>
              </div>
              <Link to={createPageUrl("TeacherAssignments")}>
                <button className="clay-button px-4 py-2 bg-orange-500 text-white hover:bg-orange-600">
                  مشاهده همه
                </button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {getPendingSubmissions().length > 0 ? (
                getPendingSubmissions().slice(0, 3).map((submission, index) => {
                  const assignment = assignments.find(a => a.id === submission.assignment_id);
                  const student = students.find(s => s.id === submission.student_id);
                  
                  return (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="clay-card p-5 hover:shadow-lg transition-shadow duration-300 border-r-4 border-orange-500"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-white mb-1 text-lg">
                           {assignment?.title || "تکلیف حذف شده"}
                          </h3>
                          <div className="flex items-center gap-3 text-sm">
                           <p className="text-gray-300">
                             👤 {student?.full_name || student?.display_name || "کاربر ناشناس"}
                           </p>
                            <p className="text-gray-400">
                              📅 {submission.submitted_at ? toPersianDate(new Date(submission.submitted_at)) : "تاریخ نامشخص"}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-orange-500/20 text-orange-300">
                          ⏳ منتظر تصحیح
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">همه تکالیف تصحیح شده‌اند! 🎉</p>
                </div>
              )}
            </div>
          </motion.div>

          {getUnansweredAssignments().length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="clay-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">تکالیف بدون پاسخ</h2>
                  <p className="text-sm text-gray-400">تکالیفی که هیچ دانش‌آموزی به آن پاسخ نداده</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {getUnansweredAssignments().slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="clay-card p-4 border-r-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white">{assignment.title}</h3>
                        <p className="text-sm text-gray-400">
                          📅 مهلت: {assignment.due_date ? toPersianDate(new Date(assignment.due_date)) : "نامشخص"}
                        </p>
                      </div>
                      <Badge className="bg-red-500/20 text-red-300">
                        ⚠️ بدون پاسخ
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
          className="space-y-6"
        >
          <div className="clay-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">خلاصه کلاس</h2>
            </div>
            
            <div className="space-y-4">
              <div className="clay-card p-4 bg-purple-900/30">
                <p className="text-purple-300 text-sm font-medium">پایه تحصیلی</p>
                <p className="text-2xl font-bold text-purple-200 mt-1">{user?.grade}</p>
              </div>
              
              <div className="clay-card p-4 bg-blue-900/30">
                <p className="text-blue-300 text-sm font-medium">درس تخصصی</p>
                <p className="text-2xl font-bold text-blue-200 mt-1">{user?.subject}</p>
              </div>
              
              <div className="clay-card p-4 bg-green-900/30">
                <p className="text-green-300 text-sm font-medium">تعداد دانش‌آموزان</p>
                <p className="text-2xl font-bold text-green-200 mt-1">{toPersianNumber(students.length)}</p>
              </div>

              <div className="clay-card p-4 bg-yellow-900/30">
                <p className="text-yellow-300 text-sm font-medium">میانگین کلاس</p>
                <p className="text-2xl font-bold text-yellow-200 mt-1">{toPersianNumber(getAverageScore())}</p>
              </div>
            </div>
          </div>

          <div id="quick-actions" className="clay-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">دسترسی سریع</h2>
            <div className="space-y-3">
              <Link to={createPageUrl("TeacherAssignments")}>
                <button className="w-full clay-button p-3 text-white hover:bg-purple-500/20 flex items-center gap-3">
                  <BookOpen className="w-5 h-5" />
                  مدیریت تکالیف
                </button>
              </Link>
              <Link to={createPageUrl("TeacherScoreboard")}>
                <button className="w-full clay-button p-3 text-white hover:bg-blue-500/20 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5" />
                  تابلوی امتیازات
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}