import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, TrendingUp, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPersianDate, toPersianNumber } from "@/components/utils";
import { motion } from "framer-motion";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminReports() {
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    userGrowth: [],
    submissionStats: [],
    gradeDistribution: [],
    topStudents: []
  });

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, submissions, assignments] = await Promise.all([
        base44.entities.PublicProfile.list(),
        base44.entities.Submission.list(),
        base44.entities.Assignment.list()
      ]);

      // Process User Growth (Mock logic for demo based on created_date if available, else random)
      // Real implementation would aggregate by created_date
      const userGrowth = processUserGrowth(users, timeRange);

      // Process Submission Stats (Approved vs Pending)
      const submissionStats = [
        { name: 'تایید شده', value: submissions.filter(s => s.status === 'graded').length },
        { name: 'در انتظار', value: submissions.filter(s => s.status === 'pending').length },
        { name: 'تاخیر خورده', value: submissions.filter(s => s.status === 'late').length }
      ];

      // Process Top Students (by Coins/XP)
      const topStudents = users
        .filter(u => u.student_role === 'student')
        .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
        .slice(0, 5)
        .map(u => ({
          name: u.full_name,
          xp: u.total_xp || 0,
          coins: u.coins || 0,
          level: u.level || 1
        }));

      // Grade Distribution (Mock or derived from submissions scores)
      const gradeDistribution = [
        { name: '۰-۱۰', value: submissions.filter(s => (s.score || 0) <= 10).length },
        { name: '۱۰-۱۵', value: submissions.filter(s => (s.score || 0) > 10 && (s.score || 0) <= 15).length },
        { name: '۱۵-۲۰', value: submissions.filter(s => (s.score || 0) > 15).length }
      ];

      setReportData({
        userGrowth,
        submissionStats,
        topStudents,
        gradeDistribution
      });

    } catch (error) {
      console.error("Error loading reports:", error);
    }
    setLoading(false);
  };

  const processUserGrowth = (users, range) => {
    // Simplified logic: grouping users by creation date
    // In a real app, you'd filter by range
    const groups = {};
    users.forEach(u => {
      const date = u.created_date ? new Date(u.created_date).toLocaleDateString('fa-IR') : 'نامشخص';
      groups[date] = (groups[date] || 0) + 1;
    });
    
    // Take last 7 entries for chart
    return Object.keys(groups).slice(-7).map(date => ({
      date,
      count: groups[date]
    }));
  };

  const exportReport = () => {
    // Basic CSV Export logic
    const headers = "نام,نقش,امتیاز,سکه\n";
    const rows = reportData.topStudents.map(u => `"${u.name}",دانش‌آموز,${u.xp},${u.coins}`).join("\n");
    const blob = new Blob(["\uFEFF", headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "report.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-950 font-sans" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-cyan-500" />
            گزارش‌های تحلیلی
          </h1>
          <p className="text-slate-400 mt-2 text-lg">تحلیل عملکرد مدرسه و کاربران</p>
        </div>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="بازه زمانی" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              <SelectItem value="week">هفته اخیر</SelectItem>
              <SelectItem value="month">ماه اخیر</SelectItem>
              <SelectItem value="year">سال تحصیلی</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" /> خروجی اکسل
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Chart */}
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              روند رشد کاربران
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} 
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="کاربران جدید" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Submission Stats */}
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              وضعیت تکالیف
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.submissionStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {reportData.submissionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              توزیع نمرات
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} name="تعداد" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              دانش‌آموزان برتر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-700' : 'bg-slate-700'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{student.name}</p>
                      <p className="text-xs text-slate-400">سطح {student.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">{toPersianNumber(student.xp)} XP</p>
                    <p className="text-xs text-slate-500">{toPersianNumber(student.coins)} سکه</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}