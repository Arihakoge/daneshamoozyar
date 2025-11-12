import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Submission } from "@/entities/Submission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      const allUsers = await User.list();
      const studentUsers = allUsers.filter(u => u.student_role === "student");
      
      // محاسبه آمار برای هر دانش‌آموز
      const studentsWithStats = await Promise.all(
        studentUsers.map(async (student) => {
          const submissions = await Submission.filter({ student_id: student.id });
          const gradedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
          
          const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.score, 0);
          const averageScore = gradedSubmissions.length > 0 ? totalScore / gradedSubmissions.length : 0;
          
          return {
            ...student,
            totalSubmissions: submissions.length,
            gradedSubmissions: gradedSubmissions.length,
            totalScore,
            averageScore: parseFloat(averageScore.toFixed(1)),
            coins: student.coins || 0,
            level: student.level || 1
          };
        })
      );

      // مرتب‌سازی بر اساس سکه‌ها، سپس میانگین نمرات
      studentsWithStats.sort((a, b) => {
        if (b.coins !== a.coins) return b.coins - a.coins;
        return b.averageScore - a.averageScore;
      });

      setStudents(studentsWithStats);
    } catch (error) {
      console.error("خطا در بارگیری جدول امتیازات:", error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگیری جدول امتیازات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <h1 className="text-4xl font-bold text-gray-800">جدول امتیازات</h1>
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <p className="text-gray-600 text-lg">رتبه‌بندی دانش‌آموزان بر اساس سکه‌ها و عملکرد</p>
      </motion.div>

      {/* Top 3 Podium */}
      {students.length >= 3 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-end justify-center gap-4 h-64">
            {/* Second Place */}
            <div className="text-center">
              <div className="clay-card p-6 bg-gradient-to-br from-gray-100 to-gray-200 h-32 flex flex-col items-center justify-center mb-4">
                <Medal className="w-8 h-8 text-gray-500 mb-2" />
                <div className="text-2xl font-bold text-gray-700">2</div>
              </div>
              <div
                className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: students[1].avatar_color }}
              >
                {students[1].full_name?.charAt(0) || "د"}
              </div>
              <h3 className="font-bold text-gray-800">{students[1].full_name}</h3>
              <p className="text-sm text-gray-600">🪙 {students[1].coins}</p>
            </div>

            {/* First Place */}
            <div className="text-center">
              <div className="clay-card p-6 bg-gradient-to-br from-yellow-200 to-yellow-400 h-40 flex flex-col items-center justify-center mb-4">
                <Crown className="w-10 h-10 text-yellow-600 mb-2" />
                <div className="text-3xl font-bold text-yellow-700">1</div>
              </div>
              <div
                className="w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-2xl font-bold border-4 border-yellow-400"
                style={{ backgroundColor: students[0].avatar_color }}
              >
                {students[0].full_name?.charAt(0) || "د"}
              </div>
              <h3 className="font-bold text-gray-800 text-lg">{students[0].full_name}</h3>
              <p className="text-gray-600">🪙 {students[0].coins}</p>
              <Badge className="bg-yellow-500 text-white mt-1">👑 رتبه اول</Badge>
            </div>

            {/* Third Place */}
            <div className="text-center">
              <div className="clay-card p-6 bg-gradient-to-br from-orange-100 to-orange-300 h-24 flex flex-col items-center justify-center mb-4">
                <Award className="w-7 h-7 text-orange-600 mb-2" />
                <div className="text-xl font-bold text-orange-700">3</div>
              </div>
              <div
                className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: students[2].avatar_color }}
              >
                {students[2].full_name?.charAt(0) || "د"}
              </div>
              <h3 className="font-bold text-gray-800">{students[2].full_name}</h3>
              <p className="text-sm text-gray-600">🪙 {students[2].coins}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Complete Leaderboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              جدول کامل رتبه‌بندی
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2">
              {students.map((student, index) => {
                const rank = index + 1;
                const isCurrentUser = currentUser && student.id === currentUser.id;
                
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className={`clay-card p-4 m-4 hover:shadow-lg transition-shadow duration-300 ${
                      isCurrentUser ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`clay-button px-4 py-2 ${getRankBadgeColor(rank)}`}>
                        <div className="flex items-center gap-2">
                          {getRankIcon(rank)}
                          <span className="font-bold">#{rank}</span>
                        </div>
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: student.avatar_color }}
                      >
                        {student.full_name?.charAt(0) || "د"}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800">
                            {student.full_name || "دانش‌آموز"}
                          </h3>
                          {isCurrentUser && (
                            <Badge className="bg-purple-100 text-purple-800">شما</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>📚 {student.totalSubmissions} تکلیف</span>
                          <span>⭐ میانگین: {student.averageScore}</span>
                          <span>🏆 سطح {student.level}</span>
                        </div>
                      </div>

                      {/* Coins */}
                      <div className="text-left">
                        <div className="clay-button px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🪙</span>
                            <span className="font-bold text-lg">{student.coins}</span>
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
                <p className="text-gray-500 text-lg">هنوز دانش‌آموزی در سیستم ثبت نشده</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}