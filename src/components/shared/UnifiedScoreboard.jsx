import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Crown, Star, Shield, Medal, Search, Filter, Users, School } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianNumber } from "@/components/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UnifiedScoreboard({ defaultViewMode = "all" }) {
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // View Mode: 'all', 'grade', 'my_students' (for teachers)
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [sortBy, setSortBy] = useState("combined"); // 'combined', 'coins', 'average'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all"); // For Admin filter

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Fetch Data
      const [allUsers, allProfiles, allSubmissions] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.PublicProfile.list(),
        base44.entities.Submission.list()
      ]);

      // Valid User IDs (Active users only)
      const validUserIds = new Set(allUsers.map(u => u.id));

      // Process Data
      const processedStudents = allProfiles
        .filter(p => p.student_role === "student" && validUserIds.has(p.user_id))
        .map(profile => {
          const userSubmissions = allSubmissions.filter(s => s.student_id === profile.user_id);
          const gradedSubmissions = userSubmissions.filter(s => typeof s.score === 'number');
          
          const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.score, 0);
          const averageScore = gradedSubmissions.length > 0 ? totalScore / gradedSubmissions.length : 0;
          
          // Score Formula: (Average * 5) + (Coins / 2)
          const scoreFromGrades = averageScore * 5;
          const scoreFromCoins = (profile.coins || 0) / 2;
          const combinedScore = scoreFromGrades + scoreFromCoins;

          return {
            ...profile,
            stats: {
              submissionsCount: userSubmissions.length,
              averageScore: parseFloat(averageScore.toFixed(2)),
              combinedScore: parseFloat(combinedScore.toFixed(1)),
              rawCoins: profile.coins || 0
            }
          };
        });

      setStudents(processedStudents);
      
      // Set smart default view mode based on role
      if (user.student_role === 'student') {
        setViewMode('grade');
      } else if (user.student_role === 'teacher') {
        setViewMode('my_students');
      } else {
        setViewMode('all');
      }

    } catch (error) {
      console.error("Error loading scoreboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // 1. Filter by View Mode
    if (viewMode === "grade" && currentUser?.grade) {
      result = result.filter(s => s.grade === currentUser.grade);
    } else if (viewMode === "my_students" && currentUser) {
        // For teachers: filter students matching teacher's grades/subjects
        // This logic depends on how teacher-student relation is defined. 
        // Assuming matching 'grade' is the primary link for now, or if we had class_id.
        // If teacher has 'teaching_assignments', we use those grades.
        const teacherGrades = [];
        if (currentUser.teaching_assignments) {
            currentUser.teaching_assignments.forEach(ta => teacherGrades.push(ta.grade));
        }
        if (currentUser.grade) teacherGrades.push(currentUser.grade); // Fallback
        
        const uniqueGrades = [...new Set(teacherGrades)];
        if (uniqueGrades.length > 0) {
             result = result.filter(s => uniqueGrades.includes(s.grade));
        }
    }

    // 2. Admin Grade Filter
    if (selectedGrade !== "all") {
        result = result.filter(s => s.grade === selectedGrade);
    }

    // 3. Filter by Search
    if (searchTerm.trim()) {
      result = result.filter(s => 
        (s.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === 'coins') return b.stats.rawCoins - a.stats.rawCoins;
      if (sortBy === 'average') return b.stats.averageScore - a.stats.averageScore;
      return b.stats.combinedScore - a.stats.combinedScore;
    });

    return result;
  }, [students, viewMode, sortBy, searchTerm, currentUser, selectedGrade]);

  const topThree = filteredAndSortedStudents.slice(0, 3);
  const listStudents = filteredAndSortedStudents.slice(3);
  
  const myRankIndex = filteredAndSortedStudents.findIndex(s => s.user_id === currentUser?.id);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="text-center mb-10 relative">
        <div className="inline-block p-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/30 mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">
          تابلوی قهرمانان
        </h1>
        <p className="text-slate-300 text-lg">
          {viewMode === 'grade' ? `رقابت با هم‌کلاسی‌های پایه ${currentUser?.grade || '...'} ` : 
           viewMode === 'my_students' ? 'دانش‌آموزان کلاس‌های من' :
           'رقابت در سطح کل مدرسه'}
        </p>
      </div>

      {/* Controls */}
      <div className="sticky top-4 z-40 bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-800 shadow-2xl mb-12">
        <div className="flex flex-col xl:flex-row gap-4 justify-between">
          
          {/* View Tabs */}
          <div className="flex bg-slate-800 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                viewMode === "all" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              <School className="w-4 h-4 inline-block ml-2" />
              کل مدرسه
            </button>
            
            {currentUser?.student_role === 'student' && (
                <button
                onClick={() => setViewMode("grade")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    viewMode === "grade" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
                >
                <Users className="w-4 h-4 inline-block ml-2" />
                هم‌کلاسی‌ها
                </button>
            )}

            {currentUser?.student_role === 'teacher' && (
                <button
                onClick={() => setViewMode("my_students")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    viewMode === "my_students" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
                >
                <Users className="w-4 h-4 inline-block ml-2" />
                دانش‌آموزان من
                </button>
            )}
          </div>

          <div className="flex gap-4 flex-wrap flex-1 justify-end">
             {/* Admin Grade Filter */}
            {(currentUser?.student_role === 'admin' || viewMode === 'all') && (
                 <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white h-10">
                        <SelectValue placeholder="فیلتر پایه" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">همه پایه‌ها</SelectItem>
                        <SelectItem value="هفتم">هفتم</SelectItem>
                        <SelectItem value="هشتم">هشتم</SelectItem>
                        <SelectItem value="نهم">نهم</SelectItem>
                    </SelectContent>
                </Select>
            )}

            {/* Sort Options */}
            <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
                <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortBy('combined')}
                className={`h-8 rounded-md ${sortBy === 'combined' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                >
                <Medal className="w-4 h-4 mr-2" /> امتیاز
                </Button>
                <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortBy('average')}
                className={`h-8 rounded-md ${sortBy === 'average' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                >
                <Star className="w-4 h-4 mr-2" /> نمره
                </Button>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                placeholder="جستجوی دانش‌آموز..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border-slate-700 pr-9 h-10 text-white focus:ring-purple-500/50"
                />
            </div>
          </div>
        </div>
      </div>

      {/* Podium Section */}
      {!searchTerm && filteredAndSortedStudents.length > 0 && (
        <div className="flex flex-col md:flex-row justify-center items-end gap-4 mb-16 px-2 mt-10">
          
          {/* Rank 2 */}
          {topThree[1] && (
            <div className="order-2 md:order-1 w-full md:w-1/3 flex flex-col items-center">
              <div className="relative w-full clay-card p-6 flex flex-col items-center pt-12 mt-8">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-slate-300 to-slate-500 shadow-lg">
                    <img 
                      src={topThree[1].profile_image_url || `https://ui-avatars.com/api/?name=${topThree[1].full_name}&background=random`} 
                      className="w-full h-full rounded-full object-cover bg-slate-800"
                      alt=""
                    />
                    <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                      <div className="bg-slate-200 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-slate-800 text-lg">2</div>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-bold text-white text-lg mt-2 text-center line-clamp-1">{topThree[1].full_name}</h3>
                <p className="text-slate-400 text-sm mb-4">{topThree[1].grade}</p>
                
                <div className="w-full bg-slate-900/50 rounded-xl p-3 flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-xs text-slate-500">امتیاز کل</div>
                    <div className="font-bold text-white">{toPersianNumber(topThree[1].stats.combinedScore)}</div>
                  </div>
                  <div className="w-px h-8 bg-slate-700"></div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">نمره</div>
                    <div className="font-bold text-green-400">{toPersianNumber(topThree[1].stats.averageScore)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rank 1 */}
          {topThree[0] && (
            <div className="order-1 md:order-2 w-full md:w-1/3 flex flex-col items-center z-10">
              <div className="relative w-full bg-gradient-to-b from-purple-900 via-slate-900 to-slate-900 rounded-3xl border border-purple-500/50 p-6 flex flex-col items-center pt-14 shadow-2xl shadow-purple-500/20 transform md:-translate-y-6">
                <div className="absolute -top-14 left-1/2 -translate-x-1/2">
                  <Crown className="w-12 h-12 text-yellow-400 absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" fill="currentColor" />
                  <div className="w-28 h-28 rounded-full p-1.5 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 shadow-xl shadow-yellow-500/30">
                    <img 
                      src={topThree[0].profile_image_url || `https://ui-avatars.com/api/?name=${topThree[0].full_name}&background=random`} 
                      className="w-full h-full rounded-full object-cover bg-slate-900"
                      alt=""
                    />
                     <div className="absolute -bottom-4 inset-x-0 flex justify-center">
                      <div className="bg-yellow-400 text-yellow-900 w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-slate-900 text-xl shadow-lg">1</div>
                    </div>
                  </div>
                </div>

                <h3 className="font-black text-white text-xl mt-4 text-center line-clamp-1">{topThree[0].full_name}</h3>
                <Badge className="mt-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30">
                  👑 قهرمان {topThree[0].grade}
                </Badge>
                
                <div className="mt-6 grid grid-cols-3 gap-2 w-full bg-slate-900/80 rounded-2xl p-4 border border-slate-700/50">
                  <div className="text-center">
                     <p className="text-[10px] text-slate-400 uppercase">امتیاز</p>
                     <p className="text-lg font-black text-white">{toPersianNumber(topThree[0].stats.combinedScore)}</p>
                  </div>
                  <div className="text-center border-x border-slate-700">
                     <p className="text-[10px] text-slate-400 uppercase">میانگین</p>
                     <p className="text-lg font-bold text-green-400">{toPersianNumber(topThree[0].stats.averageScore)}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] text-slate-400 uppercase">سکه</p>
                     <p className="text-lg font-bold text-yellow-400">{toPersianNumber(topThree[0].stats.rawCoins)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {topThree[2] && (
            <div className="order-3 w-full md:w-1/3 flex flex-col items-center">
              <div className="relative w-full clay-card p-6 flex flex-col items-center pt-12 mt-8">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-orange-300 to-orange-600 shadow-lg">
                    <img 
                      src={topThree[2].profile_image_url || `https://ui-avatars.com/api/?name=${topThree[2].full_name}&background=random`} 
                      className="w-full h-full rounded-full object-cover bg-slate-800"
                      alt=""
                    />
                    <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                      <div className="bg-orange-300 text-orange-900 w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-slate-800 text-lg">3</div>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-bold text-white text-lg mt-2 text-center line-clamp-1">{topThree[2].full_name}</h3>
                <p className="text-slate-400 text-sm mb-4">{topThree[2].grade}</p>
                
                <div className="w-full bg-slate-900/50 rounded-xl p-3 flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-xs text-slate-500">امتیاز کل</div>
                    <div className="font-bold text-white">{toPersianNumber(topThree[2].stats.combinedScore)}</div>
                  </div>
                  <div className="w-px h-8 bg-slate-700"></div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">نمره</div>
                    <div className="font-bold text-green-400">{toPersianNumber(topThree[2].stats.averageScore)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-3 mt-8">
        <div className="flex items-center gap-2 px-2 mb-4 text-slate-300 border-b border-slate-800 pb-2">
          <Shield className="w-5 h-5" />
          <h2 className="font-bold text-lg">
            {searchTerm || filteredAndSortedStudents.length < 4 ? 'نتایج جستجو' : 'سایر رتبه‌ها'}
          </h2>
        </div>

        <AnimatePresence>
          {(searchTerm ? filteredAndSortedStudents : listStudents).map((student, index) => {
             const realRank = filteredAndSortedStudents.findIndex(s => s.user_id === student.user_id) + 1;
             const isMe = currentUser?.id === student.user_id;

             return (
              <motion.div
                key={student.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300
                  ${isMe 
                    ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)] z-10' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                  }
                `}
              >
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0
                  ${realRank <= 3 
                    ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-yellow-400 border border-slate-600' 
                    : 'bg-slate-900/50 text-slate-500'
                  }
                `}>
                  {toPersianNumber(realRank)}
                </div>

                <div className="shrink-0">
                  <img 
                    src={student.profile_image_url || `https://ui-avatars.com/api/?name=${student.full_name}&background=random`} 
                    className={`w-12 h-12 rounded-full object-cover bg-slate-800 border-2 ${isMe ? 'border-purple-500' : 'border-slate-700'}`}
                    alt=""
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold truncate text-base md:text-lg ${isMe ? 'text-purple-300' : 'text-white'}`}>
                      {student.full_name}
                    </h3>
                    {isMe && (
                      <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10 text-[10px] px-2 h-5">شما</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>{student.grade || "بدون پایه"}</span>
                    <span className="hidden md:inline">•</span>
                    <span>{toPersianNumber(student.stats.submissionsCount)} ارسال</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8 text-right shrink-0">
                   <div className="hidden md:block text-center min-w-[60px]">
                      <div className="text-[10px] text-slate-500 uppercase mb-1">سکه</div>
                      <div className="text-yellow-400 font-bold">{toPersianNumber(student.stats.rawCoins)}</div>
                   </div>
                   <div className="hidden md:block text-center min-w-[60px]">
                      <div className="text-[10px] text-slate-500 uppercase mb-1">نمره</div>
                      <div className="text-green-400 font-bold">{toPersianNumber(student.stats.averageScore)}</div>
                   </div>
                   
                   <div className="text-right pl-2 w-20">
                      <div className="text-white font-black text-lg md:text-xl">
                        {toPersianNumber(
                            sortBy === 'coins' ? student.stats.rawCoins :
                            sortBy === 'average' ? student.stats.averageScore :
                            student.stats.combinedScore
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {sortBy === 'coins' ? 'سکه' : sortBy === 'average' ? 'نمره' : 'امتیاز'}
                      </div>
                   </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredAndSortedStudents.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">هیچ دانش‌آموزی یافت نشد</h3>
            <p className="text-slate-500">با فیلترهای دیگر تلاش کنید.</p>
          </div>
        )}
      </div>
    </div>
  );
}