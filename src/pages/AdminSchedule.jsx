import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, Trash2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];
const GRADES = ["هفتم", "هشتم", "نهم"];
const SUBJECTS = [
  "قرآن", "پیام‌های آسمان", "فارسی", "نگارش", "ریاضی", "علوم", 
  "مطالعات اجتماعی", "فرهنگ و هنر", "عربی", "انگلیسی", 
  "کار و فناوری", "تفکر و سبک زندگی", "آمادگی دفاعی"
];

export default function AdminSchedule() {
  const [academicYear, setAcademicYear] = useState("1403-1404");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allClasses, allUsers, allSchedules] = await Promise.all([
        base44.entities.Class.list(),
        base44.entities.User.list(),
        base44.entities.Schedule.list()
      ]);
      
      setClasses(allClasses);
      setTeachers(allUsers.filter(u => u.student_role === "teacher"));
      setSchedules(allSchedules);
    } catch (error) {
      console.error("خطا در بارگیری داده‌ها:", error);
    }
    setLoading(false);
  };

  const loadScheduleForClass = async () => {
    if (!selectedClass) return;
    
    try {
      const classSchedules = await base44.entities.Schedule.filter({
        academic_year: academicYear,
        class_id: selectedClass
      });
      setSchedules(classSchedules);
    } catch (error) {
      console.error("خطا در بارگیری برنامه:", error);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      loadScheduleForClass();
    }
  }, [selectedClass, academicYear]);

  const getScheduleCell = (day, period) => {
    return schedules.find(s => 
      s.day_of_week === day && 
      s.period === period && 
      s.class_id === selectedClass &&
      s.academic_year === academicYear
    );
  };

  const handleSaveCell = async (day, period, data) => {
    if (!data.subject || !data.teacher_id) {
      toast.error("لطفا درس و معلم را انتخاب کنید");
      return;
    }

    try {
      const existingCell = getScheduleCell(day, period);
      
      const scheduleData = {
        academic_year: academicYear,
        grade: selectedGrade,
        class_id: selectedClass,
        day_of_week: day,
        period: period,
        subject: data.subject,
        teacher_id: data.teacher_id,
        start_time: data.start_time || "",
        end_time: data.end_time || ""
      };

      if (existingCell) {
        await base44.entities.Schedule.update(existingCell.id, scheduleData);
      } else {
        await base44.entities.Schedule.create(scheduleData);
      }

      await loadScheduleForClass();
      setEditingCell(null);
      toast.success("برنامه ذخیره شد");
    } catch (error) {
      console.error("خطا در ذخیره:", error);
      toast.error("خطا در ذخیره برنامه");
    }
  };

  const handleDeleteCell = async (day, period) => {
    const cell = getScheduleCell(day, period);
    if (!cell) return;

    if (!window.confirm("آیا از حذف این ساعت درس مطمئن هستید؟")) return;

    try {
      await base44.entities.Schedule.delete(cell.id);
      await loadScheduleForClass();
      toast.success("ساعت درس حذف شد");
    } catch (error) {
      console.error("خطا در حذف:", error);
      toast.error("خطا در حذف");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Calendar className="w-10 h-10 text-purple-500" />
          مدیریت برنامه درسی هفتگی
        </h1>
        <p className="text-gray-300 text-lg">ایجاد و ویرایش برنامه درسی برای کل سال تحصیلی</p>
      </motion.div>

      <Card className="clay-card mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">سال تحصیلی</label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="1403-1404"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">پایه تحصیلی</label>
              <Select value={selectedGrade} onValueChange={(val) => {
                setSelectedGrade(val);
                setSelectedClass("");
              }}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="انتخاب پایه" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">کلاس</label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedGrade}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="انتخاب کلاس" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {classes.filter(c => c.grade === selectedGrade).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <Card className="clay-card overflow-x-auto">
          <CardHeader>
            <CardTitle className="text-white">برنامه هفتگی</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-3 text-center text-gray-300 bg-slate-800">ساعت</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-3 text-center text-gray-300 bg-slate-800">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(period => (
                  <tr key={period} className="border-b border-slate-700/50">
                    <td className="p-3 text-center text-gray-400 bg-slate-900/50 font-bold">
                      ساعت {period}
                    </td>
                    {DAYS.map(day => {
                      const cell = getScheduleCell(day, period);
                      const isEditing = editingCell?.day === day && editingCell?.period === period;

                      return (
                        <td key={`${day}-${period}`} className="p-2 border border-slate-700/30">
                          {isEditing ? (
                            <ScheduleCell
                              cell={cell}
                              teachers={teachers}
                              onSave={(data) => handleSaveCell(day, period, data)}
                              onCancel={() => setEditingCell(null)}
                            />
                          ) : (
                            <div
                              className="min-h-[80px] p-2 rounded clay-button hover:bg-slate-800/50 cursor-pointer"
                              onClick={() => setEditingCell({ day, period })}
                            >
                              {cell ? (
                                <div className="space-y-1">
                                  <div className="font-bold text-white text-sm">{cell.subject}</div>
                                  <div className="text-xs text-gray-400">
                                    {teachers.find(t => t.id === cell.teacher_id)?.full_name || "نامشخص"}
                                  </div>
                                  {cell.start_time && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {cell.start_time} - {cell.end_time}
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCell(day, period);
                                    }}
                                    className="w-full mt-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-3 h-3 ml-1" />
                                    حذف
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-600">
                                  <Plus className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {!selectedClass && (
        <Card className="clay-card">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              لطفا سال تحصیلی، پایه و کلاس را انتخاب کنید
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScheduleCell({ cell, teachers, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    subject: cell?.subject || "",
    teacher_id: cell?.teacher_id || "",
    start_time: cell?.start_time || "",
    end_time: cell?.end_time || ""
  });

  return (
    <div className="space-y-2 p-2 bg-slate-900/50 rounded min-h-[200px]">
      <Select value={formData.subject} onValueChange={(val) => setFormData({...formData, subject: val})}>
        <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs">
          <SelectValue placeholder="درس" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700 text-white">
          {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={formData.teacher_id} onValueChange={(val) => setFormData({...formData, teacher_id: val})}>
        <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs">
          <SelectValue placeholder="معلم" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700 text-white">
          {teachers.map(t => (
            <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="time"
        value={formData.start_time}
        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
        placeholder="شروع"
        className="bg-slate-800 border-slate-700 text-white text-xs"
      />

      <Input
        type="time"
        value={formData.end_time}
        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
        placeholder="پایان"
        className="bg-slate-800 border-slate-700 text-white text-xs"
      />

      <div className="flex gap-1">
        <Button size="sm" onClick={() => onSave(formData)} className="flex-1 bg-green-600 hover:bg-green-700 text-xs">
          <Save className="w-3 h-3 ml-1" />
          ذخیره
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="border-slate-700 text-white text-xs">
          انصراف
        </Button>
      </div>
    </div>
  );
}