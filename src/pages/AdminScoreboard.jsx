import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, Calendar, GraduationCap, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toPersianNumber } from "@/components/utils";

export default function AdminScoreboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");

  useEffect(() => {
    loadScoreboardData();
  }, [timeRange, selectedGrade]);

  const loadScoreboardData = async () => {
    try {
      const allPublicProfiles = await base44.entities.PublicProfile.list();
      let studentProfiles = allPublicProfiles.filter(p => p.student_role === "student");
      
      if (selectedGrade !== "all") {
        studentProfiles = studentProfiles.filter(s => s.grade === selectedGrade);
      }
      
      const studentsWithStats = await Promise.all(
        studentProfiles.map(async (student) => {
          let submissions = await base44.entities.Submission.filter({ student_id: student.user_id });
          
          if (timeRange === "week") {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            submissions = submissions.filter(s => new Date(s.created_date) >= weekAgo);
          } else if (timeRange === "month") {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            submissions = submissions.filter(s => new Date(s.created_date) >= monthAgo);
          }
          
          const gradedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
          
          const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.score, 0);
          const averageScore = gradedSubmissions.length > 0 ? totalScore / gradedSubmissions.length : 0;
          
          const normalizedCoins = (student.coins || 0) / 100;
          const normalizedAverage = averageScore / 20;
          const combinedScore = (normalizedCoins * 50) + (normalizedAverage * 50);
          
          return {
            ...student,
            totalSubmissions: submissions.length,
            gradedSubmissions: gradedSubmissions.length,
            totalScore,
            averageScore: parseFloat(averageScore.toFixed(1)),
            combinedScore: parseFloat(combinedScore.toFixed(2))
          };
        })
      );

      studentsWithStats.sort((a, b) => {
        if (b.combinedScore !== a.combinedScore) return b.combinedScore - a.combinedScore;
        return b.totalSubmissions - a.totalSubmissions;
      });

      setStudents(studentsWithStats);
    } catch (error) {
      console.error("خطا در بارگیری تابلوی امتیازات:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl font-bold text-white">تابلوی امتیازات کل مدرسه</h1>
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-slate-400 text-lg">
            رتبه‌بندی و تحلیل عملکرد دانش‌آموزان
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-slate-300 font-medium whitespace-nowrap">بازه زمانی:</span>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="all">کل زمان</SelectItem>
                  <SelectItem value="month">ماه اخیر</SelectItem>
                  <SelectItem value="week">هفته اخیر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-300 font-medium whitespace-nowrap">پایه تحصیلی:</span>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="all">همه پایه‌ها</SelectItem>
                  <SelectItem value="هفتم">هفتم</SelectItem>
                  <SelectItem value="هشتم">هشتم</SelectItem>
                  <SelectItem value="نهم">نهم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            { icon: Trophy, color: "text-yellow-500", value: students.length, label: "کل دانش‌آموزان" },
            { 
              icon: TrendingUp, 
              color: "text-green-500", 
              value: students.length > 0 
                ? (students.reduce((sum, s) => sum + s.averageScore, 0) / students.length).toFixed(1)
                : 0, 
              label: "میانگین کل" 
            },
            { 
              icon: Medal, 
              color: "text-orange-500", 
              value: students.reduce((sum, s) => sum + s.coins, 0), 
              label: "کل سکه‌ها" 
            },
            { 
              icon: GraduationCap, 
              color: "text-blue-500", 
              value: students.reduce((sum, s) => sum + s.totalSubmissions, 0), 
              label: "کل ارسال‌ها" 
            }
          ].map((stat, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-6 text-center">
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-white mb-1">{toPersianNumber(stat.value)}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                لیست کامل رتبه‌بندی
              </h2>
              <div className="space-y-3">
                {students.map((student, index) => (
                  <div key={student.user_id} className="group flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-cyan-500/30 transition-all">
                    <div className={`
                      w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm
                      ${index < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-700 text-slate-300'}
                    `}>
                      {toPersianNumber(index + 1)}
                    </div>
                    
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                      style={{ backgroundColor: student.avatar_color || '#64748b' }}
                    >
                      {student.profile_image_url ? (
                        <img src={student.profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        (student.full_name || "?").charAt(0)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{student.full_name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-slate-500" /> 
                          {student.grade || "بدون پایه"}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" /> 
                          معدل: {toPersianNumber(student.averageScore)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                         <span>{toPersianNumber(student.coins)}</span>
                         <span className="text-[10px]">سکه</span>
                      </div>
                      <div className="text-xs text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded">
                        {toPersianNumber(student.combinedScore)} امتیاز تراز
                      </div>
                    </div>
                  </div>
                ))}

                {students.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    موردی یافت نشد.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}