import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Star, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toPersianNumber } from "@/components/utils";

export default function TeacherScoreboard() {
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    loadScoreboardData();
  }, [timeRange]);

  const loadScoreboardData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Fetch all assignments created by this teacher
      const teacherAssignments = await base44.entities.Assignment.filter({
        teacher_id: user.id
      });
      const teacherAssignmentIds = teacherAssignments.map(a => a.id);
      const taughtGrades = [...new Set(teacherAssignments.map(a => a.grade))];

      const allPublicProfiles = await base44.entities.PublicProfile.list();
      // Filter students who are in the grades taught by this teacher
      const relevantStudents = allPublicProfiles.filter(p => 
        taughtGrades.includes(p.grade) && p.student_role === "student"
      );
      
      const studentsWithStats = await Promise.all(
        relevantStudents.map(async (student) => {
          const allSubmissions = await base44.entities.Submission.filter({ student_id: student.user_id });
          
          // Only consider submissions for assignments created by this teacher
          const relevantSubmissions = allSubmissions.filter(s => teacherAssignmentIds.includes(s.assignment_id));
          
          let filteredSubmissions = relevantSubmissions;
          if (timeRange === "week") {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            filteredSubmissions = relevantSubmissions.filter(s => 
              new Date(s.created_date) >= weekAgo
            );
          } else if (timeRange === "month") {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filteredSubmissions = relevantSubmissions.filter(s => 
              new Date(s.created_date) >= monthAgo
            );
          }
          
          const gradedSubmissions = filteredSubmissions.filter(s => s.score !== null && s.score !== undefined);
          
          const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.score, 0);
          const averageScore = gradedSubmissions.length > 0 ? totalScore / gradedSubmissions.length : 0;
          
          return {
            ...student,
            totalSubmissions: filteredSubmissions.length,
            gradedSubmissions: gradedSubmissions.length,
            totalScore,
            averageScore: parseFloat(averageScore.toFixed(1))
          };
        })
      );

      // Filter out students with 0 activity if list is too long, or keep all?
      // Let's keep all but sort them.
      studentsWithStats.sort((a, b) => {
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
        return b.gradedSubmissions - a.gradedSubmissions;
      });

      setStudents(studentsWithStats);
    } catch (error) {
      console.error("خطا در بارگیری تابلوی امتیازات:", error);
    }
    setLoading(false);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-500" />;
      default: return <Trophy className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3: return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "week": return "هفته اخیر";
      case "month": return "ماه اخیر";
      default: return "کل زمان";
    }
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
          <h1 className="text-4xl font-bold text-white">تابلوی امتیازات کلاس</h1>
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <p className="text-gray-300 text-lg text-center">
          رتبه‌بندی عملکرد دانش‌آموزان در دروس شما
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="clay-card p-4 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">بازه زمانی:</span>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48 clay-button text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">کل زمان</SelectItem>
              <SelectItem value="month">ماه اخیر</SelectItem>
              <SelectItem value="week">هفته اخیر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {students.length >= 3 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-end justify-center gap-6 h-80">
            <div className="text-center">
              <div className="clay-card p-6 bg-gradient-to-br from-gray-100 to-gray-200 h-40 flex flex-col items-center justify-center mb-4">
                <Medal className="w-8 h-8 text-gray-500 mb-2" />
                <div className="text-2xl font-bold text-gray-700">2</div>
              </div>
              <div
                className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xl font-bold border-4 border-gray-300 shadow-lg"
                style={{ backgroundColor: students[1].avatar_color }}
              >
                {students[1].profile_image_url ? (
                  <img src={students[1].profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (students[1].full_name || "کاربر").charAt(0)
                )}
              </div>
              <h3 className="font-bold text-white">{students[1].full_name || "کاربر"}</h3>
              <p className="text-sm text-gray-300">⭐ {toPersianNumber(students[1].averageScore)}</p>
              <p className="text-xs text-gray-400">{toPersianNumber(students[1].gradedSubmissions)} تکلیف</p>
            </div>

            <div className="text-center">
              <div className="clay-card p-6 bg-gradient-to-br from-yellow-200 to-yellow-400 h-52 flex flex-col items-center justify-center mb-4">
                <Crown className="w-10 h-10 text-yellow-600 mb-2" />
                <div className="text-3xl font-bold text-yellow-700">1</div>
              </div>
              <div
                className="w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-2xl font-bold border-4 border-yellow-400"
                style={{ backgroundColor: students[0].avatar_color }}
              >
                {students[0].profile_image_url ? (
                  <img src={students[0].profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (students[0].full_name || "کاربر").charAt(0)
                )}
              </div>
              <h3 className="font-bold text-white text-lg">{students[0].full_name || "کاربر"}</h3>
              <p className="text-gray-300">⭐ {toPersianNumber(students[0].averageScore)}</p>
              <p className="text-sm text-gray-400">{toPersianNumber(students[0].gradedSubmissions)} تکلیف</p>
              <Badge className="bg-yellow-500 text-white mt-1">👑 برتر کلاس</Badge>
            </div>

            <div className="text-center">
              <div className="clay-card p-6 bg-gradient-to-br from-orange-100 to-orange-300 h-32 flex flex-col items-center justify-center mb-4">
                <Award className="w-7 h-7 text-orange-600 mb-2" />
                <div className="text-xl font-bold text-orange-700">3</div>
              </div>
              <div
                className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: students[2].avatar_color }}
              >
                {students[2].profile_image_url ? (
                  <img src={students[2].profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (students[2].full_name || "کاربر").charAt(0)
                )}
              </div>
              <h3 className="font-bold text-white">{students[2].full_name || "کاربر"}</h3>
              <p className="text-sm text-gray-300">⭐ {toPersianNumber(students[2].averageScore)}</p>
              <p className="text-xs text-gray-400">{toPersianNumber(students[2].gradedSubmissions)} تکلیف</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              لیست کامل رتبه‌بندی - {getTimeRangeLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2">
              {students.map((student, index) => {
                const rank = index + 1;
                
                return (
                  <motion.div
                    key={student.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="clay-card p-4 m-4 hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`clay-button px-4 py-2 ${getRankBadgeColor(rank)}`}>
                        <div className="flex items-center gap-2">
                          {getRankIcon(rank)}
                          <span className="font-bold">#{toPersianNumber(rank)}</span>
                        </div>
                      </div>

                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: student.avatar_color }}
                      >
                        {student.profile_image_url ? (
                          <img src={student.profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (student.full_name || "کاربر").charAt(0)
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-white">
                          {student.full_name || "کاربر"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-300 mt-1">
                          <span>📚 {student.totalSubmissions} ارسالی</span>
                          <span>✅ {toPersianNumber(student.gradedSubmissions)} نمره‌دهی شده</span>
                          <span>🏆 سطح {toPersianNumber(student.level)}</span>
                          <span>🎓 {student.grade}</span>
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="clay-button px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">⭐</span>
                            <span className="font-bold text-lg">{toPersianNumber(student.averageScore)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {students.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">هنوز دانش‌آموزی در این کلاس نمره نگرفته است</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}