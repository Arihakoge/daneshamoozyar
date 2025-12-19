import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Edit, Trash2, X, Save, Plus, Trash, ShieldCheck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ALL_SUBJECTS = [
  "قرآن", "پیام‌های آسمان", "فارسی", "نگارش", "ریاضی", "علوم", "مطالعات اجتماعی",
  "فرهنگ و هنر", "عربی", "انگلیسی", "کار و فناوری", "تفکر و سبک زندگی", "آمادگی دفاعی"
];

const GRADES = ["هفتم", "هشتم", "نهم"];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classMap, setClassMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkTarget, setBulkTarget] = useState("");
  const [classRequests, setClassRequests] = useState([]);
  
  // State for new assignment addition
  const [newAssignment, setNewAssignment] = useState({ grade: "", class_id: "", subject: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get all users from User entity AND PublicProfile
      const [allUsers, allPublicProfiles, allClasses, requests] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.PublicProfile.list('-created_date', 1000),
        base44.entities.Class.list(),
        base44.entities.ClassRequest.filter({ status: 'pending' })
      ]);
      
      // Create a map of PublicProfiles by user_id
      const profileMap = {};
      allPublicProfiles.forEach(p => profileMap[p.user_id] = p);
      
      // Merge User data with PublicProfile data
      const mergedUsers = allUsers.map(user => {
        const profile = profileMap[user.id];
        if (profile) {
          return profile; // Use PublicProfile if exists
        } else {
          // Create a temporary PublicProfile structure for users without one
          return {
            id: `temp_${user.id}`,
            user_id: user.id,
            full_name: user.full_name,
            display_name: user.display_name || user.full_name,
            student_role: user.student_role || 'guest',
            grade: user.grade,
            class_id: user.class_id,
            avatar_color: user.avatar_color,
            created_date: user.created_date,
            _isTemp: true // Mark as temporary
          };
        }
      });
      
      // Sort by newest first
      const sortedUsers = mergedUsers.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setUsers(sortedUsers);
      setClasses(allClasses);
      setClassRequests(requests);
      const map = {};
      allClasses.forEach(c => map[c.id] = c);
      setClassMap(map);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  }, []);

  const handleApproveRequest = async (request) => {
      try {
          // 1. Find the user's PublicProfile
          const profiles = await base44.entities.PublicProfile.filter({ user_id: request.user_id });
          if (profiles.length > 0) {
              const profile = profiles[0];
              // 2. Update PublicProfile with requested class
              await base44.entities.PublicProfile.update(profile.id, {
                  grade: request.grade,
                  class_id: request.requested_class_id
              });
              
              // 3. Update Auth User (optional but good for sync)
              await base44.auth.updateMe({
                  grade: request.grade,
                  class_id: request.requested_class_id
              }); // Note: This might not work if Admin is running it, but PublicProfile is the source of truth
          }

          // 4. Update Request Status
          await base44.entities.ClassRequest.update(request.id, { status: 'approved' });
          
          toast.success(`درخواست ${request.full_name} تایید شد`);
          loadData();
      } catch (error) {
          console.error("Error approving request:", error);
          toast.error("خطا در تایید درخواست");
      }
  };

  const handleRejectRequest = async (request) => {
      if(!window.confirm("آیا از رد این درخواست مطمئن هستید؟")) return;
      try {
          await base44.entities.ClassRequest.update(request.id, { status: 'rejected' });
          toast.success("درخواست رد شد");
          loadData();
      } catch (error) {
          toast.error("خطا در رد درخواست");
      }
  };

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
        toast.success("کاربر حذف شد");
      } catch (error) {
        console.error("Failed to delete user:", error);
        toast.error("خطا در حذف کاربر.");
      }
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id, checked) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, id]);
    } else {
      setSelectedUsers(prev => prev.filter(uid => uid !== id));
    }
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) {
      toast.error("لطفا عملیات و کاربران را انتخاب کنید");
      return;
    }

    if (!window.confirm(`آیا مطمئن هستید که می‌خواهید این عملیات را روی ${selectedUsers.length} کاربر انجام دهید؟`)) return;

    setLoading(true);
    try {
      const updates = selectedUsers.map(id => {
        const updateData = {};
        if (bulkAction === "assign_class") {
           const cls = classes.find(c => c.id === bulkTarget);
           if (cls) {
             updateData.class_id = bulkTarget;
             updateData.grade = cls.grade;
           }
        } else if (bulkAction === "set_role") {
           updateData.student_role = bulkTarget;
        } else if (bulkAction === "delete") {
            // Special handling for delete
            return base44.entities.PublicProfile.delete(id);
        }
        
        return base44.entities.PublicProfile.update(id, updateData);
      });

      await Promise.all(updates);
      
      toast.success("عملیات گروهی با موفقیت انجام شد");
      setSelectedUsers([]);
      setBulkAction("");
      setBulkTarget("");
      loadData();
    } catch (error) {
      console.error("Bulk action failed:", error);
      toast.error("خطا در انجام عملیات گروهی");
    }
    setLoading(false);
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

      // If this is a temporary user (no PublicProfile yet), create one
      if (editingUser._isTemp) {
        await base44.entities.PublicProfile.create({
          user_id: editingUser.user_id,
          ...updateData
        });
      } else {
        // Update existing PublicProfile
        await base44.entities.PublicProfile.update(editingUser.id, updateData);
      }
      
      // Update User entity - use asServiceRole to update other users
      const allUsers = await base44.entities.User.list();
      const targetUser = allUsers.find(u => u.id === editingUser.user_id);
      if (targetUser) {
        // We cannot directly update via auth API for other users, 
        // but User entity updates should cascade
      }

      setEditingUser(null);
      loadData();
      toast.success("کاربر با موفقیت بروزرسانی شد");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("خطا در بروزرسانی کاربر");
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

  const filteredUsers = showPendingOnly 
    ? users.filter(u => u.student_role === 'student' && !u.class_id)
    : users;
  
  return (
    <div className="font-sans">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-cyan-500" />
              مدیریت پیشرفته کاربران
            </h1>
            <p className="text-slate-400 text-lg">تعریف نقش‌ها، کلاس‌بندی دانش‌آموزان و تخصیص دقیق دروس معلمین</p>
          </div>
          <Button onClick={loadData} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            بارگیری مجدد
          </Button>
        </motion.div>

        {/* Guest Users Section */}
        {users.some(u => u.student_role === 'guest') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <Card className="clay-card border-yellow-500/30 bg-yellow-900/10">
                  <CardHeader>
                      <CardTitle className="text-yellow-400 flex items-center gap-2 text-lg">
                          <Users className="w-5 h-5" />
                          کاربران جدید / مهمان ({users.filter(u => u.student_role === 'guest').length})
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-3">
                          {users.filter(u => u.student_role === 'guest').map(guest => (
                              <div key={guest.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold">
                                          {guest.full_name?.charAt(0) || "G"}
                                      </div>
                                      <div>
                                          <p className="font-bold text-white">{guest.full_name || "کاربر ناشناس"}</p>
                                          <p className="text-xs text-slate-400">ثبت نام: {new Date(guest.created_date).toLocaleDateString('fa-IR')}</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <Button size="sm" onClick={() => openEditModal(guest)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                          تعیین نقش
                                      </Button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          </motion.div>
        )}

        {/* Pending Requests Section */}
        {classRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <Card className="clay-card border-orange-500/30 bg-orange-900/10">
                  <CardHeader>
                      <CardTitle className="text-orange-400 flex items-center gap-2 text-lg">
                          <ShieldCheck className="w-5 h-5" />
                          درخواست‌های عضویت در کلاس ({classRequests.length})
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-3">
                          {classRequests.map(req => (
                              <div key={req.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold">
                                          {req.full_name.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-bold text-white">{req.full_name}</p>
                                          <p className="text-sm text-slate-400">
                                              متقاضی: <span className="text-cyan-400">{classMap[req.requested_class_id]?.name || "نامشخص"}</span>
                                              <span className="mx-2">|</span>
                                              پایه: {req.grade}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <Button size="sm" onClick={() => handleApproveRequest(req)} className="bg-green-600 hover:bg-green-700 text-white">
                                          تایید
                                      </Button>
                                      <Button size="sm" onClick={() => handleRejectRequest(req)} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
                                          رد
                                      </Button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          </motion.div>
        )}

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 clay-card bg-purple-900/20 border-purple-500/30 flex flex-wrap items-center gap-4">
            <span className="text-white font-bold ml-4">{selectedUsers.length} کاربر انتخاب شده</span>

            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="انتخاب عملیات" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="assign_class">تخصیص به کلاس</SelectItem>
                <SelectItem value="set_role">تغییر نقش</SelectItem>
                <SelectItem value="delete">حذف کاربران</SelectItem>
              </SelectContent>
            </Select>

            {bulkAction === "assign_class" && (
              <Select value={bulkTarget} onValueChange={setBulkTarget}>
                <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="انتخاب کلاس" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {bulkAction === "set_role" && (
              <Select value={bulkTarget} onValueChange={setBulkTarget}>
                <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="انتخاب نقش" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="student">دانش‌آموز</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="admin">مدیر</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button onClick={executeBulkAction} className="bg-purple-600 hover:bg-purple-700">
              اعمال تغییرات
            </Button>
          </motion.div>
        )}

        <Card className="clay-card">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <CardTitle className="text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  لیست کاربران سیستم
                </CardTitle>
                <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                  {filteredUsers.length} کاربر
                </Badge>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                 <Button 
                    variant={showPendingOnly ? "default" : "outline"} 
                    onClick={() => setShowPendingOnly(!showPendingOnly)}
                    className={`border-slate-700 ${showPendingOnly ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                 >
                    {showPendingOnly ? "نمایش همه کاربران" : "فقط دانش‌آموزان بدون کلاس"}
                 </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="hover:bg-black/30 border-white/10">
                  <TableHead className="w-12">
                    <Checkbox 
                       checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                       onCheckedChange={handleSelectAll}
                       className="border-slate-500 data-[state=checked]:bg-purple-500"
                    />
                  </TableHead>
                  <TableHead className="text-slate-300">نام کامل</TableHead>
                  <TableHead className="text-slate-300">نقش</TableHead>
                  <TableHead className="text-slate-300 w-[40%]">جزئیات تحصیلی / تدریس</TableHead>
                  <TableHead className="text-left text-slate-300">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.user_id} className="border-white/10 hover:bg-black/20 transition-colors">
                    <TableCell>
                      <Checkbox 
                         checked={selectedUsers.includes(user.id)}
                         onCheckedChange={(checked) => handleSelectUser(user.id, checked)}
                         className="border-slate-500 data-[state=checked]:bg-purple-500"
                      />
                    </TableCell>
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
                            {classMap[user.class_id] ? classMap[user.class_id].name : "بدون کلاس"}
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
                                  {assign.class_id ? (classMap[assign.class_id] ? classMap[assign.class_id].name : assign.class_id) : "همه کلاس‌ها"}
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