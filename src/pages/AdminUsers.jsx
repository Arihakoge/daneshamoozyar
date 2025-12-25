import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Edit, Trash2, RefreshCw, ShieldCheck, Filter, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import EditUserModal from "@/components/admin/EditUserModal";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classMap, setClassMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkTarget, setBulkTarget] = useState("");
  const [classRequests, setClassRequests] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allUsers, allPublicProfiles, allClasses, requests] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.PublicProfile.list('-created_date', 1000),
        base44.entities.Class.list(),
        base44.entities.ClassRequest.filter({ status: 'pending' })
      ]);
      
      const profileMap = {};
      allPublicProfiles.forEach(p => profileMap[p.user_id] = p);
      
      const mergedUsers = allUsers.map(user => {
        const profile = profileMap[user.id];
        if (profile) return profile;
        
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
          _isTemp: true
        };
      });
      
      setUsers(mergedUsers.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setClasses(allClasses);
      setClassRequests(requests);
      
      const map = {};
      allClasses.forEach(c => map[c.id] = c);
      setClassMap(map);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("خطا در بارگیری اطلاعات");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdateUser = async (updatedData) => {
    try {
      // 1. Prepare data for PublicProfile
      const profileData = {
        full_name: updatedData.full_name,
        student_role: updatedData.student_role,
        grade: updatedData.grade,
        class_id: updatedData.class_id,
        teaching_assignments: updatedData.teaching_assignments || [],
        subjects: [...new Set((updatedData.teaching_assignments || []).map(a => a.subject))]
      };

      // 2. Update PublicProfile
      if (updatedData._isTemp) {
        await base44.entities.PublicProfile.create({
          user_id: updatedData.user_id,
          ...profileData
        });
      } else {
        await base44.entities.PublicProfile.update(updatedData.id, profileData);
      }

      // 3. Update User Entity (if possible/needed for auth)
      // Note: We can't update other users via auth API, but PublicProfile is our source of truth.

      toast.success("کاربر بروزرسانی شد");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("خطا در ذخیره تغییرات");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("آیا از حذف این کاربر مطمئن هستید؟")) return;
    try {
      await base44.entities.User.delete(userId);
      // Clean up related entities
      const profiles = users.filter(u => u.user_id === userId);
      if (profiles.length > 0 && !profiles[0]._isTemp) {
        await base44.entities.PublicProfile.delete(profiles[0].id);
      }
      toast.success("کاربر حذف شد");
      loadData();
    } catch (error) {
      toast.error("خطا در حذف کاربر");
    }
  };

  const handleApproveRequest = async (request) => {
      try {
          const profiles = await base44.entities.PublicProfile.filter({ user_id: request.user_id });
          if (profiles.length > 0) {
              await base44.entities.PublicProfile.update(profiles[0].id, {
                  grade: request.grade,
                  class_id: request.requested_class_id
              });
          }
          await base44.entities.ClassRequest.update(request.id, { status: 'approved' });
          toast.success("درخواست تایید شد");
          loadData();
      } catch (error) {
          toast.error("خطا در عملیات");
      }
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    if (!window.confirm(`اعمال تغییرات روی ${selectedUsers.length} کاربر؟`)) return;

    setLoading(true);
    try {
      const promises = selectedUsers.map(id => {
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
            return base44.entities.PublicProfile.delete(id);
        }
        return base44.entities.PublicProfile.update(id, updateData);
      });

      await Promise.all(promises);
      toast.success("عملیات گروهی انجام شد");
      setSelectedUsers([]);
      loadData();
    } catch (error) {
      toast.error("خطا در عملیات گروهی");
    }
    setLoading(false);
  };

  // Filtering Logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.student_role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-cyan-500" />
            مدیریت کاربران
          </h1>
          <p className="text-slate-400">مدیریت نقش‌ها، کلاس‌ها و دسترسی‌ها</p>
        </div>
        <Button onClick={loadData} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
      </div>

      {/* Class Requests */}
      {classRequests.length > 0 && (
          <div className="clay-card p-4 border-l-4 border-orange-500 bg-orange-900/10">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-500" />
                  درخواست‌های عضویت ({classRequests.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classRequests.map(req => (
                      <div key={req.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                          <div>
                              <p className="font-bold text-white text-sm">{req.full_name}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                  {classMap[req.requested_class_id]?.name || "کلاس نامشخص"} ({req.grade})
                              </p>
                          </div>
                          <Button size="sm" onClick={() => handleApproveRequest(req)} className="bg-green-600 h-8 text-xs">
                              تایید
                          </Button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Main Content */}
      <Card className="clay-card overflow-hidden">
        <CardHeader className="bg-slate-900/50 border-b border-slate-800 pb-4">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 w-full lg:w-auto">
                    <Search className="w-4 h-4 text-slate-400 ml-2" />
                    <Input 
                        placeholder="جستجو نام..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="border-0 bg-transparent h-8 w-full lg:w-64 focus-visible:ring-0"
                    />
                </div>
                
                <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                            <SelectValue placeholder="فیلتر نقش" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="all">همه نقش‌ها</SelectItem>
                            <SelectItem value="student">دانش‌آموز</SelectItem>
                            <SelectItem value="teacher">معلم</SelectItem>
                            <SelectItem value="admin">مدیر</SelectItem>
                            <SelectItem value="guest">مهمان</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 flex items-center gap-2">
                    <span className="text-sm text-purple-400 font-bold ml-2">{selectedUsers.length} انتخاب شده</span>
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger className="w-[180px] h-8 bg-purple-900/20 border-purple-500/30 text-white"><SelectValue placeholder="عملیات..." /></SelectTrigger>
                        <SelectContent className="bg-slate-800 text-white">
                            <SelectItem value="assign_class">تخصیص کلاس</SelectItem>
                            <SelectItem value="set_role">تغییر نقش</SelectItem>
                            <SelectItem value="delete">حذف</SelectItem>
                        </SelectContent>
                    </Select>
                    {bulkAction === 'assign_class' && (
                        <Select value={bulkTarget} onValueChange={setBulkTarget}>
                            <SelectTrigger className="w-[180px] h-8 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="کلاس..." /></SelectTrigger>
                            <SelectContent className="bg-slate-800 text-white">
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    {bulkAction === 'set_role' && (
                        <Select value={bulkTarget} onValueChange={setBulkTarget}>
                             <SelectTrigger className="w-[180px] h-8 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="نقش..." /></SelectTrigger>
                             <SelectContent className="bg-slate-800 text-white">
                                 <SelectItem value="student">دانش‌آموز</SelectItem>
                                 <SelectItem value="teacher">معلم</SelectItem>
                                 <SelectItem value="admin">مدیر</SelectItem>
                             </SelectContent>
                        </Select>
                    )}
                    <Button size="sm" onClick={executeBulkAction} className="h-8 bg-purple-600 hover:bg-purple-700">اجرا</Button>
                </motion.div>
            )}
        </CardHeader>
        
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-slate-900/30">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="w-10">
                            <Checkbox 
                                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                onCheckedChange={(checked) => setSelectedUsers(checked ? filteredUsers.map(u => u.id) : [])}
                                className="border-slate-600"
                            />
                        </TableHead>
                        <TableHead className="text-right text-slate-400">نام کاربر</TableHead>
                        <TableHead className="text-right text-slate-400">نقش</TableHead>
                        <TableHead className="text-right text-slate-400">جزئیات</TableHead>
                        <TableHead className="text-left text-slate-400 pl-6">عملیات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">کاربری یافت نشد</TableCell>
                        </TableRow>
                    ) : (
                        filteredUsers.map(user => (
                            <TableRow key={user.id} className="border-slate-800/50 hover:bg-slate-800/20">
                                <TableCell>
                                    <Checkbox 
                                        checked={selectedUsers.includes(user.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedUsers([...selectedUsers, user.id]);
                                            else setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                        }}
                                        className="border-slate-600"
                                    />
                                </TableCell>
                                <TableCell className="font-medium text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: user.avatar_color || '#64748b' }}>
                                            {user.full_name?.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span>{user.full_name}</span>
                                            {user._isTemp && <span className="text-[10px] text-yellow-500">ثبت نام اولیه</span>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`
                                        ${user.student_role === 'student' ? 'border-green-500/30 text-green-400 bg-green-500/10' : ''}
                                        ${user.student_role === 'teacher' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : ''}
                                        ${user.student_role === 'admin' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' : ''}
                                    `}>
                                        {user.student_role === 'student' ? 'دانش‌آموز' : user.student_role === 'teacher' ? 'معلم' : user.student_role === 'admin' ? 'مدیر' : 'مهمان'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-slate-400">
                                    {user.student_role === 'student' && (
                                        <span className="flex items-center gap-1">
                                            {classMap[user.class_id]?.name || "بدون کلاس"}
                                            <span className="text-slate-600">|</span>
                                            {user.grade || "-"}
                                        </span>
                                    )}
                                    {user.student_role === 'teacher' && (
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {(user.teaching_assignments || []).length > 0 ? (
                                                <Badge variant="secondary" className="bg-slate-800 text-xs">
                                                    {user.teaching_assignments.length} درس تخصیص یافته
                                                </Badge>
                                            ) : <span className="text-orange-400 text-xs">بدون درس</span>}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-left pl-4">
                                    <div className="flex justify-end gap-2">
                                        <Button size="icon" variant="ghost" onClick={() => setEditingUser(user)} className="text-slate-400 hover:text-blue-400 hover:bg-blue-900/20">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteUser(user.user_id)} className="text-slate-400 hover:text-red-400 hover:bg-red-900/20">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <EditUserModal 
        user={editingUser} 
        isOpen={!!editingUser} 
        onClose={() => setEditingUser(null)} 
        onSave={handleUpdateUser}
        classes={classes}
      />
    </div>
  );
}