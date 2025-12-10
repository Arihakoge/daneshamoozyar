import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Edit, Trash2, X, Save, Plus, Trash, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  
  // State for new assignment addition
  const [newAssignment, setNewAssignment] = useState({ grade: "", class_id: "", subject: "" });

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
      // Ensure teaching_assignments is an array
      teaching_assignments: user.teaching_assignments || []
    });
    setNewAssignment({ grade: "", class_id: "", subject: "" });
  };

  const handleAddAssignment = () => {
    if (!newAssignment.grade || !newAssignment.subject) {
      alert("لطفا پایه و درس را انتخاب کنید.");
      return;
    }
    
    const assignmentToAdd = {
      grade: newAssignment.grade,
      class_id: newAssignment.class_id || null, // null implies all classes of that grade if we wanted, but let's be specific or generic
      subject: newAssignment.subject,
      id: Date.now() // temporary ID for list key
    };

    setEditForm({
      ...editForm,
      teaching_assignments: [...editForm.teaching_assignments, assignmentToAdd]
    });
    setNewAssignment({ grade: "", class_id: "", subject: "" });
  };

  const handleRemoveAssignment = (index) => {
    const updatedAssignments = [...editForm.teaching_assignments];
    updatedAssignments.splice(index, 1);
    setEditForm({ ...editForm, teaching_assignments: updatedAssignments });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      // Sanitize assignments to remove temporary IDs and ensure correct format
      const sanitizedAssignments = (editForm.teaching_assignments || []).map(a => ({
        grade: a.grade,
        class_id: a.class_id || "", // Ensure string
        subject: a.subject
      }));

      // Collect subjects for backward compatibility (unique list)
      const uniqueSubjects = [...new Set(sanitizedAssignments.map(a => a.subject))];

      const updateData = {
        full_name: editForm.full_name,
        student_role: editForm.student_role,
        grade: editForm.grade, // For students
        class_id: editForm.class_id, // For students
        teaching_assignments: sanitizedAssignments,
        subjects: uniqueSubjects // Sync for backward compatibility
      };

      // Update PublicProfile
      await base44.entities.PublicProfile.update(editingUser.id, updateData);
      
      // Update User entity auth data
      try {
        await base44.auth.updateMe(updateData);
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

  const getRoleTranslation = (role) => ({
    teacher: "معلم",
    student: "دانش‌آموز",
    admin: "مدیر",
  }[role] || role);

  const getRoleBadgeClass = (role) => ({
    teacher: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    student: "bg-green-500/10 text-green-400 border-green-500/20",
    admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  }[role] || "bg-gray-500/10 text-gray-400");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-cyan-500" />
            مدیریت پیشرفته کاربران
          </h1>
          <p className="text-slate-400 text-lg">تعریف نقش‌ها، کلاس‌بندی دانش‌آموزان و تخصیص دقیق دروس معلمین</p>
        </motion.div>

        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader className="border-b border-slate-800">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                لیست کاربران سیستم
              </CardTitle>
              <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                {users.length} کاربر
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-800/50">
                <TableRow className="hover:bg-slate-800/50 border-slate-700">
                  <TableHead className="text-slate-300">نام کامل</TableHead>
                  <TableHead className="text-slate-300">نقش</TableHead>
                  <TableHead className="text-slate-300 w-[40%]">جزئیات تحصیلی / تدریس</TableHead>
                  <TableHead className="text-left text-slate-300">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.user_id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: user.avatar_color || '#64748b' }}
                        >
                          {(user.full_name || "?").charAt(0)}
                        </div>
                        {user.display_name || user.full_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadgeClass(user.student_role)}>
                        {getRoleTranslation(user.student_role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {user.student_role === "student" && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-slate-800 text-slate-300">{user.grade || "تعیین نشده"}</Badge>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-400">
                            {classes.find(c => c.id === user.class_id)?.name || "بدون کلاس"}
                          </span>
                        </div>
                      )}
                      {user.student_role === "teacher" && (
                        <div className="space-y-1">
                          {(user.teaching_assignments && user.teaching_assignments.length > 0) ? (
                            <div className="flex flex-wrap gap-1">
                              {user.teaching_assignments.map((assign, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs border-cyan-500/30 bg-cyan-500/5 text-cyan-300">
                                  {assign.subject} ({assign.grade} - {classes.find(c => c.id === assign.class_id)?.section || "همه"})
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            // Fallback for old data
                            user.subjects && user.subjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.subjects.map(s => <Badge key={s} variant="outline" className="text-xs border-slate-600 text-slate-400">{s}</Badge>)}
                              </div>
                            ) : (
                              <span className="text-xs text-red-400">بدون درس</span>
                            )
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(user)} className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.user_id)} className="text-red-500 hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
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
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Edit className="w-5 h-5 text-cyan-500" />
                    ویرایش مشخصات کاربر
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">نام کامل</label>
                      <Input 
                        value={editForm.full_name} 
                        onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-1">نقش در سیستم</label>
                      <select 
                        value={editForm.student_role} 
                        onChange={e => setEditForm({...editForm, student_role: e.target.value})}
                        className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:border-cyan-500 outline-none"
                      >
                        <option value="student">دانش‌آموز</option>
                        <option value="teacher">معلم</option>
                        <option value="admin">مدیر</option>
                      </select>
                    </div>
                  </div>

                  {editForm.student_role === "student" && (
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-4">
                      <h3 className="text-sm font-bold text-white mb-2 border-b border-slate-700 pb-2">اطلاعات تحصیلی دانش‌آموز</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">پایه تحصیلی</label>
                          <select 
                            value={editForm.grade} 
                            onChange={e => setEditForm({...editForm, grade: e.target.value, class_id: ""})}
                            className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:border-cyan-500 outline-none"
                          >
                            <option value="">انتخاب کنید</option>
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">کلاس</label>
                          <select 
                            value={editForm.class_id} 
                            onChange={e => setEditForm({...editForm, class_id: e.target.value})}
                            className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:border-cyan-500 outline-none"
                            disabled={!editForm.grade}
                          >
                            <option value="">انتخاب کنید</option>
                            {classes.filter(c => !editForm.grade || c.grade === editForm.grade).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {editForm.student_role === "teacher" && (
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-4">
                      <h3 className="text-sm font-bold text-white mb-2 border-b border-slate-700 pb-2 flex items-center justify-between">
                        <span>برنامه تدریس و تخصیص کلاس‌ها</span>
                        <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
                          {(editForm.teaching_assignments || []).length} درس-کلاس
                        </Badge>
                      </h3>
                      
                      {/* Add New Assignment */}
                      <div className="flex gap-2 items-end bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                        <div className="flex-1">
                           <label className="text-xs text-slate-500 block mb-1">پایه</label>
                           <select
                              value={newAssignment.grade}
                              onChange={e => setNewAssignment({...newAssignment, grade: e.target.value, class_id: ""})}
                              className="w-full p-2 text-sm rounded bg-slate-800 border-slate-700 text-white"
                           >
                              <option value="">پایه</option>
                              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                           </select>
                        </div>
                        <div className="flex-1">
                           <label className="text-xs text-slate-500 block mb-1">کلاس</label>
                           <select
                              value={newAssignment.class_id}
                              onChange={e => setNewAssignment({...newAssignment, class_id: e.target.value})}
                              className="w-full p-2 text-sm rounded bg-slate-800 border-slate-700 text-white"
                              disabled={!newAssignment.grade}
                           >
                              <option value="">همه کلاس‌ها</option>
                              {classes.filter(c => c.grade === newAssignment.grade).map(c => (
                                <option key={c.id} value={c.id}>{c.section}</option>
                              ))}
                           </select>
                        </div>
                        <div className="flex-1">
                           <label className="text-xs text-slate-500 block mb-1">درس</label>
                           <select
                              value={newAssignment.subject}
                              onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})}
                              className="w-full p-2 text-sm rounded bg-slate-800 border-slate-700 text-white"
                           >
                              <option value="">درس</option>
                              {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <Button size="icon" onClick={handleAddAssignment} className="bg-cyan-600 hover:bg-cyan-700 text-white h-9 w-9 shrink-0">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* List Assignments */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {editForm.teaching_assignments && editForm.teaching_assignments.length > 0 ? (
                          editForm.teaching_assignments.map((assign, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700">
                              <div className="text-sm text-slate-200">
                                <span className="font-bold text-cyan-400">{assign.subject}</span>
                                <span className="mx-2 text-slate-600">|</span>
                                <span>پایه {assign.grade}</span>
                                <span className="mx-2 text-slate-600">|</span>
                                <span className="text-slate-400">
                                  {assign.class_id ? `کلاس ${classes.find(c => c.id === assign.class_id)?.section || assign.class_id}` : "همه کلاس‌ها"}
                                </span>
                              </div>
                              <button 
                                onClick={() => handleRemoveAssignment(index)}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-slate-500 text-sm bg-slate-900/30 rounded border border-dashed border-slate-800">
                            هنوز درسی تخصیص داده نشده است.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 flex gap-3 border-t border-slate-800 mt-6">
                    <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold" onClick={handleSaveUser}>
                      <Save className="w-4 h-4 mr-2" /> ذخیره و اعمال تغییرات
                    </Button>
                    <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setEditingUser(null)}>
                      انصراف
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}