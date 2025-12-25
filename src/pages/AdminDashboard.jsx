import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users, GraduationCap, FileText, Activity, Shield, School, 
  BookOpen, Clock, AlertCircle, CheckCircle, TrendingUp, Calendar 
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toPersianNumber, toPersianDate } from "@/components/utils";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function AdminStatCard({ title, value, icon: Icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="clay-card relative overflow-hidden p-4 md:p-6 hover:scale-[1.02] transition-transform duration-300"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-black/20 ${color.replace('from-', 'text-').split(' ')[0]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{toPersianNumber(value)}</h3>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0, teachers: 0, students: 0, classes: 0, assignments: 0, submissions: 0
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const [users, classes, assignments, submissions, requests] = await Promise.all([
          base44.entities.PublicProfile.list(),
          base44.entities.Class.list(),
          base44.entities.Assignment.list(),
          base44.entities.Submission.list(),
          base44.entities.ClassRequest.filter({ status: 'pending' })
        ]);

        setStats({
          users: users.length,
          teachers: users.filter(u => u.student_role === 'teacher').length,
          students: users.filter(u => u.student_role === 'student').length,
          classes: classes.length,
          assignments: assignments.length,
          submissions: submissions.length
        });

        setPendingRequests(requests);
        setRecentUsers(users.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5));

        // Generate Chart Data (Mocking daily activity based on creation dates for demo)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const chartData = last7Days.map(date => ({
            name: new Date(date).toLocaleDateString('fa-IR', { weekday: 'short' }),
            submissions: submissions.filter(s => s.created_date?.startsWith(date)).length,
            assignments: assignments.filter(a => a.created_date?.startsWith(date)).length
        }));
        setActivityData(chartData);

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

  const roleData = [
    { name: 'دانش‌آموز', value: stats.students, color: '#10b981' },
    { name: 'معلم', value: stats.teachers, color: '#3b82f6' },
    { name: 'سایر', value: stats.users - stats.students - stats.teachers, color: '#64748b' },
  ];

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Shield className="w-10 h-10 text-cyan-500" />
            مرکز مدیریت
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            وضعیت کلی سیستم آموزشی در یک نگاه
          </p>
        </div>
        <div className="flex gap-4">
           <Link to={createPageUrl("AdminReports")}>
             <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-900/20">
               <Activity className="w-4 h-4 mr-2" />
               گزارش کامل
             </Button>
           </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard title="کاربران فعال" value={stats.users} icon={Users} color="from-blue-500 to-blue-600" delay={0.1} />
        <AdminStatCard title="کلاس‌های درس" value={stats.classes} icon={School} color="from-emerald-500 to-emerald-600" delay={0.2} />
        <AdminStatCard title="تکالیف ثبت شده" value={stats.assignments} icon={FileText} color="from-purple-500 to-purple-600" delay={0.3} />
        <AdminStatCard title="فعالیت‌ها" value={stats.submissions} icon={Activity} color="from-orange-500 to-orange-600" delay={0.4} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 clay-card p-4 md:p-6">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-cyan-500" />
               روند فعالیت‌های هفته
             </h2>
           </div>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={activityData}>
                 <defs>
                   <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                 <XAxis dataKey="name" stroke="#94a3b8" />
                 <YAxis stroke="#94a3b8" />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                 />
                 <Area type="monotone" dataKey="submissions" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSub)" name="ارسال تکالیف" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Quick Actions & Pending */}
        <div className="space-y-6">
           {/* Pending Requests */}
           <div className="clay-card p-4 md:p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    درخواست‌های در انتظار
                 </h2>
                 <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs font-bold">
                    {pendingRequests.length}
                 </span>
              </div>
              {pendingRequests.length > 0 ? (
                  <div className="space-y-3">
                     {pendingRequests.slice(0, 3).map(req => (
                        <div key={req.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                           <div>
                              <p className="text-sm font-bold text-white">{req.full_name}</p>
                              <p className="text-xs text-slate-400">پایه {req.grade}</p>
                           </div>
                           <Link to={createPageUrl("AdminUsers")}>
                              <Button size="sm" variant="outline" className="text-xs h-7 border-slate-600 text-slate-300">
                                 بررسی
                              </Button>
                           </Link>
                        </div>
                     ))}
                     {pendingRequests.length > 3 && (
                        <p className="text-xs text-center text-slate-500 mt-2">و {pendingRequests.length - 3} مورد دیگر...</p>
                     )}
                  </div>
              ) : (
                  <p className="text-slate-500 text-sm text-center py-4">هیچ درخواست جدیدی وجود ندارد.</p>
              )}
           </div>

           {/* Role Distribution */}
           <div className="clay-card p-4 md:p-6">
               <h2 className="text-lg font-bold text-white mb-4">توزیع کاربران</h2>
               <div className="flex items-center justify-center h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {roleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex justify-center gap-4 mt-2">
                  {roleData.map((entry, i) => (
                     <div key={i} className="flex items-center gap-1 text-xs text-slate-400">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        {entry.name}
                     </div>
                  ))}
               </div>
           </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="clay-card p-6">
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Clock className="w-5 h-5 text-cyan-500" />
               آخرین کاربران ثبت‌نام شده
            </h2>
            <Link to={createPageUrl("AdminUsers")}>
               <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">مشاهده همه</Button>
            </Link>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
               <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                     <th className="pb-3 pr-4">کاربر</th>
                     <th className="pb-3">نقش</th>
                     <th className="pb-3">تاریخ ثبت‌نام</th>
                     <th className="pb-3 text-left pl-4">وضعیت</th>
                  </tr>
               </thead>
               <tbody className="text-slate-300">
                  {recentUsers.map(u => (
                     <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 pr-4 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: u.avatar_color || '#64748b' }}>
                              {u.full_name?.charAt(0)}
                           </div>
                           {u.full_name}
                        </td>
                        <td className="py-3">
                           <span className={`px-2 py-1 rounded-full text-xs ${
                              u.student_role === 'teacher' ? 'bg-blue-500/10 text-blue-400' :
                              u.student_role === 'student' ? 'bg-green-500/10 text-green-400' :
                              'bg-slate-500/10 text-slate-400'
                           }`}>
                              {u.student_role === 'teacher' ? 'معلم' : u.student_role === 'student' ? 'دانش‌آموز' : u.student_role === 'admin' ? 'مدیر' : 'مهمان'}
                           </span>
                        </td>
                        <td className="py-3">{toPersianDate(u.created_date)}</td>
                        <td className="py-3 text-left pl-4">
                           {u.class_id || u.teaching_assignments?.length > 0 ? (
                              <span className="text-emerald-400 flex items-center justify-end gap-1">
                                 <CheckCircle className="w-3 h-3" /> فعال
                              </span>
                           ) : (
                              <span className="text-orange-400 flex items-center justify-end gap-1">
                                 <AlertCircle className="w-3 h-3" /> نیاز به تکمیل
                              </span>
                           )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}