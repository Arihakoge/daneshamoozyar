import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toPersianDate } from "@/components/utils";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const allPublicProfiles = await base44.entities.PublicProfile.list();
      setUsers(allPublicProfiles);
    } catch (error) {
      console.error("Error loading users:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  
  const handleDeleteUser = async (userId) => {
    if (window.confirm("آیا از حذف این کاربر مطمئن هستید؟ این عمل غیرقابل بازگشت است.")) {
      try {
        await base44.entities.User.delete(userId);
        await base44.entities.PublicProfile.filter({ user_id: userId }).then(profiles => {
          if (profiles.length > 0) {
            base44.entities.PublicProfile.delete(profiles[0].id);
          }
        });
        loadUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert("خطا در حذف کاربر. ممکن است این کاربر وابستگی‌هایی در سیستم داشته باشد.");
      }
    }
  };

  const getRoleTranslation = (role) => ({
    teacher: "معلم",
    student: "دانش‌آموز",
    admin: "مدیر",
  }[role] || role);

  const getRoleBadgeClass = (role) => ({
    teacher: "bg-blue-100 text-blue-800",
    student: "bg-green-100 text-green-800",
    admin: "bg-purple-100 text-purple-800",
  }[role] || "bg-gray-100 text-gray-800");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری کاربران...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Users className="w-10 h-10 text-purple-500" />
          مدیریت کاربران
        </h1>
        <p className="text-gray-300 text-lg">مشاهده، ویرایش و حذف کاربران سیستم</p>
      </motion.div>

      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="text-white">لیست تمام کاربران</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">نام کامل</TableHead>
                <TableHead className="text-white">نقش</TableHead>
                <TableHead className="text-white">پایه/درس</TableHead>
                <TableHead className="text-white">تاریخ عضویت</TableHead>
                <TableHead className="text-left text-white">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium text-white">{user.display_name || user.full_name}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeClass(user.student_role)}>
                      {getRoleTranslation(user.student_role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {user.student_role === "student" && user.grade}
                    {user.student_role === "teacher" && `${user.grade}`}
                    {user.student_role === "admin" && "-"}
                  </TableCell>
                  <TableCell className="text-gray-300">{toPersianDate(user.created_date)}</TableCell>
                  <TableCell className="text-left">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.user_id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length === 0 && <p className="text-center text-gray-400 py-8">کاربری در سیستم وجود ندارد.</p>}
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400 mt-4">
        <strong>نکته:</strong> برای افزودن کاربر جدید، از بخش "دعوت کاربر" در پلتفرم base44 استفاده کنید.
      </p>
    </div>
  );
}