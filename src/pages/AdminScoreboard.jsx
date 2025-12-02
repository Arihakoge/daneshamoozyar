import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Medal, Award, Crown, Star, TrendingUp, Calendar, GraduationCap, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toPersianNumber } from "@/components/utils";
import { Badge } from "@/components/ui/badge";

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
      const allUsers = await base44.entities.User.list();
      const validUserIds = allUsers.map(u => u.id);

      const allPublicProfiles = await base44.entities.PublicProfile.list();
      let studentProfiles = allPublicProfiles.filter(p => 
        p.student_role === "student" && validUserIds.includes(p.user_id)
      );
      
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-full mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          تابلوی امتیازات کل مدرسه
        </h1>
        <p className="text-gray-400 text-lg">
          رتبه‌بندی و تحلیل عملکرد دانش‌آموزان
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
        <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">
          <div className="px-3 py-1.5 flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">بازه زمانی:</span>
          </div>
          <div className="flex gap-1">
            {['all', 'month', 'week'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  timeRange === t 
                    ? "bg-purple-600 text-white shadow-lg" 
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                {t === 'all' ? 'کل زمان' : t === 'month' ? 'ماه اخیر' : 'هفته اخیر'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">
          <div className="px-3 py-1.5 flex items-center gap-2 text-slate-400">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm">پایه:</span>
          </div>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-32 h-9 bg-slate-700/50 border-0 text-white focus:ring-0">
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

      {/* Top 3 Podium */}
      {students.length >= 3 && (
        <div className="relative mb-20 mt-8">
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8">
            
            {/* Rank 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="order-2 md:order-1 w-full md:w-1/3 max-w-[280px]"
            >
               <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex flex-col items-center relative mt-12 md:mt-0">
                <div className="absolute -top-10">
                   <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-slate-300 to-slate-500 shadow-lg shadow-slate-500/20">
                     <div className="w-full h-full rounded-full bg-slate-800 overflow-hidden relative">
                        {students[1].profile_image_url ? (
                          <img src={students[1].profile_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-300 font-bold text-2xl">
                            {(students[1].full_name || "U").charAt(0)}
                          </div>
                        )}
                     </div>
                     <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-bold border-2 border-slate-800 shadow-sm">
                       2
                     </div>
                   </div>
                </div>
                <div className="mt-10 text-center w-full">
                  <h3 className="text-white font-bold text-lg mb-1 truncate">
                    {students[1].full_name || "کاربر"}
                  </h3>
                  <div className="flex justify-center items-center gap-2 mb-4">
                     <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 text-xs">{students[1].grade}</Badge>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-slate-400 text-xs">میانگین</span>
                    <div className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Star className="w-3 h-3" fill="currentColor" />
                      {toPersianNumber(students[1].averageScore)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Rank 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="order-1 md:order-2 w-full md:w-1/3 max-w-[320px] z-10"
            >
              <div className="bg-gradient-to-b from-purple-900/80 to-slate-900/80 backdrop-blur-md border border-purple-500/30 rounded-2xl p-8 flex flex-col items-center relative shadow-2xl shadow-purple-500/10 transform md:-translate-y-8">
                <div className="absolute -top-5">
                  <Crown className="w-10 h-10 text-yellow-400 drop-shadow-lg animate-bounce" fill="currentColor" />
                </div>
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-yellow-300 to-yellow-600 shadow-xl shadow-yellow-500/20 mb-2">
                     <div className="w-full h-full rounded-full bg-slate-800 overflow-hidden relative">
                        {students[0].profile_image_url ? (
                          <img src={students[0].profile_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-300 font-bold text-3xl">
                            {(students[0].full_name || "U").charAt(0)}
                          </div>
                        )}
                     </div>
                </div>
                <div className="text-center w-full">
                  <h3 className="text-white font-bold text-xl mb-1 truncate">
                    {students[0].full_name || "کاربر"}
                  </h3>
                  <div className="flex justify-center items-center gap-2 mb-4">
                     <div className="inline-block bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium border border-yellow-500/20">
                       👑 قهرمان مدرسه
                     </div>
                     <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 text-xs">{students[0].grade}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                       <p className="text-slate-400 text-xs mb-1">سکه</p>
                       <p className="text-white font-bold">{toPersianNumber(students[0].coins)}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                       <p className="text-slate-400 text-xs mb-1">میانگین</p>
                       <p className="text-yellow-400 font-bold">{toPersianNumber(students[0].averageScore)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Rank 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="order-3 w-full md:w-1/3 max-w-[280px]"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex flex-col items-center relative mt-4 md:mt-0">
                <div className="absolute -top-10">
                   <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-orange-300 to-orange-600 shadow-lg shadow-orange-500/20">
                     <div className="w-full h-full rounded-full bg-slate-800 overflow-hidden relative">
                        {students[2].profile_image_url ? (
                          <img src={students[2].profile_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-300 font-bold text-2xl">
                            {(students[2].full_name || "U").charAt(0)}
                          </div>
                        )}
                     </div>
                     <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold border-2 border-slate-800 shadow-sm">
                       3
                     </div>
                   </div>
                </div>
                <div className="mt-10 text-center w-full">
                  <h3 className="text-white font-bold text-lg mb-1 truncate">
                    {students[2].full_name || "کاربر"}
                  </h3>
                  <div className="flex justify-center items-center gap-2 mb-4">
                     <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 text-xs">{students[2].grade}</Badge>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-slate-400 text-xs">میانگین</span>
                    <div className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Star className="w-3 h-3" fill="currentColor" />
                      {toPersianNumber(students[2].averageScore)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 px-2">
          <Shield className="w-5 h-5 text-purple-400" />
          لیست رتبه‌بندی
        </h2>
        <AnimatePresence>
          {students.map((student, index) => {
            const rank = index + 1;
            
            return (
              <motion.div
                key={student.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="group relative overflow-hidden rounded-xl p-4 flex items-center gap-4 transition-all duration-300 border bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${
                  rank <= 3 ? "bg-gradient-to-br from-slate-700 to-slate-800 text-yellow-400 border border-slate-600" : "bg-slate-700/50 text-slate-400"
                }`}>
                  {toPersianNumber(rank)}
                </div>

                <div className="relative shrink-0">
                   <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden">
                    {student.profile_image_url ? (
                      <img src={student.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">
                          {(student.full_name || "U").charAt(0)}
                       </div>
                    )}
                  </div>
                  {rank === 1 && <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-slate-800"><Crown className="w-3 h-3 text-white" /></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate mb-1">
                    {student.full_name || "کاربر"}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {student.grade || "بدون پایه"}
                    </span>
                    <span className="hidden sm:inline">|</span>
                    <span>{toPersianNumber(student.totalSubmissions)} ارسالی</span>
                    <span className="hidden sm:inline">|</span>
                    <span>{toPersianNumber(student.coins)} سکه</span>
                  </div>
                </div>

                <div className="text-right">
                   <div className="font-bold text-white flex items-center justify-end gap-1">
                    {toPersianNumber(student.averageScore)}
                    <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                     میانگین
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {students.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">هنوز دانش‌آموزی در این لیست وجود ندارد</p>
          </div>
        )}
      </div>
    </div>
  );
}