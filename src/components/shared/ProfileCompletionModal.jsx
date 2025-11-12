import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@/entities/User";
import { UserPlus, Star } from "lucide-react";

export default function ProfileCompletionModal({ isOpen, onComplete, currentUser }) {
  const [fullName, setFullName] = useState(currentUser?.full_name || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setLoading(true);
    try {
      await User.updateMyUserData({
        full_name: fullName.trim()
      });
      
      const updatedUser = await User.me();
      onComplete(updatedUser);
    } catch (error) {
      console.error("خطا در بروزرسانی پروفایل:", error);
    }
    setLoading(false);
  };

  const getRoleTitle = (role) => {
    const titles = {
      teacher: "معلم محترم",
      student: "دانش‌آموز عزیز",
      admin: "مدیر گرامی"
    };
    return titles[role] || "کاربر محترم";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="clay-card p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              به دانش آموزیار خوش آمدید! 🎉
            </h2>
            <p className="text-gray-300">
              {getRoleTitle(currentUser.student_role)}، لطفاً نام کامل خود را وارد کنید
            </p>
          </div>

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
                className="clay-card text-white placeholder-gray-400"
                required
                autoFocus
              />
            </div>

            <div className="clay-card p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-white">نکات مهم:</h3>
              </div>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>نام شما در تمام بخش‌های سیستم نمایش داده می‌شود</li>
                <li>این اطلاعات بعداً قابل ویرایش است</li>
                {currentUser.student_role === "teacher" && (
                  <li>یک کلاس نمونه برای شما ایجاد خواهد شد</li>
                )}
              </ul>
            </div>

            <Button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="w-full clay-button bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 text-lg font-medium"
            >
              {loading ? "در حال ذخیره..." : "ادامه و ورود به سیستم"}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}