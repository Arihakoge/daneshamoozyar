import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, GraduationCap, BookOpen, UserPlus } from "lucide-react";
import StatsCard from "../components/shared/StatsCard";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toPersianDate, toPersianNumber } from "@/components/utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, classes: 0, assignments: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const allPublicProfiles = await base44.entities.PublicProfile.list();
      const allClasses = await base44.entities.Class.list();
      const allAssignments = await base44.entities.Assignment.list();

      setRecentUsers(allPublicProfiles.slice(0, 5));
      setStats({
        users: allPublicProfiles.length,
        classes: allClasses.length,
        assignments: allAssignments.length,
      });
    } catch (error) {
      console.error("خطا در بارگیری داده‌های مدیریت:", error);
    }
    setLoading(false);
  };

  const getRoleTranslation = (role) => ({
    teacher: "معلم", student: "دانش‌آموز", admin: "مدیر"
  }[role] || role);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">در حال بارگیری داشبورد مدیریت...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">داشبورد مدیریت</h1>
        <p className="text-gray-300 text-lg">نمای کلی سیستم دانش آموزیار</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="کل کاربران" value={toPersianNumber(stats.users)} icon={Users} color="purple" delay={0.1} />
        <StatsCard title="کل کلاس‌ها" value={toPersianNumber(stats.classes)} icon={GraduationCap} color="blue" delay={0.2} />
        <StatsCard title="کل تکالیف" value={toPersianNumber(stats.assignments)} icon={BookOpen} color="green" delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{delay: 0.4}}>
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <UserPlus className="text-purple-400" />
              کاربران اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map(user => (
                <div key={user.user_id} className="clay-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: user.avatar_color }}
                    >
                      {user.profile_image_url ? (
                        <img src={user.profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.display_name?.charAt(0) || "ک"
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white">{user.display_name || user.full_name}</p>
                      <p className="text-sm text-gray-400">{user.grade}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">{getRoleTranslation(user.student_role)}</p>
                    <p className="text-xs text-gray-400">
                      {toPersianDate(user.created_date)}
                    </p>
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