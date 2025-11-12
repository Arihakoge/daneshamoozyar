import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Calendar, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toPersianNumber } from "@/utils";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری تابلوی امتیازات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <h1 className="text-4xl font-bold text-white">تابلوی امتیازات کل مدرسه</h1>
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <p className="text-gray-300 text-lg text-center">
          رتبه‌بندی و تحلیل عملکرد دانش‌آموزان
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="clay-card p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">بازه زمانی:</span>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="flex-1 clay-button text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">کل زمان</SelectItem>
                <SelectItem value="month">ماه اخیر</SelectItem>
                <SelectItem value="week">هفته اخیر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">پایه تحصیلی:</span>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="flex-1 clay-button text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
        <Card className="clay-card">
          <CardContent className="p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{toPersianNumber(students.length)}</div>
            <div className="text-sm text-gray-300">کل دانش‌آموزان</div>
          </CardContent>
        </Card>

        <Card className="clay-card">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {students.length > 0 ? 
                toPersianNumber((students.reduce((sum, s) => sum + s.averageScore, 0) / students.length).toFixed(1))
                : toPersianNumber(0)}
            </div>
            <div className="text-sm text-gray-300">میانگین کل</div>
          </CardContent>
        </Card>

        <Card className="clay-card">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-white mb-2">🪙</div>
            <div className="text-2xl font-bold text-white">
              {toPersianNumber(students.reduce((sum, s) => sum + s.coins, 0))}
            </div>
            <div className="text-sm text-gray-300">کل سکه‌ها</div>
          </CardContent>
        </Card>

        <Card className="clay-card">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-white mb-2">📚</div>
            <div className="text-2xl font-bold text-white">
              {toPersianNumber(students.reduce((sum, s) => sum + s.totalSubmissions, 0))}
            </div>
            <div className="text-sm text-gray-300">کل ارسال‌ها</div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="clay-card">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">لیست کامل رتبه‌بندی</h2>
            <div className="space-y-2">
              {students.map((student, index) => (
                <div key={student.user_id} className="clay-card p-4 flex items-center gap-4">
                  <div className="clay-button px-3 py-1 bg-purple-500 text-white font-bold">
                    #{toPersianNumber(index + 1)}
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: student.avatar_color }}
                  >
                    {student.profile_image_url ? (
                      <img src={student.profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      student.display_name?.charAt(0) || "د"
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{student.display_name || student.full_name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-300">
                      <span>📚 {student.grade}</span>
                      <span>⭐ {toPersianNumber(student.averageScore)}</span>
                      <span>🪙 {toPersianNumber(student.coins)}</span>
                      <span>📊 {toPersianNumber(student.combinedScore)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}