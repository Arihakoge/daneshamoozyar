import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  BookOpen,
  User as UserIcon,
  Trophy,
  MessageCircle,
  GraduationCap,
  FileText,
  Menu,
  LogOut,
  X,
  Users,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ProfileSetupModal from "@/components/shared/ProfileSetupModal";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [theme, setTheme] = useState("dark");

  const getRandomColor = useCallback(() => {
    const colors = ["#8B5CF6", "#EC4899", "#06B6D4", "#10B981", "#F59E0B"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const initializeClasses = useCallback(async () => {
    const existingClasses = await base44.entities.Class.list();

    if (existingClasses.length < 9) {
      console.log("ایجاد کلاس‌های پایه سیستم...");

      const grades = ["هفتم", "هشتم", "نهم"];
      const sections = ["الف", "ب", "ج"];
      
      for (const grade of grades) {
        for (const section of sections) {
          const className = `کلاس ${grade} - ${section}`;
          const exists = existingClasses.find(c => c.name === className && c.grade === grade);
          
          if (!exists) {
            await base44.entities.Class.create({
              name: className,
              grade: grade,
              section: section,
              description: `کلاس ${section} پایه ${grade}`,
              color: getRandomColor()
            });
          }
        }
      }
      console.log("کلاس‌های پایه ایجاد شدند");
    }
  }, [getRandomColor]);

  const initializeUser = useCallback(async () => {
    try {
      await initializeClasses();

      let user = await base44.auth.me();
      console.log("کاربر فعلی:", user);

      if (!user.student_role) {
        const allUsers = await base44.entities.User.list();
        const usersWithRoles = allUsers.filter(u => u.student_role);

        let role = "student";
        if (usersWithRoles.length === 0) {
          role = "admin";
        }

        await base44.auth.updateMe({
          student_role: role,
          coins: role === "student" ? 50 : 0,
          level: 1,
          avatar_color: getRandomColor()
        });

        user = await base44.auth.me();
      }

      // Check if profile is complete
      // For students: Name, Grade, and Class are required
      // For others: Name is required (Teachers' subjects are set by admin, so we don't block them here)
      const needsProfileCompletion = !user.full_name || user.full_name.trim() === "" ||
                                     (user.student_role === "student" && (!user.grade || !user.class_id));

      if (needsProfileCompletion) {
        setShowProfileSetup(true);
      }

      // ایجاد یا بروزرسانی پروفایل عمومی
      try {
        const publicProfiles = await base44.entities.PublicProfile.filter({ user_id: user.id });
        
        const profileData = {
          user_id: user.id,
          full_name: user.full_name || user.display_name || "کاربر",
          display_name: user.display_name || user.full_name || "کاربر",
          grade: user.grade || "",
          student_role: user.student_role || "student",
          avatar_color: user.avatar_color || getRandomColor(),
          profile_image_url: user.profile_image_url || "",
          coins: user.coins || 0,
          level: user.level || 1
        };

        if (publicProfiles.length > 0) {
          await base44.entities.PublicProfile.update(publicProfiles[0].id, profileData);
        } else {
          await base44.entities.PublicProfile.create(profileData);
        }
      } catch (error) {
        console.error("خطا در ایجاد یا بروزرسانی پروفایل عمومی:", error);
      }

      setCurrentUser(user);
      
      // Load theme from settings
      const settings = await base44.entities.UserSettings.filter({ user_id: user.id });
      if (settings.length > 0 && settings[0].theme) {
        setTheme(settings[0].theme);
        document.documentElement.classList.toggle('light-theme', settings[0].theme === 'light');
      }
      
      setLoading(false);
    } catch (error) {
      console.error("خطا در بارگیری کاربر:", error);
      if (error.response && error.response.status === 401) {
        await base44.auth.redirectToLogin();
      } else {
        setLoading(false);
      }
    }
  }, [getRandomColor, initializeClasses]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  const handleProfileSetupComplete = async () => {
    setShowProfileSetup(false);
    const updatedUser = await base44.auth.me();
    setCurrentUser(updatedUser);
    // After profile setup, also update the public profile
    try {
      const publicProfiles = await base44.entities.PublicProfile.filter({ user_id: updatedUser.id });
      const profileData = {
        user_id: updatedUser.id,
        full_name: updatedUser.full_name || updatedUser.display_name || "کاربر",
        display_name: updatedUser.display_name || updatedUser.full_name || "کاربر",
        grade: updatedUser.grade || "",
        student_role: updatedUser.student_role || "student",
        avatar_color: updatedUser.avatar_color || getRandomColor(),
        profile_image_url: updatedUser.profile_image_url || "",
        coins: updatedUser.coins || 0,
        level: updatedUser.level || 1
      };

      if (publicProfiles.length > 0) {
        await base44.entities.PublicProfile.update(publicProfiles[0].id, profileData);
      } else {
        await base44.entities.PublicProfile.create(profileData);
      }
      
      // Reload to ensure all child components get fresh data and tours can start
      window.location.reload();
    } catch (error) {
      console.error("خطا در بروزرسانی پروفایل عمومی پس از تکمیل تنظیمات:", error);
      window.location.reload();
    }
  };

  const getNavigationItems = () => {
    if (!currentUser) return [];

    const role = currentUser.student_role;

    if (role === "student") {
      return [
        { title: "داشبورد", url: createPageUrl("StudentDashboard"), icon: LayoutDashboard },
        { title: "تکالیف من", url: createPageUrl("StudentAssignments"), icon: BookOpen },
        { title: "دستاوردها", url: createPageUrl("Achievements"), icon: Trophy },
        { title: "پروفایل من", url: createPageUrl("StudentProfile"), icon: UserIcon },
        { title: "ویرایش پروفایل", url: createPageUrl("EditProfile"), icon: Edit },
        { title: "تابلوی امتیازات", url: createPageUrl("Scoreboard"), icon: Trophy },
        { title: "یارا - دستیار هوشمند", url: createPageUrl("YaraChat"), icon: MessageCircle },
      ];
    } else if (role === "teacher") {
      return [
        { title: "داشبورد", url: createPageUrl("TeacherDashboard"), icon: LayoutDashboard },
        { title: "مدیریت تکالیف", url: createPageUrl("TeacherAssignments"), icon: FileText },
        { title: "گزارش‌های عملکرد", url: createPageUrl("TeacherReports"), icon: FileText },
        { title: "ویرایش پروفایل", url: createPageUrl("EditProfile"), icon: Edit },
        { title: "تابلوی امتیازات", url: createPageUrl("TeacherScoreboard"), icon: Trophy },
        { title: "یارا - دستیار هوشمند", url: createPageUrl("YaraChat"), icon: MessageCircle },
      ];
    } else if (role === "admin") {
      return [
        { title: "داشبورد مدیریت", url: createPageUrl("AdminDashboard"), icon: LayoutDashboard },
        { title: "مدیریت کاربران", url: createPageUrl("AdminUsers"), icon: Users },
        { title: "مدیریت کلاس‌ها", url: createPageUrl("AdminClasses"), icon: GraduationCap },
        { title: "ویرایش پروفایل", url: createPageUrl("EditProfile"), icon: Edit },
        { title: "تابلوی امتیازات", url: createPageUrl("AdminScoreboard"), icon: Trophy },
        { title: "یارا - دستیار هوشمند", url: createPageUrl("YaraChat"), icon: MessageCircle },
      ];
    }

    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">در حال بارگیری...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`min-h-screen ${theme === 'light' ? 'bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100' : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'}`}>
      <style>
        {`
          ${theme === 'light' ? `
          .clay-card {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(200, 200, 220, 0.4);
            color: #1e293b;
          }

          .clay-button {
            background: linear-gradient(145deg, rgba(240, 240, 250, 0.9), rgba(250, 250, 255, 0.6));
            border-radius: 16px;
            box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(200, 200, 220, 0.5);
            transition: all 0.2s ease;
            color: #334155;
            font-weight: 500;
          }

          .clay-button:hover {
            box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.5);
            color: #8B5CF6;
            transform: translateY(1px);
          }

          .clay-button.active {
            box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.15), inset -4px -4px 8px rgba(255, 255, 255, 0.6);
            background: rgba(139, 92, 246, 0.15);
            color: #8B5CF6;
            font-weight: 600;
          }
          ` : `
          .clay-card {
            background: rgba(15, 23, 42, 0.6);
            border-radius: 20px;
            box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(30, 41, 59, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(71, 85, 105, 0.4);
            color: #e2e8f0;
          }

          .clay-button {
            background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.3));
            border-radius: 16px;
            box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3), -4px -4px 8px rgba(30, 41, 59, 0.2);
            border: 1px solid rgba(71, 85, 105, 0.5);
            transition: all 0.2s ease;
            color: #e2e8f0;
            font-weight: 500;
          }

          .clay-button:hover {
            box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.3), inset -4px -4px 8px rgba(30, 41, 59, 0.2);
            color: #8B5CF6;
            transform: translateY(1px);
          }

          .clay-button.active {
            box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.4), inset -4px -4px 8px rgba(30, 41, 59, 0.3);
            background: rgba(139, 92, 246, 0.15);
            color: #8B5CF6;
            font-weight: 600;
          }
          `}
        `}
      </style>

      <div className="flex relative">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 clay-card rounded-none rounded-b-2xl">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="clay-button"
            >
              <Menu className="w-6 h-6 text-purple-400" />
            </Button>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-purple-400" />
              <h2 className="text-lg font-bold text-gray-200">دانش آموزیار</h2>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 lg:mr-80 pt-20 lg:pt-0 transition-all duration-300">
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="fixed right-0 top-0 h-full w-80 clay-card rounded-l-2xl rounded-r-none z-40 hidden lg:block">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="clay-card p-3 bg-gradient-to-br from-purple-400 to-pink-400">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-200">دانش آموزیار</h2>
                  <p className="text-sm text-gray-400">پنل متوسطه اول</p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 px-2">
                منوی اصلی
              </p>
              <nav className="space-y-2">
                {getNavigationItems().map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`clay-button w-full flex items-center gap-4 p-4 ${
                      location.pathname === item.url ? 'active' : ''
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="p-4 border-t border-gray-700/50">
              {currentUser && (
                <div className="clay-card p-4">
                  <div className="flex items-center gap-3">
                    {currentUser.profile_image_url ? (
                      <img
                        src={currentUser.profile_image_url}
                        alt="تصویر پروفایل"
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: currentUser.avatar_color }}
                      >
                        {(currentUser.display_name || currentUser.full_name || "ک").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-200 truncate">
                        {currentUser.display_name || currentUser.full_name || "کاربر"}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {currentUser.student_role === "teacher" && `معلم ${(currentUser.teaching_assignments && currentUser.teaching_assignments.length > 0) ? [...new Set(currentUser.teaching_assignments.map(a => a.subject))].join("، ") : (currentUser.subjects ? currentUser.subjects.join("، ") : (currentUser.subject || ""))}`}
                        {currentUser.student_role === "student" && `دانش‌آموز ${currentUser.grade || ""}`}
                        {currentUser.student_role === "admin" && "مدیر"}
                      </p>
                      {currentUser.student_role === "student" && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-yellow-400 font-medium">
                            🪙 {currentUser.coins || 0}
                          </span>
                          <span className="text-xs text-blue-400 font-medium">
                            سطح {currentUser.level || 1}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => base44.auth.logout()}
                className="clay-button w-full flex items-center gap-4 p-4 mt-2 text-red-400 hover:text-red-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">خروج</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            >
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                className="absolute right-0 top-0 h-full w-80 clay-card rounded-l-2xl rounded-r-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="clay-card p-2 bg-gradient-to-br from-purple-400 to-pink-400">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-200">دانش آموزیار</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(false)}
                      className="clay-button"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </Button>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto">
                    <nav className="space-y-2">
                      {getNavigationItems().map((item) => (
                        <Link
                          key={item.title}
                          to={item.url}
                          onClick={() => setSidebarOpen(false)}
                          className={`clay-button w-full flex items-center gap-4 p-4 ${
                            location.pathname === item.url ? 'active' : ''
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">
                            {item.title}
                          </span>
                        </Link>
                      ))}
                    </nav>
                  </div>

                  <div className="p-4 border-t border-gray-700/50">
                    {currentUser && (
                      <div className="clay-card p-4 mb-2">
                        <div className="flex items-center gap-3">
                          {currentUser.profile_image_url ? (
                            <img
                              src={currentUser.profile_image_url}
                              alt="تصویر پروفایل"
                              className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: currentUser.avatar_color }}
                            >
                              {(currentUser.full_name || "کاربر").charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-200 truncate">
                              {currentUser.full_name || "کاربر"}
                            </p>
                            <p className="text-sm text-gray-400">
                              {currentUser.student_role === "teacher" && `معلم ${(currentUser.teaching_assignments && currentUser.teaching_assignments.length > 0) ? [...new Set(currentUser.teaching_assignments.map(a => a.subject))].join("، ") : (currentUser.subjects ? currentUser.subjects.join("، ") : (currentUser.subject || ""))}`}
                              {currentUser.student_role === "student" && `دانش‌آموز ${currentUser.grade || ""}`}
                              {currentUser.student_role === "admin" && "مدیر"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      onClick={() => base44.auth.logout()}
                      className="clay-button w-full flex items-center gap-4 p-3 text-red-400"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">خروج</span>
                    </Button>
                  </div>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Setup Modal - BLOCKING */}
        <ProfileSetupModal
          isOpen={showProfileSetup}
          currentUser={currentUser}
          onComplete={handleProfileSetupComplete}
        />
      </div>
    </div>
  );
}