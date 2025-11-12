import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { UserPlus, Star, AlertCircle, ChevronDown } from "lucide-react";

export default function ProfileSetupModal({ isOpen, currentUser, onComplete }) {
  const [formData, setFormData] = useState({
    full_name: "",
    grade: "",
    subject: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gradeOpen, setGradeOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name || "",
        grade: currentUser.grade || "",
        subject: currentUser.subject || ""
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = () => {
      setGradeOpen(false);
      setSubjectOpen(false);
    };
    
    if (gradeOpen || subjectOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [gradeOpen, subjectOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.full_name.trim()) {
      setError("لطفاً نام کامل خود را وارد کنید");
      return;
    }

    if (!formData.grade) {
      setError("لطفاً پایه تحصیلی را انتخاب کنید");
      return;
    }

    if (currentUser.student_role === "teacher" && !formData.subject) {
      setError("لطفاً درس تخصصی خود را انتخاب کنید");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.updateMe({
        full_name: formData.full_name.trim(),
        display_name: formData.full_name.trim(),
        grade: formData.grade,
        ...(currentUser.student_role === "teacher" && { subject: formData.subject })
      });
      
      try {
        await base44.entities.PublicProfile.create({
          user_id: currentUser.id,
          full_name: formData.full_name.trim(),
          display_name: formData.full_name.trim(),
          grade: formData.grade,
          student_role: currentUser.student_role,
          avatar_color: currentUser.avatar_color || "#8B5CF6",
          profile_image_url: currentUser.profile_image_url || "",
          coins: currentUser.coins || 0,
          level: currentUser.level || 1
        });
      } catch (publicProfileError) {
        console.error("خطا در ایجاد پروفایل عمومی:", publicProfileError);
      }
      
      onComplete();
    } catch (error) {
      console.error("خطا در بروزرسانی پروفایل:", error);
      setError("خطا در ذخیره اطلاعات. لطفاً دوباره تلاش کنید.");
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

  const getRoleDescription = (role) => {
    const descriptions = {
      teacher: "لطفاً اطلاعات خود را برای شروع تدریس تکمیل کنید",
      student: "لطفاً اطلاعات خود را برای شروع یادگیری تکمیل کنید",
      admin: "لطفاً اطلاعات خود را تکمیل کنید"
    };
    return descriptions[role] || "لطفاً اطلاعات خود را تکمیل کنید";
  };

  const grades = ["هفتم", "هشتم", "نهم"];
  const subjects = ["ریاضی", "علوم", "فارسی", "زبان", "عربی"];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="clay-card p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="text-center mb-6">
          <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            خوش آمدید! 🎉
          </h2>
          <p className="text-gray-300">
            {getRoleTitle(currentUser.student_role)}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {getRoleDescription(currentUser.student_role)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              نام و نام خانوادگی *
            </label>
            <Input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="مثال: علی احمدی"
              className="clay-card text-white placeholder-gray-400 h-12"
              required
              autoFocus
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {currentUser.student_role === "teacher" ? "پایه تدریس *" : "پایه تحصیلی *"}
            </label>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setGradeOpen(!gradeOpen);
                setSubjectOpen(false);
              }}
              className="clay-card w-full p-3 text-white text-right flex items-center justify-between hover:bg-gray-700/30 transition-colors"
            >
              <span className={formData.grade ? "text-white" : "text-gray-400"}>
                {formData.grade || "پایه خود را انتخاب کنید"}
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform ${gradeOpen ? 'rotate-180' : ''}`} />
            </button>
            {gradeOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 clay-card p-2 z-[10000] shadow-xl">
                {grades.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, grade });
                      setGradeOpen(false);
                    }}
                    className={`w-full text-right p-3 rounded-lg hover:bg-purple-500/20 transition-colors ${
                      formData.grade === grade ? 'bg-purple-500/30 text-purple-300 font-medium' : 'text-white'
                    }`}
                  >
                    📚 {grade}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentUser.student_role === "teacher" && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                درس تخصصی *
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSubjectOpen(!subjectOpen);
                  setGradeOpen(false);
                }}
                className="clay-card w-full p-3 text-white text-right flex items-center justify-between hover:bg-gray-700/30 transition-colors"
              >
                <span className={formData.subject ? "text-white" : "text-gray-400"}>
                  {formData.subject || "درس تخصصی خود را انتخاب کنید"}
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${subjectOpen ? 'rotate-180' : ''}`} />
              </button>
              {subjectOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 clay-card p-2 z-[10000] shadow-xl">
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, subject });
                        setSubjectOpen(false);
                      }}
                      className={`w-full text-right p-3 rounded-lg hover:bg-purple-500/20 transition-colors ${
                        formData.subject === subject ? 'bg-purple-500/30 text-purple-300 font-medium' : 'text-white'
                      }`}
                    >
                      📖 {subject}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="clay-card p-3 bg-red-900/30 border border-red-500">
              <div className="flex items-center gap-2 text-red-300">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="clay-card p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-white">
                {currentUser.student_role === "teacher" ? "نکته برای معلمان:" : "نکته برای دانش‌آموزان:"}
              </h3>
            </div>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              {currentUser.student_role === "teacher" ? (
                <>
                  <li>شما فقط تکالیف درس و پایه خودتان را مدیریت می‌کنید</li>
                  <li>دانش‌آموزان پایه شما تکالیف شما را خواهند دید</li>
                  <li>می‌توانید تکالیف را تصحیح و نمره‌دهی کنید</li>
                </>
              ) : (
                <>
                  <li>تکالیف تمام دروس پایه خود را خواهید دید</li>
                  <li>با انجام تکالیف، سکه و امتیاز کسب می‌کنید</li>
                  <li>می‌توانید با یارا (دستیار هوشمند) کمک بگیرید</li>
                </>
              )}
            </ul>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full clay-button bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 text-lg font-medium hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                در حال ذخیره...
              </span>
            ) : (
              "✅ ذخیره و ورود به سیستم"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          تکمیل این فرم برای استفاده از سیستم الزامی است
        </p>
      </motion.div>
    </div>
  );
}