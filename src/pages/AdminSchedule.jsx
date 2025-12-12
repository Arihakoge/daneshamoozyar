import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2, Clock, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { toPersianNumber } from "@/components/utils";

const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const ALL_SUBJECTS = [
  "قرآن", "پیام‌های آسمان", "فارسی", "نگارش", "ریاضی", "علوم", "مطالعات اجتماعی",
  "فرهنگ و هنر", "عربی", "انگلیسی", "کار و فناوری", "تفکر و سبک زندگی", "آمادگی دفاعی"
];

export default function AdminSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("1403-1404");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    academic_year: "1403-1404",
    day_of_week: "شنبه",
    start_time: "",
    end_time: "",
    class_id: "",
    subject: "",
    teacher_id: ""
  });

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSchedules, allClasses, allProfiles] = await Promise.all([
        base44.entities.Schedule.filter({ academic_year: selectedYear }),
        base44.entities.Class.list(),
        base44.entities.PublicProfile.filter({ student_role: "teacher" })
      ]);
      setSchedules(allSchedules);
      setClasses(allClasses);
      setTeachers(allProfiles);
    } catch (error) {
      console.error("خطا در بارگیری:", error);
      toast.error("خطا در بارگیری داده‌ها");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.class_id || !formData.subject || !formData.teacher_id || !formData.start_time) {
      toast.error("لطفا تمام فیلدهای ضروری را پر کنید");
      return;
    }

    try {
      await base44.entities.Schedule.create(formData);
      toast.success("برنامه درسی اضافه شد");
      setShowAddModal(false);
      setFormData({
        academic_year: selectedYear,
        day_of_week: "شنبه",
        start_time: "",
        end_time: "",
        class_id: "",
        subject: "",
        teacher_id: ""
      });
      loadData();
    } catch (error) {
      console.error("خطا در افزودن:", error);
      toast.error("خطا در افزودن برنامه");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف این جلسه مطمئن هستید؟")) return;
    try {
      await base44.entities.Schedule.delete(id);
      toast.success("جلسه حذف شد");
      loadData();
    } catch (error) {
      toast.error("خطا در حذف");
    }
  };

  const getSchedulesByDay = (day) => {
    return schedules
      .filter(s => s.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Calendar className="w-10 h-10 text-purple-500" />
              مدیریت برنامه درسی
            </h1>
            <p className="text-gray-300 text-lg">تنظیم برنامه کلاسی هفتگی</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="clay-button bg-purple-500 text-white">
            <Plus className="w-4 h-4 ml-2" />
            افزودن جلسه
          </Button>
        </div>
      </motion.div>

      <div className="clay-card p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-white font-medium">سال تحصیلی:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="clay-button px-4 py-2 bg-slate-800 border-slate-700 text-white rounded-lg"
          >
            <option value="1403-1404">۱۴۰۳-۱۴۰۴</option>
            <option value="1404-1405">۱۴۰۴-۱۴۰۵</option>
            <option value="1405-1406">۱۴۰۵-۱۴۰۶</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DAYS.map(day => (
          <Card key={day} className="clay-card">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                {day}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {getSchedulesByDay(day).length === 0 ? (
                <p className="text-gray-400 text-center py-4">برنامه‌ای تعریف نشده</p>
              ) : (
                getSchedulesByDay(day).map(schedule => {
                  const classInfo = classes.find(c => c.id === schedule.class_id);
                  const teacherInfo = teachers.find(t => t.user_id === schedule.teacher_id);
                  return (
                    <div key={schedule.id} className="clay-card p-3 hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-purple-400 font-medium">
                              {schedule.start_time} - {schedule.end_time}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm mb-1">
                            📚 {schedule.subject}
                          </h4>
                          <p className="text-xs text-gray-400">
                            کلاس: {classInfo?.name || "نامشخص"}
                          </p>
                          <p className="text-xs text-gray-400">
                            معلم: {teacherInfo?.full_name || "نامشخص"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="clay-card p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-6">افزودن جلسه درسی</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">روز هفته</label>
                  <select
                    value={formData.day_of_week}
                    onChange={e => setFormData({...formData, day_of_week: e.target.value})}
                    className="w-full p-2 rounded bg-slate-800 border-slate-700 text-white"
                  >
                    {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">ساعت شروع</label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={e => setFormData({...formData, start_time: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">ساعت پایان</label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={e => setFormData({...formData, end_time: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">کلاس</label>
                  <select
                    value={formData.class_id}
                    onChange={e => setFormData({...formData, class_id: e.target.value})}
                    className="w-full p-2 rounded bg-slate-800 border-slate-700 text-white"
                    required
                  >
                    <option value="">انتخاب کنید</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">درس</label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full p-2 rounded bg-slate-800 border-slate-700 text-white"
                    required
                  >
                    <option value="">انتخاب کنید</option>
                    {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">معلم</label>
                  <select
                    value={formData.teacher_id}
                    onChange={e => setFormData({...formData, teacher_id: e.target.value})}
                    className="w-full p-2 rounded bg-slate-800 border-slate-700 text-white"
                    required
                  >
                    <option value="">انتخاب کنید</option>
                    {teachers.map(t => (
                      <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 clay-button">
                    انصراف
                  </Button>
                  <Button type="submit" className="flex-1 clay-button bg-purple-500 text-white">
                    ذخیره
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}