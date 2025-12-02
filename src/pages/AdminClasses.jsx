import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Trash2, School } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toPersianDate } from "@/components/utils";

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allClasses = await base44.entities.Class.list();
      setClasses(allClasses);
    } catch (error) {
      console.error("خطا در بارگیری کلاس‌ها:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleDeleteClass = async (classId) => {
    if (window.confirm("آیا از حذف این کلاس مطمئن هستید؟")) {
      try {
        await base44.entities.Class.delete(classId);
        loadData();
      } catch (error) {
        console.error("خطا در حذف کلاس:", error);
      }
    }
  };

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
            <School className="w-8 h-8 text-emerald-500" />
            مدیریت کلاس‌ها
          </h1>
          <p className="text-slate-400 text-lg">مشاهده و مدیریت ساختار کلاس‌بندی مدرسه</p>
        </motion.div>

        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-cyan-500" />
              لیست کلاس‌های فعال
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-800/50">
                <TableRow className="hover:bg-slate-800/50 border-slate-700">
                  <TableHead className="text-slate-300">نام کلاس</TableHead>
                  <TableHead className="text-slate-300">پایه تحصیلی</TableHead>
                  <TableHead className="text-slate-300">تاریخ ایجاد</TableHead>
                  <TableHead className="text-left text-slate-300">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map(classItem => (
                  <TableRow key={classItem.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="font-medium text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      {classItem.name}
                    </TableCell>
                    <TableCell className="text-slate-300">{classItem.grade}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{toPersianDate(classItem.created_date)}</TableCell>
                    <TableCell className="text-left">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteClass(classItem.id)}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {classes.length === 0 && (
              <div className="text-center py-12 border-t border-slate-800">
                <School className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">کلاسی در سیستم وجود ندارد.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}