import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianNumber } from "@/components/utils";

export default function Scoreboard() {
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    loadScoreboardData();
  }, []);

  const loadScoreboardData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const allPublicProfiles = await base44.entities.PublicProfile.list();
      const studentProfiles = allPublicProfiles.filter(profile => profile.student_role === "student");

      const allSubmissions = await base44.entities.Submission.list();
      
      const studentsWithStats = studentProfiles.map(student => {
        const submissions = allSubmissions.filter(s => s.student_id === student.user_id);
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
      });

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

  const getFilteredStudents = () => {
    if (selectedFilter === "all") return students;
    if (selectedFilter === "grade" && currentUser) {
      return students.filter(s => s.grade === currentUser.grade);
    }
    return students;
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-8 h-8 text-yellow-400" />;
      case 2: return <Medal className="w-8 h-8 text-gray-300" />;
      case 3: return <Award className="w-8 h-8 text-orange-400" />;
      default: return <Trophy className="w-6 h-6 text-purple-400" />;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return "from-yellow-400 via-yellow-500 to-yellow-600";
      case 2: return "from-gray-300 via-gray-400 to-gray-500";
      case 3: return "from-orange-400 via-orange-500 to-orange-600";
      default: return "from-purple-400 via-purple-500 to-purple-600";
    }
  };

  const filteredStudents = getFilteredStudents();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">در حال بارگیری تابلوی امتیازات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <Trophy className="w-16 h-16 text-yellow-400 animate-pulse" />
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
            تابلوی افتخارات
          </h1>
          <Trophy className="w-16 h-16 text-yellow-400 animate-pulse" />
        </div>
        <p className="text-gray-300 text-xl">بهترین دانش‌آموزان {currentUser?.grade || "مدرسه"}</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="clay-card p-4 mb-8"
      >
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`clay-button px-6 py-3 transition-all ${selectedFilter === "all" ? "active bg-purple-500/30 text-purple-200" : "text-white"}`}
          >
            🏆 همه دانش‌آموزان
          </button>
          <button
            onClick={() => setSelectedFilter("grade")}
            className={`clay-button px-6 py-3 transition-all ${selectedFilter === "grade" ? "active bg-purple-500/30 text-purple-200" : "text-white"}`}
          >
            📚 کلاس من
          </button>
        </div>
      </motion.div>

      {filteredStudents.length >= 3 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-end justify-center gap-6 h-80">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="clay-card p-6 bg-gradient-to-br from-gray-200 to-gray-400 h-40 flex flex-col items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300/50 to-transparent"></div>
                <Medal className="w-12 h-12 text-gray-600 mb-2 relative z-10" />
                <div className="text-4xl font-black text-gray-700 relative z-10">2</div>
              </div>
              <div
                className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-300 shadow-lg"
                style={{ backgroundColor: filteredStudents[1].avatar_color }}
              >
                {filteredStudents[1].profile_image_url ? (
                  <img src={filteredStudents[1].profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  filteredStudents[1].display_name?.charAt(0) || "د"
                )}
              </div>
              <h3 className="font-bold text-white text-lg mb-1">{filteredStudents[1].full_name || "کاربر"}</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold text-gray-200">{toPersianNumber(filteredStudents[1].averageScore)}</span>
              </div>
              <p className="text-sm text-gray-400">{toPersianNumber(filteredStudents[1].gradedSubmissions)} تکلیف</p>
              <Badge className="mt-2 bg-gray-500/30 text-gray-200">🥈 نایب قهرمان</Badge>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="clay-card p-8 bg-gradient-to-br from-yellow-300 to-yellow-500 h-52 flex flex-col items-center justify-center mb-4 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/50 to-transparent"></div>
                <Crown className="w-16 h-16 text-yellow-700 mb-3 relative z-10 animate-bounce" />
                <div className="text-5xl font-black text-yellow-800 relative z-10">1</div>
              </div>
              <div
                className="w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold border-6 border-yellow-400 shadow-2xl"
                style={{ backgroundColor: filteredStudents[0].avatar_color }}
              >
                {filteredStudents[0].profile_image_url ? (
                  <img src={filteredStudents[0].profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (filteredStudents[0].full_name || "کاربر").charAt(0)
                )}
              </div>
              <h3 className="font-bold text-white text-2xl mb-2">{filteredStudents[0].full_name || "کاربر"}</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-6 h-6 text-yellow-300" />
                <span className="text-3xl font-black text-yellow-200">{toPersianNumber(filteredStudents[0].averageScore)}</span>
              </div>
              <p className="text-gray-200 mb-2">{toPersianNumber(filteredStudents[0].gradedSubmissions)} تکلیف</p>
              <Badge className="bg-yellow-500 text-white shadow-lg">👑 قهرمان کلاس</Badge>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="clay-card p-6 bg-gradient-to-br from-orange-300 to-orange-500 h-32 flex flex-col items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/50 to-transparent"></div>
                <Award className="w-10 h-10 text-orange-700 mb-2 relative z-10" />
                <div className="text-3xl font-black text-orange-800 relative z-10">3</div>
              </div>
              <div
                className="w-18 h-18 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold border-4 border-orange-300 shadow-lg"
                style={{ backgroundColor: filteredStudents[2].avatar_color }}
              >
                {filteredStudents[2].profile_image_url ? (
                  <img src={filteredStudents[2].profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (filteredStudents[2].full_name || "کاربر").charAt(0)
                )}
              </div>
              <h3 className="font-bold text-white text-lg mb-1">{filteredStudents[2].full_name || "کاربر"}</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold text-gray-200">{toPersianNumber(filteredStudents[2].averageScore)}</span>
              </div>
              <p className="text-sm text-gray-400">{toPersianNumber(filteredStudents[2].gradedSubmissions)} تکلیف</p>
              <Badge className="mt-2 bg-orange-500/30 text-orange-200">🥉 نفر سوم</Badge>
            </motion.div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="clay-card">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Trophy className="w-7 h-7 text-purple-400" />
              رتبه‌بندی کامل
            </h2>
            
            <div className="space-y-3">
              <AnimatePresence>
                {filteredStudents.map((student, index) => {
                  const rank = index + 1;
                  const isCurrentUser = currentUser && student.user_id === currentUser.id;
                  
                  return (
                    <motion.div
                      key={student.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`clay-card p-5 hover:shadow-xl transition-all duration-300 ${
                        isCurrentUser ? "ring-2 ring-purple-500 bg-purple-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`clay-button px-5 py-3 bg-gradient-to-br ${getRankColor(rank)} text-white shadow-lg`}>
                          <div className="flex items-center gap-2">
                            {getRankIcon(rank)}
                            <span className="font-black text-xl">#{toPersianNumber(rank)}</span>
                          </div>
                        </div>

                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                          style={{ backgroundColor: student.avatar_color }}
                        >
                          {student.profile_image_url ? (
                            <img src={student.profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (student.full_name || "کاربر").charAt(0)
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            {student.full_name || "کاربر"}
                            {isCurrentUser && <Badge className="bg-purple-500 text-white text-xs">شما</Badge>}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-300 mt-1">
                            <span className="flex items-center gap-1">
                              📚 {student.grade}
                            </span>
                            <span className="flex items-center gap-1">
                              📝 {toPersianNumber(student.totalSubmissions)} ارسالی
                            </span>
                            <span className="flex items-center gap-1">
                              ✅ {toPersianNumber(student.gradedSubmissions)} تصحیح شده
                            </span>
                            <span className="flex items-center gap-1">
                              🪙 {toPersianNumber(student.coins)}
                            </span>
                            <span className="flex items-center gap-1">
                              ⭐ سطح {toPersianNumber(student.level)}
                            </span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="clay-button px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 shadow-lg">
                            <div className="flex items-center gap-2">
                              <Star className="w-6 h-6 text-white" />
                              <span className="font-black text-2xl text-white">{toPersianNumber(student.averageScore)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">میانگین نمره</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-16">
                <Trophy className="w-24 h-24 text-gray-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">هنوز دانش‌آموزی در این بخش نیست</h3>
                <p className="text-gray-400">با ارسال تکالیف، در تابلوی امتیازات ظاهر خواهید شد!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}