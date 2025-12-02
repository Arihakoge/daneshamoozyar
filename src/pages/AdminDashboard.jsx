import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, GraduationCap, FileText, Activity, Shield, School, BookOpen, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toPersianNumber, toPersianDate } from "@/components/utils";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function AdminStatCard({ title, value, icon: Icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 shadow-xl"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-slate-900/50 border border-slate-700 ${color.replace('from-', 'text-').split(' ')[0]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-slate-400 px-2 py-1 rounded-full bg-slate-900/50 border border-slate-700">
            بروزرسانی لحظه‌ای
          </span>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{toPersianNumber(value)}</h3>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    teachers: 0,
    students: 0,
    classes: 0,
    assignments: 0,
    submissions: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [users, classes, assignments, submissions] = await Promise.all([
          base44.entities.PublicProfile.list(),
          base44.entities.Class.list(),
          base44.entities.Assignment.list(),
          base44.entities.Submission.list()
        ]);

        setStats({
          users: users.length,
          teachers: users.filter(u => u.student_role === 'teacher').length,
          students: users.filter(u => u.student_role === 'student').length,
          classes: classes.length,
          assignments: assignments.length,
          submissions: submissions.length
        });

        // Recent user registrations
        setRecentActivity(users.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5));

      } catch (error) {
        console.error("Error loading admin stats:", error);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyan-500" />
              پنل مدیریت سیستم
            </h1>
            <p className="text-slate-400 mt-2">نمای کلی وضعیت مدرسه و مدیریت منابع</p>
          </div>
          <div className="flex gap-3">
             <div className="text-right hidden md:block">
                <p className="text-sm text-slate-400">امروز</p>
                <p className="text-lg font-bold text-white">{toPersianDate(new Date())}</p>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStatCard 
            title="کل کاربران" 
            value={stats.users} 
            icon={Users} 
            color="from-cyan-500 to-blue-600" 
            delay={0.1} 
          />
          <AdminStatCard 
            title="تعداد معلمین" 
            value={stats.teachers} 
            icon={School} 
            color="from-purple-500 to-pink-600" 
            delay={0.2} 
          />
          <AdminStatCard 
            title="تعداد کلاس‌ها" 
            value={stats.classes} 
            icon={GraduationCap} 
            color="from-emerald-500 to-teal-600" 
            delay={0.3} 
          />
          <AdminStatCard 
            title="فعالیت‌های آموزشی" 
            value={stats.assignments + stats.submissions} 
            icon={Activity} 
            color="from-orange-500 to-red-600" 
            delay={0.4} 
          />
        </div>

        {/* Quick Actions & Recent Users */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-500" />
                دسترسی سریع
             </h2>
             <div className="grid sm:grid-cols-2 gap-4">
                <Link to={createPageUrl("AdminUsers")}>
                  <div className="group p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">مدیریت کاربران</h3>
                        <p className="text-sm text-slate-400 mt-1">تعریف معلم، دانش‌آموز و تخصیص دروس</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link to={createPageUrl("AdminClasses")}>
                  <div className="group p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">مدیریت کلاس‌ها</h3>
                        <p className="text-sm text-slate-400 mt-1">مشاهده و ویرایش کلاس‌های مدرسه</p>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <Link to={createPageUrl("AdminScoreboard")}>
                   <div className="group p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 hover:bg-slate-800 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">تابلوی امتیازات</h3>
                        <p className="text-sm text-slate-400 mt-1">رتبه‌بندی کلی مدرسه و پایه‌ها</p>
                      </div>
                    </div>
                  </div>
                </Link>
             </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-500" />
              آخرین ثبت‌نام‌ها
            </h2>
            <div className="space-y-4">
              {recentActivity.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                    style={{ backgroundColor: user.avatar_color || '#64748b' }}
                  >
                    {(user.full_name || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-400">
                      {user.student_role === 'student' ? `دانش‌آموز ${user.grade || ''}` : 
                       user.student_role === 'teacher' ? 'معلم' : 'مدیر'}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500">
                    {toPersianDate(user.created_date).split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}