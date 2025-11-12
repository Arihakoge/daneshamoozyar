import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toPersianDate } from "@/utils";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری کلاس‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <GraduationCap className="w-10 h-10 text-purple-500" />
          مدیریت کل کلاس‌ها
        </h1>
        <p className="text-gray-300 text-lg">مشاهده و مدیریت تمام کلاس‌های موجود در سیستم</p>
      </motion.div>

      <Card className="clay-card">
        <CardHeader>
          <CardTitle className="text-white">لیست تمام کلاس‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">نام کلاس</TableHead>
                <TableHead className="text-white">پایه</TableHead>
                <TableHead className="text-white">تاریخ ایجاد</TableHead>
                <TableHead className="text-left text-white">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map(classItem => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium text-white">{classItem.name}</TableCell>
                  <TableCell className="text-gray-300">{classItem.grade}</TableCell>
                  <TableCell className="text-gray-300">{toPersianDate(classItem.created_date)}</TableCell>
                  <TableCell className="text-left">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(classItem.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {classes.length === 0 && (
            <p className="text-center text-gray-400 py-8">کلاسی در سیستم وجود ندارد.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}