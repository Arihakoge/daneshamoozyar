import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Edit, Trash2, X, Save, CheckSquare, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toPersianDate } from "@/components/utils";
import { Input } from "@/components/ui/input";

const ALL_SUBJECTS = [
  "قرآن", "پیام‌های آسمان", "فارسی", "نگارش", "ریاضی", "علوم", "مطالعات اجتماعی",
  "فرهنگ و هنر", "عربی", "انگلیسی", "کار و فناوری", "تفکر و سبک زندگی", "آمادگی دفاعی"
];

const GRADES = ["هفتم", "هشتم", "نهم"];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allPublicProfiles, allClasses] = await Promise.all([
        base44.entities.PublicProfile.list(),
        base44.entities.Class.list()
      ]);
      setUsers(allPublicProfiles);
      setClasses(allClasses);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleDeleteUser = async (userId) => {
    if (window.confirm("آیا از حذف این کاربر مطمئن هستید؟")) {
      try {
        await base44.entities.User.delete(userId);
        const profiles = users.filter(u => u.user_id === userId);
        if (profiles.length > 0) {
          await base44.entities.PublicProfile.delete(profiles[0].id);
        }
        loadData();
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert("خطا در حذف کاربر.");
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      ...user,
      subjects: user.subjects || (user.subject ? [user.subject] : [])
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      const updateData = {
        full_name: editForm.full_name,
        student_role: editForm.student_role,
        grade: editForm.grade,
        class_id: editForm.class_id,
        subjects: editForm.subjects
      };

      // Update PublicProfile
      await base44.entities.PublicProfile.update(editingUser.id, updateData);
      
      // Update User entity (if possible/allowed) - mostly for role/name sync
      try {
        await base44.auth.updateMe(updateData); // This only updates 'me', not other users.
        // Admin cannot update other users' auth data directly via client SDK usually, 
        // but PublicProfile is what matters for the app logic.
      } catch (e) {
        // Ignore auth update error
      }

      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("خطا در بروزرسانی کاربر");
    }
  };

  const toggleSubject = (subject) => {
    const currentSubjects = editForm.subjects || [];
    if (currentSubjects.includes(subject)) {
      setEditForm({ ...editForm, subjects: currentSubjects.filter(s => s !== subject) });
    } else {
      setEditForm({ ...editForm, subjects: [...currentSubjects, subject] });
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
        <p className="text-gray-300 text-lg">تعریف دروس معلمان و مدیریت کلاس دانش‌آموزان</p>
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
                <TableHead className="text-white">اطلاعات تحصیلی</TableHead>
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
                  <TableCell className="text-gray-300 text-sm">
                    {user.student_role === "student" && (
                      <div className="flex flex-col gap-1">
                        <span>{user.grade}</span>
                        <span className="text-xs opacity-70">
                          {classes.find(c => c.id === user.class_id)?.name || "بدون کلاس"}
                        </span>
                      </div>
                    )}
                    {user.student_role === "teacher" && (
                      <div className="flex flex-wrap gap-1">
                        {(user.subjects && user.subjects.length > 0) ? (
                          user.subjects.map(s => (
                            <Badge key={s} variant="outline" className="text-xs border-blue-400 text-blue-300">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-red-300">درسی ثبت نشده</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(user)}>
                        <Edit className="h-4 w-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.user_id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setEditingUser(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="clay-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">ویرایش کاربر</h2>
                <Button variant="ghost" size="icon" onClick={() => setEditingUser(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">نام کامل</label>
                  <Input 
                    value={editForm.full_name} 
                    onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                    className="clay-card text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">نقش</label>
                  <select 
                    value={editForm.student_role} 
                    onChange={e => setEditForm({...editForm, student_role: e.target.value})}
                    className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700"
                  >
                    <option value="student">دانش‌آموز</option>
                    <option value="teacher">معلم</option>
                    <option value="admin">مدیر</option>
                  </select>
                </div>

                {editForm.student_role === "student" && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">پایه تحصیلی</label>
                      <select 
                        value={editForm.grade} 
                        onChange={e => setEditForm({...editForm, grade: e.target.value})}
                        className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700"
                      >
                        <option value="">انتخاب کنید</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">کلاس</label>
                      <select 
                        value={editForm.class_id} 
                        onChange={e => setEditForm({...editForm, class_id: e.target.value})}
                        className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700"
                      >
                        <option value="">انتخاب کنید</option>
                        {classes.filter(c => !editForm.grade || c.grade === editForm.grade).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {editForm.student_role === "teacher" && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">دروس قابل تدریس</label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-800/50 rounded-lg">
                      {ALL_SUBJECTS.map(subject => (
                        <div 
                          key={subject} 
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            (editForm.subjects || []).includes(subject) ? "bg-purple-600/30 text-purple-200" : "text-gray-400 hover:bg-slate-700"
                          }`}
                          onClick={() => toggleSubject(subject)}
                        >
                          {(editForm.subjects || []).includes(subject) ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                          <span className="text-sm">{subject}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleSaveUser}>
                    <Save className="w-4 h-4 mr-2" /> ذخیره تغییرات
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={() => setEditingUser(null)}>
                    انصراف
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}