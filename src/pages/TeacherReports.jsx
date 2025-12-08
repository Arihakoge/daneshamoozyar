import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { 
  FileText, Download, Calendar, TrendingUp, Users, 
  CheckCircle, Clock, Award, BookOpen 
} from "lucide-react";
import { motion } from "framer-motion";
import { toPersianNumber, toPersianDate, normalizeScore } from "@/components/utils";

export default function TeacherReports() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [timeRange, setTimeRange] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [userSettings, setUserSettings] = useState(null);
  
  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load user settings for default time range
      const settings = await base44.entities.UserSettings.filter({ user_id: currentUser.id });
      if (settings.length > 0) {
        setUserSettings(settings[0]);
        setTimeRange(settings[0].default_time_range || "all");
      }

      // Get teacher's assignments without filtering by grade/subject
      const teacherAssignments = await base44.entities.Assignment.filter({
        teacher_id: currentUser.id,
        is_active: true
      });
      setAssignments(teacherAssignments);

      const assignmentIds = teacherAssignments.map(a => a.id);
      const allSubmissions = await base44.entities.Submission.list();
      
      // Only include submissions for active assignments
      const relevantSubmissions = allSubmissions.filter(s => assignmentIds.includes(s.assignment_id));
      setSubmissions(relevantSubmissions);

      // Get all student profiles
      const allPublicProfiles = await base44.entities.PublicProfile.list();
      const allStudents = allPublicProfiles.filter(p => p.student_role === "student");
      setStudents(allStudents);

    } catch (error) {
      console.error("خطا در بارگیری داده‌های گزارش:", error);
    }
    setLoading(false);
  };

  const getFilteredSubmissions = () => {
    let filtered = [...submissions];

    if (timeRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(s => new Date(s.created_date) >= weekAgo);
    } else if (timeRange === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(s => new Date(s.created_date) >= monthAgo);
    } else if (timeRange === "semester") {
      const semesterAgo = new Date();
      semesterAgo.setMonth(semesterAgo.getMonth() - 4);
      filtered = filtered.filter(s => new Date(s.created_date) >= semesterAgo);
    }

    if (selectedStudent !== "all") {
      filtered = filtered.filter(s => s.student_id === selectedStudent);
    }

    return filtered;
  };

  const getClassPerformanceData = () => {
    const filteredSubmissions = getFilteredSubmissions();
    const gradedSubmissions = filteredSubmissions.filter(s => s.score !== null);
    
    const scoreRanges = [
      { range: "۰-۵", count: 0 },
      { range: "۶-۱۰", count: 0 },
      { range: "۱۱-۱۵", count: 0 },
      { range: "۱۶-۲۰", count: 0 }
    ];

    gradedSubmissions.forEach(sub => {
      const assignment = assignments.find(a => a.id === sub.assignment_id);
      const normalized = normalizeScore(sub.score, assignment?.max_score);
      
      if (normalized <= 5) scoreRanges[0].count++;
      else if (normalized <= 10) scoreRanges[1].count++;
      else if (normalized <= 15) scoreRanges[2].count++;
      else scoreRanges[3].count++;
    });

    return scoreRanges;
  };

  const getStudentActivityData = () => {
    const filteredSubmissions = getFilteredSubmissions();
    const studentActivity = students.map(student => {
      const studentSubs = filteredSubmissions.filter(s => s.student_id === student.user_id);
      const gradedSubs = studentSubs.filter(s => s.score !== null);
      
      const avgScore = gradedSubs.length > 0 
        ? gradedSubs.reduce((sum, s) => {
            const assignment = assignments.find(a => a.id === s.assignment_id);
            return sum + normalizeScore(s.score, assignment?.max_score);
          }, 0) / gradedSubs.length 
        : 0;

      return {
        name: student.display_name || student.full_name || "کاربر حذف شده",
        submitted: studentSubs.length,
        graded: gradedSubs.length,
        average: parseFloat(avgScore.toFixed(1))
      };
    }).filter(s => s.submitted > 0);

    return studentActivity.sort((a, b) => b.average - a.average).slice(0, 10);
  };

  const getSubmissionTrendData = () => {
    const filteredSubmissions = getFilteredSubmissions();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const daySubmissions = filteredSubmissions.filter(s => 
        new Date(s.created_date).toDateString() === dateStr
      );
      
      last7Days.push({
        date: toPersianDate(date).split(' ').slice(1, 3).join(' '),
        count: daySubmissions.length
      });
    }
    
    return last7Days;
  };

  const getStatusDistribution = () => {
    const filteredSubmissions = getFilteredSubmissions();
    return [
      { name: "در انتظار بررسی", value: filteredSubmissions.filter(s => s.status === "pending").length, color: "#F59E0B" },
      { name: "نمره داده شده", value: filteredSubmissions.filter(s => s.status === "graded").length, color: "#10B981" },
      { name: "دیرکرد", value: filteredSubmissions.filter(s => s.status === "late").length, color: "#EF4444" }
    ];
  };

  const getTopStudents = () => {
    const filteredSubmissions = getFilteredSubmissions();
    const studentStats = students.map(student => {
      const studentSubs = filteredSubmissions.filter(s => s.student_id === student.user_id);
      const gradedSubs = studentSubs.filter(s => s.score !== null);
      
      const avgScore = gradedSubs.length > 0 
        ? gradedSubs.reduce((sum, s) => {
            const assignment = assignments.find(a => a.id === s.assignment_id);
            return sum + normalizeScore(s.score, assignment?.max_score);
          }, 0) / gradedSubs.length 
        : 0;

      return {
        ...student,
        totalSubmissions: studentSubs.length,
        avgScore: parseFloat(avgScore.toFixed(1))
      };
    });

    return studentStats.sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
  };

  const exportToCSV = () => {
    const filteredSubmissions = getFilteredSubmissions();
    const csvData = filteredSubmissions.map(sub => {
      const assignment = assignments.find(a => a.id === sub.assignment_id);
      const student = students.find(s => s.user_id === sub.student_id);
      
      return {
        "دانش‌آموز": student?.display_name || student?.full_name || "کاربر حذف شده",
        "تکلیف": assignment?.title || "تکلیف حذف شده",
        "نمره": sub.score || "-",
        "وضعیت": sub.status === "graded" ? "نمره داده شده" : sub.status === "pending" ? "در انتظار" : "دیرکرد",
        "تاریخ ارسال": toPersianDate(sub.created_date)
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => headers.map(h => row[h]).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `گزارش_${user?.subject}_${new Date().toLocaleDateString("fa-IR")}.csv`;
    link.click();
  };

  const getSummaryStats = () => {
    const filteredSubmissions = getFilteredSubmissions();
    const gradedSubmissions = filteredSubmissions.filter(s => s.score !== null);
    
    const avgScore = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => {
          const assignment = assignments.find(a => a.id === s.assignment_id);
          return sum + normalizeScore(s.score, assignment?.max_score);
        }, 0) / gradedSubmissions.length
      : 0;

    return {
      totalAssignments: assignments.length,
      totalSubmissions: filteredSubmissions.length,
      gradedSubmissions: gradedSubmissions.length,
      pendingSubmissions: filteredSubmissions.filter(s => s.status === "pending").length,
      averageScore: parseFloat(avgScore.toFixed(1)),
      activeStudents: new Set(filteredSubmissions.map(s => s.student_id)).size
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">در حال بارگیری گزارش‌ها...</p>
        </div>
      </div>
    );
  }

  const stats = getSummaryStats();
  const performanceData = getClassPerformanceData();
  const activityData = getStudentActivityData();
  const trendData = getSubmissionTrendData();
  const statusData = getStatusDistribution();
  const topStudents = getTopStudents();

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <FileText className="w-10 h-10 text-purple-500" />
              گزارش‌های عملکرد کلاس
            </h1>
            <p className="text-gray-300 text-lg">
              گزارش تمامی تکالیف شما
            </p>
          </div>
          <Button 
            onClick={exportToCSV}
            className="clay-button bg-gradient-to-r from-green-500 to-blue-500 text-white"
          >
            <Download className="w-5 h-5 mr-2" />
            دریافت CSV
          </Button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="clay-card p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">بازه زمانی:</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="clay-button text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه زمان‌ها</SelectItem>
                <SelectItem value="week">هفته اخیر</SelectItem>
                <SelectItem value="month">ماه اخیر</SelectItem>
                <SelectItem value="semester">نیمسال جاری</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">دانش‌آموز:</label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="clay-button text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دانش‌آموزان</SelectItem>
                {students.map(student => (
                  <SelectItem key={student.user_id} value={student.user_id}>
                    {student.display_name || student.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={loadReportData}
              className="w-full clay-button bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
            >
              بروزرسانی گزارش
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="clay-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">کل تکالیف</p>
                  <p className="text-3xl font-bold text-white">{toPersianNumber(stats.totalAssignments)}</p>
                </div>
                <BookOpen className="w-12 h-12 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="clay-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">کل ارسالی‌ها</p>
                  <p className="text-3xl font-bold text-white">{toPersianNumber(stats.totalSubmissions)}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="clay-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">در انتظار بررسی</p>
                  <p className="text-3xl font-bold text-white">{toPersianNumber(stats.pendingSubmissions)}</p>
                </div>
                <Clock className="w-12 h-12 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
          <Card className="clay-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">میانگین نمرات</p>
                  <p className="text-3xl font-bold text-white">{toPersianNumber(stats.averageScore)}</p>
                </div>
                <Award className="w-12 h-12 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <Card className="clay-card h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                روند ارسال تکالیف (۷ روز اخیر)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
          <Card className="clay-card h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart className="w-6 h-6 text-blue-400" />
                توزیع نمرات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-green-400" />
                فعالیت دانش‌آموزان (برترین‌ها)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={activityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={150} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend />
                  <Bar dataKey="submitted" fill="#8B5CF6" name="ارسال شده" />
                  <Bar dataKey="graded" fill="#10B981" name="نمره داده شده" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-400" />
                برترین دانش‌آموزان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topStudents.length > 0 ? topStudents.map((student, index) => (
                  <div key={student.user_id} className="clay-card p-4 flex items-center gap-3">
                    <div className="clay-button px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold">
                      #{toPersianNumber(index + 1)}
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: student.avatar_color || "#8B5CF6" }}
                    >
                      {student.profile_image_url ? (
                        <img src={student.profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        (student.display_name || student.full_name || "د").charAt(0)
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{student.display_name || student.full_name || "کاربر حذف شده"}</p>
                      <p className="text-sm text-gray-400">
                        میانگین: {toPersianNumber(student.avgScore)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-400 py-8">هنوز داده‌ای وجود ندارد</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white">گزارش جامع وضعیت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="clay-card p-4 bg-green-900/20">
                <p className="text-green-300 text-sm mb-2">نمره داده شده</p>
                <p className="text-3xl font-bold text-green-200">{toPersianNumber(stats.gradedSubmissions)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.totalSubmissions > 0 
                    ? toPersianNumber(Math.round((stats.gradedSubmissions / stats.totalSubmissions) * 100)) + '%'
                    : '۰%'
                  } از کل
                </p>
              </div>

              <div className="clay-card p-4 bg-orange-900/20">
                <p className="text-orange-300 text-sm mb-2">در انتظار بررسی</p>
                <p className="text-3xl font-bold text-orange-200">{toPersianNumber(stats.pendingSubmissions)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  نیاز به تصحیح
                </p>
              </div>

              <div className="clay-card p-4 bg-blue-900/20">
                <p className="text-blue-300 text-sm mb-2">دانش‌آموزان فعال</p>
                <p className="text-3xl font-bold text-blue-200">{toPersianNumber(stats.activeStudents)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  از {toPersianNumber(students.length)} نفر
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}