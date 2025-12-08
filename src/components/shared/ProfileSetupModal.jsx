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
    class_id: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gradeOpen, setGradeOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name || "",
        grade: currentUser.grade || "",
        class_id: currentUser.class_id || ""
      });
    }
    loadClasses();
  }, [currentUser]);

  const loadClasses = async () => {
    try {
      const classes = await base44.entities.Class.list();
      setAvailableClasses(classes);
    } catch (e) {
      console.error("Error loading classes", e);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setGradeOpen(false);
      setClassOpen(false);
    };
    
    if (gradeOpen || classOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [gradeOpen, classOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.full_name.trim()) {
      setError("لطفاً نام کامل خود را وارد کنید");
      return;
    }

    // Persian character validation
    const persianRegex = /^[\u0600-\u06FF\s]+$/;
    if (!persianRegex.test(formData.full_name.trim())) {
      setError("نام و نام خانوادگی باید فقط شامل حروف فارسی باشد");
      return;
    }

    if (currentUser.student_role === "student") {
      if (!formData.grade) {
        setError("لطفاً پایه تحصیلی را انتخاب کنید");
        return;
      }
      if (!formData.class_id) {
        setError("لطفاً کلاس خود را انتخاب کنید");
        return;
      }
    }

    setLoading(true);
    try {
      const updateData = {
        full_name: formData.full_name.trim(),
        display_name: formData.full_name.trim(),
      };

      if (currentUser.student_role === "student") {
        updateData.grade = formData.grade;
        updateData.class_id = formData.class_id;
      }

      await base44.auth.updateMe(updateData);
      
      try {
        const profiles = await base44.entities.PublicProfile.filter({ user_id: currentUser.id });
        const profileData = {
          user_id: currentUser.id,
          full_name: formData.full_name.trim(),
          display_name: formData.full_name.trim(),
          student_role: currentUser.student_role,
          avatar_color: currentUser.avatar_color || "#8B5CF6",
          profile_image_url: currentUser.profile_image_url || "",
          coins: currentUser.coins || 0,
          level: currentUser.level || 1,
          grade: updateData.grade || "",
          class_id: updateData.class_id || ""
        };

        if (profiles.length > 0) {
          await base44.entities.PublicProfile.update(profiles[0].id, profileData);
        } else {
          await base44.entities.PublicProfile.create(profileData);
        }
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

  const grades = ["هفتم", "هشتم", "نهم"];
  const filteredClasses = availableClasses.filter(c => c.grade === formData.grade);

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

          {currentUser.student_role === "student" && (
            <>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  پایه تحصیلی *
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGradeOpen(!gradeOpen);
                    setClassOpen(false);
                  }}
                  className="clay-card w-full p-3 text-white text-right flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                >
                  <span className={formData.grade ? "text-white" : "text-gray-400"}>
                    {formData.grade || "پایه خود را انتخاب کنید"}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${gradeOpen ? 'rotate-180' : ''}`} />
                </button>
                {gradeOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 clay-card p-2 z-[10000] shadow-xl max-h-40 overflow-y-auto">
                    {grades.map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, grade, class_id: "" });
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

              {formData.grade && (
                 <div className="relative">
                 <label className="block text-sm font-medium text-gray-300 mb-2">
                   کلاس *
                 </label>
                 <button
                   type="button"
                   onClick={(e) => {
                     e.stopPropagation();
                     setClassOpen(!classOpen);
                     setGradeOpen(false);
                   }}
                   className="clay-card w-full p-3 text-white text-right flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                 >
                   <span className={formData.class_id ? "text-white" : "text-gray-400"}>
                     {availableClasses.find(c => c.id === formData.class_id)?.name || "کلاس خود را انتخاب کنید"}
                   </span>
                   <ChevronDown className={`w-5 h-5 transition-transform ${classOpen ? 'rotate-180' : ''}`} />
                 </button>
                 {classOpen && (
                   <div className="absolute top-full left-0 right-0 mt-2 clay-card p-2 z-[10000] shadow-xl max-h-40 overflow-y-auto">
                     {filteredClasses.length > 0 ? filteredClasses.map((cls) => (
                       <button
                         key={cls.id}
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           setFormData({ ...formData, class_id: cls.id });
                           setClassOpen(false);
                         }}
                         className={`w-full text-right p-3 rounded-lg hover:bg-purple-500/20 transition-colors ${
                           formData.class_id === cls.id ? 'bg-purple-500/30 text-purple-300 font-medium' : 'text-white'
                         }`}
                       >
                         🏛 {cls.name}
                       </button>
                     )) : (
                       <p className="p-3 text-gray-400 text-center">هیچ کلاسی یافت نشد</p>
                     )}
                   </div>
                 )}
               </div>
              )}
            </>
          )}

          {currentUser.student_role === "teacher" && (
             <div className="clay-card p-3 bg-blue-900/30 border border-blue-500">
              <p className="text-sm text-blue-200">
                دروس شما توسط مدیر سیستم تعیین خواهد شد.
              </p>
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
      </motion.div>
    </div>
  );
}