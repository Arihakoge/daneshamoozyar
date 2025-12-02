import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Crown, Star, Shield, Search, GraduationCap, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianNumber } from "@/components/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminScoreboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [allUsers, allProfiles, allSubmissions] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.PublicProfile.list(),
        base44.entities.Submission.list()
      ]);

      const validUserIds = new Set(allUsers.map(u => u.id));

      const validProfiles = allProfiles.filter(p => 
        p.student_role === "student" && validUserIds.has(p.user_id)
      );

      const studentsWithStats = validProfiles.map(profile => {
        const userSubmissions = allSubmissions.filter(s => s.student_id === profile.user_id);
        
        return {
          ...profile,
          submissions: userSubmissions // Store all, process later
        };
      });

      setStudents(studentsWithStats);
    } catch (error) {
      console.error("Error loading admin scoreboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProcessedStudents = () => {
    let processed = students.map(s => {
      let filteredSubs = s.submissions;
      
      if (timeRange !== 'all') {
        const now = new Date();
        const threshold = new Date();
        if (timeRange === 'week') threshold.setDate(now.getDate() - 7);
        if (timeRange === 'month') threshold.setMonth(now.getMonth() - 1);
        filteredSubs = s.submissions.filter(sub => new Date(sub.created_date) >= threshold);
      }

      const graded = filteredSubs.filter(sub => typeof sub.score === 'number');
      const totalScore = graded.reduce((sum, s) => sum + s.score, 0);
      const averageScore = graded.length > 0 ? totalScore / graded.length : 0;

      // Admin View Combined Score
      const normalizedCoins = (s.coins || 0) / 2; 
      const gradePoints = averageScore * 5; 
      const combinedScore = normalizedCoins + gradePoints;

      return {
        ...s,
        stats: {
          submissionCount: filteredSubs.length,
          gradedCount: graded.length,
          averageScore: parseFloat(averageScore.toFixed(2)),
          combinedScore: parseFloat(combinedScore.toFixed(2))
        }
      };
    });

    // Grade Filter
    if (gradeFilter !== 'all') {
      processed = processed.filter(s => s.grade === gradeFilter);
    }

    // Search Filter
    if (searchTerm.trim()) {
      processed = processed.filter(s => 
        (s.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    processed.sort((a, b) => b.stats.combinedScore - a.stats.combinedScore);

    return processed;
  };

  const displayedStudents = getProcessedStudents();
  const topThree = displayedStudents.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-purple-500/20 rounded-full mb-4 ring-4 ring-purple-500/10">
          <Trophy className="w-10 h-10 text-purple-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
          تابلوی امتیازات کل مدرسه
        </h1>
        <p className="text-slate-400 text-lg">
          پنل مدیریت رتبه‌بندی و تحلیل عملکرد
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-12 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
        
        {/* Time Filter */}
        <div className="md:col-span-4 flex bg-slate-900/50 p-1 rounded-xl border border-slate-700">
          {['all', 'month', 'week'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                timeRange === t 
                  ? "bg-purple-600 text-white shadow-lg" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {t === 'all' ? 'کل' : t === 'month' ? 'ماه' : 'هفته'}
            </button>
          ))}
        </div>

        {/* Grade Filter */}
        <div className="md:col-span-3">
           <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-full bg-slate-900/50 border-slate-700 text-white h-full min-h-[44px]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="فیلتر پایه" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">همه پایه‌ها</SelectItem>
              <SelectItem value="هفتم">هفتم</SelectItem>
              <SelectItem value="هشتم">هشتم</SelectItem>
              <SelectItem value="نهم">نهم</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="جستجوی نام دانش‌آموز..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900/50 border-slate-700 pr-9 text-white h-full min-h-[44px] focus:ring-purple-500/50"
          />
        </div>
      </div>

      {/* Top 3 */}
      {displayedStudents.length >= 3 && !searchTerm && (
        <div className="flex flex-col md:flex-row justify-center items-end gap-4 mb-16 px-4">
          {/* Rank 2 */}
          <div className="order-2 md:order-1 w-full md:w-1/3 flex flex-col items-center">
            <div className="relative w-full bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 flex flex-col items-center transform translate-y-4">
              <div className="absolute -top-10">
                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-slate-300 to-slate-500 shadow-lg">
                  <img 
                    src={topThree[1].profile_image_url || `https://ui-avatars.com/api/?name=${topThree[1].full_name}&background=random`} 
                    className="w-full h-full rounded-full object-cover bg-slate-800"
                    alt=""
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-800 border-4 border-slate-800">2</div>
                </div>
              </div>
              <div className="mt-10 text-center w-full">
                <h3 className="font-bold text-white text-lg truncate w-full">{topThree[1].full_name}</h3>
                <p className="text-slate-400 text-sm mb-4">{toPersianNumber(topThree[1].stats.combinedScore)} امتیاز</p>
                <div className="flex justify-between items-center w-full bg-slate-900/50 rounded-lg p-2 px-4">
                  <span className="text-xs text-slate-400">میانگین</span>
                  <span className="text-yellow-400 font-bold flex items-center gap-1">
                    {toPersianNumber(topThree[1].stats.averageScore)} <Star className="w-3 h-3" fill="currentColor" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rank 1 */}
          <div className="order-1 md:order-2 w-full md:w-1/3 flex flex-col items-center z-10">
            <div className="relative w-full bg-gradient-to-b from-purple-900/90 to-slate-900/90 backdrop-blur-md border border-purple-500/50 rounded-2xl p-8 flex flex-col items-center shadow-2xl shadow-purple-500/20 transform -translate-y-4">
              <div className="absolute -top-12">
                <Crown className="w-12 h-12 text-yellow-400 absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" fill="currentColor" />
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-yellow-300 to-yellow-600 shadow-xl shadow-yellow-500/40">
                  <img 
                    src={topThree[0].profile_image_url || `https://ui-avatars.com/api/?name=${topThree[0].full_name}&background=random`} 
                    className="w-full h-full rounded-full object-cover bg-slate-800"
                    alt=""
                  />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-yellow-900 border-4 border-slate-900 text-xl">1</div>
                </div>
              </div>
              <div className="mt-12 text-center w-full">
                <h3 className="font-black text-white text-xl truncate w-full mb-1">{topThree[0].full_name}</h3>
                <Badge className="bg-yellow-500/20 text-yellow-300 mb-4 hover:bg-yellow-500/30 border-yellow-500/20">👑 قهرمان کل</Badge>
                
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="bg-slate-900/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400 mb-1">امتیاز کل</p>
                    <p className="font-bold text-white">{toPersianNumber(topThree[0].stats.combinedScore)}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400 mb-1">میانگین</p>
                    <p className="font-bold text-yellow-400">{toPersianNumber(topThree[0].stats.averageScore)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="order-3 w-full md:w-1/3 flex flex-col items-center">
            <div className="relative w-full bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 flex flex-col items-center transform translate-y-4">
              <div className="absolute -top-10">
                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-orange-300 to-orange-600 shadow-lg">
                  <img 
                    src={topThree[2].profile_image_url || `https://ui-avatars.com/api/?name=${topThree[2].full_name}&background=random`} 
                    className="w-full h-full rounded-full object-cover bg-slate-800"
                    alt=""
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-300 rounded-full flex items-center justify-center font-bold text-orange-900 border-4 border-slate-800">3</div>
                </div>
              </div>
              <div className="mt-10 text-center w-full">
                <h3 className="font-bold text-white text-lg truncate w-full">{topThree[2].full_name}</h3>
                <p className="text-slate-400 text-sm mb-4">{toPersianNumber(topThree[2].stats.combinedScore)} امتیاز</p>
                <div className="flex justify-between items-center w-full bg-slate-900/50 rounded-lg p-2 px-4">
                  <span className="text-xs text-slate-400">میانگین</span>
                  <span className="text-yellow-400 font-bold flex items-center gap-1">
                    {toPersianNumber(topThree[2].stats.averageScore)} <Star className="w-3 h-3" fill="currentColor" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-2 mb-4 text-slate-300">
          <Shield className="w-5 h-5" />
          <h2 className="font-bold text-lg">لیست کامل</h2>
        </div>

        <AnimatePresence>
          {displayedStudents.map((student, index) => (
            <motion.div
              key={student.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
            >
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0
                ${index < 3 ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-yellow-400 border border-slate-600' : 'bg-slate-900/50 text-slate-500'}
              `}>
                {toPersianNumber(index + 1)}
              </div>

              <div className="shrink-0 relative">
                <img 
                  src={student.profile_image_url || `https://ui-avatars.com/api/?name=${student.full_name}&background=random`} 
                  className="w-12 h-12 rounded-full object-cover bg-slate-800 border border-slate-700"
                  alt=""
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate text-lg text-white">
                  {student.full_name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-slate-700">{student.grade || "بدون پایه"}</span>
                  <span>{toPersianNumber(student.stats.submissionCount)} ارسال</span>
                  <span>{toPersianNumber(student.coins)} سکه</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-white font-bold text-lg flex items-center gap-1">
                    {toPersianNumber(student.stats.combinedScore)} <span className="text-xs font-normal text-slate-500">امتیاز</span>
                  </span>
                  <span className="text-yellow-400 text-xs font-medium">
                    میانگین {toPersianNumber(student.stats.averageScore)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {displayedStudents.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <p>دانش‌آموزی یافت نشد.</p>
          </div>
        )}
      </div>
    </div>
  );
}