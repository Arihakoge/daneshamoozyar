import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Star, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CompleteProfile() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setFullName(currentUser.full_name || "");
    } catch (error) {
      console.error("خطا در بارگیری کاربر:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSaving(true);
    try {
      await User.updateMyUserData({
        full_name: fullName.trim()
      });
      
      // هدایت به داشبورد مناسب
      if (user.student_role === "teacher") {
        navigate(createPageUrl("TeacherDashboard"));
      } else if (user.student_role === "student") {
        navigate(createPageUrl("StudentDashboard"));
      } else if (user.student_role === "admin") {
        navigate(createPageUrl("AdminDashboard"));
      }
    } catch (error) {
      console.error("خطا در ذخیره اطلاعات:", error);
    }
    setSaving(false);
  };

  const getRoleTitle = (role) => {
    const titles = {
      teacher: "معلم محترم",
      student: "دانش‌آموز عزیز",
      admin: "مدیر گرامی"
    };
    return titles[role] || "کاربر محترم";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="p-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <UserPlus className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          تکمیل اطلاعات پروفایل
        </h1>
        <p className="text-gray-300 text-lg">
          {getRoleTitle(user?.student_role)}، لطفاً اطلاعات خود را تکمیل کنید
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-2xl text-white">اطلاعات شخصی</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  نام و نام خانوادگی *
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="نام کامل خود را وارد کنید"
                  className="clay-card text-white placeholder-gray-400 h-12 text-lg"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  این نام در تمام بخش‌های سیستم نمایش داده خواهد شد
                </p>
              </div>

              <div className="clay-card p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-bold text-white">نکات مهم:</h3>
                </div>
                <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                  <li>نام شما در داشبورد و گزارش‌ها نمایش داده می‌شود</li>
                  <li>این اطلاعات بعداً قابل ویرایش است</li>
                  {user?.student_role === "teacher" && (
                    <>
                      <li>3 کلاس نمونه با 12 تکلیف برای شما ایجاد شده است</li>
                      <li>می‌توانید کلاس‌ها و تکالیف را ویرایش یا حذف کنید</li>
                    </>
                  )}
                  {user?.student_role === "student" && (
                    <li>50 سکه هدیه شروع برای شما در نظر گرفته شده است</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving || !fullName.trim()}
                  className="flex-1 clay-button bg-gradient-to-r from-purple-500 to-blue-500 text-white py-6 text-lg font-medium"
                >
                  {saving ? (
                    "در حال ذخیره..."
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      ذخیره و ادامه
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-center"
      >
        <p className="text-gray-400 text-sm">
          با تکمیل اطلاعات، شما می‌توانید از تمام امکانات سیستم استفاده کنید
        </p>
      </motion.div>
    </div>
  );
}