import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as UserIcon, Upload, Save, AlertCircle, CheckCircle, Sun, Moon, Type, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EditProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  
  // Settings
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState("medium");
  const [defaultTimeRange, setDefaultTimeRange] = useState("all");
  
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      setFullName(user.display_name || user.full_name || "");
      setBio(user.bio || "");
      setPhone(user.phone || "");
      setInstagram(user.social_links?.instagram || "");
      setTelegram(user.social_links?.telegram || "");
      setProfileImage(user.profile_image_url || "");
      setIsPublic(user.is_profile_public !== false);
      
      // Load settings
      const settings = await base44.entities.UserSettings.filter({ user_id: user.id });
      if (settings.length > 0) {
        setTheme(settings[0].theme || "dark");
        setFontSize(settings[0].font_size || "medium");
        setDefaultTimeRange(settings[0].default_time_range || "all");
      }
      
    } catch (error) {
      console.error("خطا در بارگیری پروفایل:", error);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setProfileImage(result.file_url);
      setSuccessMessage("تصویر با موفقیت آپلود شد");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("خطا در آپلود تصویر:", error);
      setErrorMessage("خطا در آپلود تصویر");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setErrorMessage("نام و نام خانوادگی الزامی است");
      return;
    }

    // Persian character validation
    const persianRegex = /^[\u0600-\u06FF\s]+$/;
    if (!persianRegex.test(fullName.trim())) {
      setErrorMessage("نام و نام خانوادگی باید فقط شامل حروف فارسی باشد");
      return;
    }

    if (phone && !/^09\d{9}$/.test(phone)) {
      setErrorMessage("شماره تماس باید با 09 شروع شده و 11 رقم باشد");
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        full_name: fullName.trim(),
        display_name: fullName.trim(), // Unify display_name with full_name
        bio: bio || "",
        phone: phone || "",
        social_links: {
          instagram: instagram || "",
          telegram: telegram || ""
        },
        is_profile_public: isPublic,
        profile_image_url: profileImage || "",
        last_profile_update: new Date().toISOString()
      };

      console.log("💾 بروزرسانی با داده‌ها:", updateData);
      
      await base44.auth.updateMe(updateData);
      
      // بروزرسانی تنظیمات
      const settingsData = {
        user_id: currentUser.id,
        theme,
        font_size: fontSize,
        default_time_range: defaultTimeRange
      };
      
      const existingSettings = await base44.entities.UserSettings.filter({ user_id: currentUser.id });
      if (existingSettings.length > 0) {
        await base44.entities.UserSettings.update(existingSettings[0].id, settingsData);
      } else {
        await base44.entities.UserSettings.create(settingsData);
      }
      
      // بروزرسانی پروفایل عمومی
      try {
        const publicProfiles = await base44.entities.PublicProfile.filter({ user_id: currentUser.id });
        const profileData = {
          user_id: currentUser.id,
          full_name: fullName.trim(),
          display_name: fullName.trim(),
          grade: currentUser.grade || "",
          student_role: currentUser.student_role || "student",
          avatar_color: currentUser.avatar_color || "#8B5CF6",
          profile_image_url: profileImage || "",
          coins: currentUser.coins || 0,
          level: currentUser.level || 1
        };

        if (publicProfiles.length > 0) {
          await base44.entities.PublicProfile.update(publicProfiles[0].id, profileData);
        } else {
          await base44.entities.PublicProfile.create(profileData);
        }
      } catch (error) {
        console.error("خطا در بروزرسانی پروفایل عمومی:", error);
      }

      setSuccessMessage("پروفایل با موفقیت بروزرسانی شد");
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error("خطا در بروزرسانی پروفایل:", error);
      setErrorMessage("خطا در بروزرسانی پروفایل. لطفاً دوباره تلاش کنید.");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری پروفایل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <UserIcon className="w-10 h-10 text-purple-500" />
          ویرایش پروفایل
        </h1>
        <p className="text-gray-300 text-lg">اطلاعات شخصی خود را ویرایش کنید</p>
      </motion.div>

      {errorMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="clay-card p-4 mb-6 bg-red-500/20 border-2 border-red-500"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{errorMessage}</p>
          </div>
        </motion.div>
      )}

      {successMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="clay-card p-4 mb-6 bg-green-500/20 border-2 border-green-500"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-200">{successMessage}</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white">تصویر پروفایل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-purple-500"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                  style={{ backgroundColor: currentUser?.avatar_color || "#8B5CF6" }}
                >
                  {(fullName || "د").charAt(0)}
                </div>
              )}
              <div>
                <label className="clay-button px-4 py-2 cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploading ? "در حال آپلود..." : "انتخاب تصویر"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="text-sm text-gray-400 mt-2">
                  فرمت‌های مجاز: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white">اطلاعات اصلی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                نام و نام خانوادگی (فارسی) <span className="text-red-400">*</span>
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: علی احمدی"
                className="clay-card text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                درباره من
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="چند خط درباره خودتان بنویسید..."
                className="clay-card text-white h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                شماره تماس
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                className="clay-card text-white"
                dir="ltr"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white">شبکه‌های اجتماعی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                اینستاگرام
              </label>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="username@"
                className="clay-card text-white"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                تلگرام
              </label>
              <Input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="username@"
                className="clay-card text-white"
                dir="ltr"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-400" />
              تنظیمات ظاهری
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                تم رنگی
              </label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="clay-card text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      تیره
                    </div>
                  </SelectItem>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      روشن
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                اندازه فونت
              </label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger className="clay-card text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">کوچک</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="large">بزرگ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Settings */}
        {currentUser?.student_role === "teacher" && (
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                تنظیمات معلم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  بازه زمانی پیش‌فرض گزارش‌ها
                </label>
                <Select value={defaultTimeRange} onValueChange={setDefaultTimeRange}>
                  <SelectTrigger className="clay-card text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">هفته اخیر</SelectItem>
                    <SelectItem value="month">ماه اخیر</SelectItem>
                    <SelectItem value="semester">نیمسال جاری</SelectItem>
                    <SelectItem value="all">همه زمان‌ها</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy */}
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white">تنظیمات حریم خصوصی</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="text-white">پروفایل من برای همه قابل مشاهده باشد</span>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link to={createPageUrl("StudentProfile")} className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full clay-button text-white"
            >
              انصراف
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 clay-button bg-gradient-to-r from-purple-500 to-blue-500 text-white"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                در حال ذخیره...
              </span>
            ) : (
              <>
                <Save className="w-5 h-5 ml-2" />
                ذخیره تغییرات
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}