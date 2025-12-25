import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, Plus, Trash, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ALL_SUBJECTS = [
  "قرآن", "پیام‌های آسمان", "فارسی", "نگارش", "ریاضی", "علوم", "مطالعات اجتماعی",
  "فرهنگ و هنر", "عربی", "انگلیسی", "کار و فناوری", "تفکر و سبک زندگی", "آمادگی دفاعی"
];

const GRADES = ["هفتم", "هشتم", "نهم"];

export default function EditUserModal({ user, isOpen, onClose, onSave, classes }) {
  const [formData, setFormData] = useState({});
  const [newAssignment, setNewAssignment] = useState({ grade: "", class_id: "", subject: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        teaching_assignments: user.teaching_assignments || []
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  const handleAddAssignment = () => {
    if (!newAssignment.grade || !newAssignment.subject) {
      toast.error("لطفا پایه و درس را انتخاب کنید.");
      return;
    }
    
    const assignmentToAdd = {
      grade: newAssignment.grade,
      class_id: newAssignment.class_id || "", 
      subject: newAssignment.subject,
      id: Date.now()
    };

    setFormData({
      ...formData,
      teaching_assignments: [...formData.teaching_assignments, assignmentToAdd]
    });
    setNewAssignment({ grade: "", class_id: "", subject: "" });
  };

  const handleRemoveAssignment = (index) => {
    const updated = [...formData.teaching_assignments];
    updated.splice(index, 1);
    setFormData({ ...formData, teaching_assignments: updated });
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Edit className="w-5 h-5 text-cyan-500" />
            ویرایش کاربر: {user.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">نام کامل</label>
              <Input 
                value={formData.full_name || ""} 
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">نقش</label>
              <Select 
                value={formData.student_role} 
                onValueChange={val => {
                  const newData = {...formData, student_role: val};
                  // Clear student data if not student
                  if (val !== 'student') {
                    newData.grade = "";
                    newData.class_id = "";
                  }
                  setFormData(newData);
                }}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="student">دانش‌آموز</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="admin">مدیر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.student_role === "student" && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-4">
              <h3 className="font-bold text-sm border-b border-slate-700 pb-2">اطلاعات تحصیلی</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">پایه</label>
                  <Select 
                    value={formData.grade} 
                    onValueChange={val => setFormData({...formData, grade: val, class_id: ""})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">شعبه کلاس</label>
                  <Select 
                    value={formData.class_id} 
                    onValueChange={val => setFormData({...formData, class_id: val})}
                    disabled={!formData.grade}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="انتخاب شعبه..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {classes.filter(c => !formData.grade || c.grade === formData.grade).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {formData.student_role === "teacher" && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-4">
              <h3 className="font-bold text-sm border-b border-slate-700 pb-2 flex justify-between">
                <span>تخصیص دروس</span>
                <Badge variant="secondary">{formData.teaching_assignments?.length || 0} مورد</Badge>
              </h3>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                   <select
                      className="w-full p-2 text-sm rounded bg-slate-900 border border-slate-700 text-white"
                      value={newAssignment.grade}
                      onChange={e => setNewAssignment({...newAssignment, grade: e.target.value, class_id: ""})}
                   >
                      <option value="">پایه...</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                </div>
                <div className="flex-1">
                   <select
                      className="w-full p-2 text-sm rounded bg-slate-900 border border-slate-700 text-white"
                      value={newAssignment.class_id}
                      onChange={e => setNewAssignment({...newAssignment, class_id: e.target.value})}
                      disabled={!newAssignment.grade}
                   >
                      <option value="">همه کلاس‌ها</option>
                      {classes.filter(c => c.grade === newAssignment.grade).map(c => (
                        <option key={c.id} value={c.id}>{c.section}</option>
                      ))}
                   </select>
                </div>
                <div className="flex-1">
                   <select
                      className="w-full p-2 text-sm rounded bg-slate-900 border border-slate-700 text-white"
                      value={newAssignment.subject}
                      onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})}
                   >
                      <option value="">درس...</option>
                      {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
                <Button size="icon" onClick={handleAddAssignment} className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formData.teaching_assignments?.map((assign, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-700 text-sm">
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="text-cyan-400 border-cyan-900">{assign.subject}</Badge>
                      <span className="text-slate-400">پایه {assign.grade}</span>
                      <span className="text-slate-500">
                        {assign.class_id ? (classes.find(c => c.id === assign.class_id)?.name || "کلاس نامشخص") : "همه کلاس‌ها"}
                      </span>
                    </div>
                    <button onClick={() => handleRemoveAssignment(idx)} className="text-slate-500 hover:text-red-400">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={onClose} disabled={saving} className="border-slate-700 text-slate-300">
              انصراف
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}