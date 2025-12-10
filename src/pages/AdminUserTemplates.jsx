import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { toPersianNumber } from "@/components/utils";

export default function AdminUserTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "", role: "student", default_coins: 0, default_level: 1, default_grade: "", welcome_message: ""
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.UserProfileTemplate.list();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("خطا در بارگیری الگوها");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.role) {
      toast.error("نام و نقش الزامی هستند");
      return;
    }

    try {
      if (currentTemplate) {
        await base44.entities.UserProfileTemplate.update(currentTemplate.id, formData);
        toast.success("الگو با موفقیت بروزرسانی شد");
      } else {
        await base44.entities.UserProfileTemplate.create(formData);
        toast.success("الگو با موفقیت ایجاد شد");
      }
      setIsModalOpen(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("خطا در ذخیره الگو");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف این الگو مطمئن هستید؟")) return;
    try {
      await base44.entities.UserProfileTemplate.delete(id);
      toast.success("الگو حذف شد");
      loadTemplates();
    } catch (error) {
      toast.error("خطا در حذف الگو");
    }
  };

  const openModal = (template = null) => {
    if (template) {
      setCurrentTemplate(template);
      setFormData({ ...template });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setCurrentTemplate(null);
    setFormData({
      name: "", role: "student", default_coins: 0, default_level: 1, default_grade: "", welcome_message: ""
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-slate-950 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-yellow-500" />
            الگوهای پروفایل کاربران
          </h1>
          <p className="text-slate-400 text-lg">مدیریت تنظیمات پیش‌فرض برای ثبت‌نام کاربران جدید</p>
        </motion.div>

        <Card className="clay-card mb-8">
          <CardContent className="p-6">
            <div className="flex justify-end">
              <Button onClick={() => openModal()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" /> ایجاد الگو جدید
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="clay-card hover:scale-[1.02] transition-transform">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openModal(template)} className="text-blue-400 hover:text-blue-300 h-8 w-8">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} className="text-red-400 hover:text-red-300 h-8 w-8">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between">
                    <span>نقش:</span>
                    <span className="text-white">
                      {template.role === 'student' ? 'دانش‌آموز' : template.role === 'teacher' ? 'معلم' : 'مدیر'}
                    </span>
                  </div>
                  {template.role === 'student' && (
                    <div className="flex justify-between">
                      <span>پایه پیش‌فرض:</span>
                      <span className="text-white">{template.default_grade || "ندارد"}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>سکه اولیه:</span>
                    <span className="text-yellow-400">{toPersianNumber(template.default_coins)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>سطح اولیه:</span>
                    <span className="text-blue-400">{toPersianNumber(template.default_level)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && (
             <div className="col-span-full text-center py-12 text-slate-500 clay-card">
               هیچ الگویی تعریف نشده است.
             </div>
          )}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>{currentTemplate ? 'ویرایش الگو' : 'ایجاد الگو جدید'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">نام الگو</label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="مثال: دانش‌آموزان جدید"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">نقش کاربر</label>
                <Select 
                  value={formData.role} 
                  onValueChange={(val) => setFormData({...formData, role: val})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="student">دانش‌آموز</SelectItem>
                    <SelectItem value="teacher">معلم</SelectItem>
                    <SelectItem value="admin">مدیر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">سکه اولیه</label>
                  <Input 
                    type="number"
                    value={formData.default_coins} 
                    onChange={(e) => setFormData({...formData, default_coins: parseInt(e.target.value) || 0})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">سطح اولیه</label>
                  <Input 
                    type="number"
                    value={formData.default_level} 
                    onChange={(e) => setFormData({...formData, default_level: parseInt(e.target.value) || 1})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>

              {formData.role === 'student' && (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">پایه تحصیلی پیش‌فرض</label>
                  <Select 
                    value={formData.default_grade} 
                    onValueChange={(val) => setFormData({...formData, default_grade: val})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="انتخاب کنید (اختیاری)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="هفتم">هفتم</SelectItem>
                      <SelectItem value="هشتم">هشتم</SelectItem>
                      <SelectItem value="نهم">نهم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-400 mb-1 block">پیام خوش‌آمدگویی</label>
                <Input 
                  value={formData.welcome_message} 
                  onChange={(e) => setFormData({...formData, welcome_message: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="متنی که کاربر پس از اولین ورود می‌بیند..."
                />
              </div>

              <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700 mt-2">
                ذخیره الگو
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}