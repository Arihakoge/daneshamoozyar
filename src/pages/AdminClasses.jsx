import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Trash2, School, Plus, Save, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianDate } from "@/components/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", grade: "هفتم", section: "الف" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allClasses = await base44.entities.Class.list();
      setClasses(allClasses.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error loading classes:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  
  const handleAddClass = async () => {
    if (!newClass.name) {
      toast.error("نام کلاس الزامی است");
      return;
    }
    try {
      await base44.entities.Class.create({
        ...newClass,
        description: `کلاس ${newClass.section} پایه ${newClass.grade}`,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      });
      toast.success("کلاس ایجاد شد");
      setShowAddModal(false);
      setNewClass({ name: "", grade: "هفتم", section: "الف" });
      loadData();
    } catch (error) {
      toast.error("خطا در ایجاد کلاس");
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm("آیا از حذف این کلاس مطمئن هستید؟")) {
      try {
        await base44.entities.Class.delete(classId);
        toast.success("کلاس حذف شد");
        loadData();
      } catch (error) {
        toast.error("خطا در حذف کلاس");
      }
    }
  };

  return (
    <div className="font-sans p-6 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
             <School className="w-8 h-8 text-emerald-500" />
             مدیریت کلاس‌ها
           </h1>
           <p className="text-slate-400">مشاهده و مدیریت ساختار کلاس‌بندی مدرسه</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
           <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                 <Plus className="w-4 h-4" /> افزودن کلاس جدید
              </Button>
           </DialogTrigger>
           <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                 <DialogTitle>ایجاد کلاس جدید</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                 <div>
                    <label className="text-sm text-slate-400 block mb-1">نام کلاس (مثال: هفتم - الف)</label>
                    <Input 
                       value={newClass.name} 
                       onChange={e => setNewClass({...newClass, name: e.target.value})} 
                       className="bg-slate-800 border-slate-700 text-white"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-sm text-slate-400 block mb-1">پایه</label>
                       <Select value={newClass.grade} onValueChange={v => setNewClass({...newClass, grade: v})}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                             <SelectItem value="هفتم">هفتم</SelectItem>
                             <SelectItem value="هشتم">هشتم</SelectItem>
                             <SelectItem value="نهم">نهم</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    <div>
                       <label className="text-sm text-slate-400 block mb-1">شعبه</label>
                       <Select value={newClass.section} onValueChange={v => setNewClass({...newClass, section: v})}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                             <SelectItem value="الف">الف</SelectItem>
                             <SelectItem value="ب">ب</SelectItem>
                             <SelectItem value="ج">ج</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                 </div>
                 <Button onClick={handleAddClass} className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">
                    ثبت کلاس
                 </Button>
              </div>
           </DialogContent>
        </Dialog>
      </div>

      <Card className="clay-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-right text-slate-400">نام کلاس</TableHead>
                <TableHead className="text-right text-slate-400">پایه تحصیلی</TableHead>
                <TableHead className="text-right text-slate-400">توضیحات</TableHead>
                <TableHead className="text-left text-slate-400 pl-6">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                 <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">هیچ کلاسی تعریف نشده است</TableCell></TableRow>
              ) : (
                classes.map(classItem => (
                  <TableRow key={classItem.id} className="border-slate-800/50 hover:bg-slate-800/20">
                    <TableCell className="font-medium text-white flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: classItem.color }}></div>
                      {classItem.name}
                    </TableCell>
                    <TableCell className="text-slate-300">{classItem.grade}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{classItem.description}</TableCell>
                    <TableCell className="text-left pl-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteClass(classItem.id)}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}