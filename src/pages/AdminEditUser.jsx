import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User as UserIcon, 
  Save, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminEditUser() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const allUsers = await base44.entities.User.list();
      const foundUser = allUsers.find(u => u.id === userId);
      
      if (!foundUser) {
        setMessage({ type: "error", text: "کاربر یافت نشد" });
        return;
      }

      setUser(foundUser);
      setDisplayName(foundUser.display_name || foundUser.full_name || "");
      setRole(foundUser.student_role || "");
      setGrade(foundUser.grade || "");
      setSubject(foundUser.subject || "");
    } catch (error) {
      console.error("خطا در بارگیری کاربر:", error);
      setMessage({ type: "error", text: "خطا در بارگیری اطلاعات کاربر" });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!displayName.trim()) {
      setMessage({ type: "error", text: "نام نمایشی الزامی است" });
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        display_name: displayName.trim(),
        student_role: role,
        ...(role === "student" || role === "teacher" ? { grade } : {}),
        ...(role === "teacher" ? { subject } : {})
      };

      await base44.entities.User.update(userId, updateData);
      
      setMessage({ type: "success", text: "✅ کاربر با موفقیت بروزرسانی شد" });
      
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (error) {
      console.error("خطا در بروزرسانی:", error);
      setMessage({ type: "error", text: "خطا در ذخیره اطلاعات" });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="clay-card p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg">کاربر یافت نشد</p>
          <Button onClick={() => navigate(-1)} className="mt-4 clay-button">
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Button onClick={() => navigate(-1)} variant="ghost" className="clay-button text-white mb-4">
          <ArrowRight className="w-5 h-5 ml-2" />
          بازگشت
        </Button>
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <UserIcon className="w-10 h-10 text-purple-500" />
          ویرایش کاربر
        </h1>
        <p className="text-gray-300 text-lg">ویرایش اطلاعات {user.email}</p>
      </motion.div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`clay-card p-4 my-6 flex items-center gap-3 ${
            message.type === "success" 
              ? "bg-green-900/30 border border-green-500" 
              : "bg-red-900/30 border border-red-500"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <p className={message.type === "success" ? "text-green-300" : "text-red-300"}>
            {message.text}
          </p>
        </motion.div>
      )}

      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="text-white">اطلاعات کاربر</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                نام نمایشی *
              </label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="clay-card text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                نقش *
              </label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="clay-card text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">دانش‌آموز</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="admin">مدیر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(role === "student" || role === "teacher") && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  پایه {role === "teacher" ? "تدریس" : "تحصیلی"} *
                </label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="clay-card text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="هفتم">هفتم</SelectItem>
                    <SelectItem value="هشتم">هشتم</SelectItem>
                    <SelectItem value="نهم">نهم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {role === "teacher" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  درس تخصصی *
                </label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="clay-card text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ریاضی">ریاضی</SelectItem>
                    <SelectItem value="علوم">علوم</SelectItem>
                    <SelectItem value="فارسی">فارسی</SelectItem>
                    <SelectItem value="زبان">زبان</SelectItem>
                    <SelectItem value="عربی">عربی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex-1 clay-button text-white"
                disabled={saving}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 clay-button bg-purple-500 text-white"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال ذخیره...
                  </span>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    ذخیره تغییرات
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}