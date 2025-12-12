import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, Check, X, Clock, Save, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { toPersianDate } from "@/components/utils";

export default function TeacherAttendance() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allClasses, allSchedules, allStudents] = await Promise.all([
        base44.entities.Class.list(),
        base44.entities.Schedule.filter({ teacher_id: currentUser.id }),
        base44.entities.PublicProfile.filter({ student_role: "student" })
      ]);

      // Get unique classes from teacher's schedule
      const teacherClassIds = [...new Set(allSchedules.map(s => s.class_id))];
      const teacherClasses = allClasses.filter(c => teacherClassIds.includes(c.id));
      
      setClasses(teacherClasses);
      setSchedules(allSchedules);
      setStudents(allStudents);
    } catch (error) {
      console.error("خطا در بارگیری داده‌ها:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendanceForDate();
    }
  }, [selectedClass, selectedDate]);

  const loadAttendanceForDate = async () => {
    try {
      const records = await base44.entities.Attendance.filter({
        class_id: selectedClass,
        date: selectedDate
      });
      
      setExistingAttendance(records);
      
      // Initialize attendance state
      const classStudents = students.filter(s => s.class_id === selectedClass);
      const attendanceMap = {};
      
      classStudents.forEach(student => {
        const existing = records.find(r => r.student_id === student.user_id);
        attendanceMap[student.user_id] = existing?.status || "present";
      });
      
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("خطا در بارگیری حضور و غیاب:", error);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast.error("لطفا کلاس و تاریخ را انتخاب کنید");
      return;
    }

    try {
      const classStudents = students.filter(s => s.class_id === selectedClass);
      
      for (const student of classStudents) {
        const status = attendance[student.user_id] || "present";
        const existing = existingAttendance.find(r => r.student_id === student.user_id);
        
        const attendanceData = {
          class_id: selectedClass,
          student_id: student.user_id,
          teacher_id: user.id,
          date: selectedDate,
          status: status
        };

        if (existing) {
          await base44.entities.Attendance.update(existing.id, attendanceData);
        } else {
          await base44.entities.Attendance.create(attendanceData);
        }
      }

      toast.success("حضور و غیاب ذخیره شد");
      await loadAttendanceForDate();
    } catch (error) {
      console.error("خطا در ذخیره حضور و غیاب:", error);
      toast.error("خطا در ذخیره");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "absent": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "late": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "excused": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "present": return "حاضر";
      case "absent": return "غایب";
      case "late": return "تاخیر";
      case "excused": return "مرخصی";
      default: return "نامشخص";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const classStudents = students.filter(s => s.class_id === selectedClass);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Users className="w-10 h-10 text-blue-500" />
          حضور و غیاب کلاس
        </h1>
        <p className="text-gray-300 text-lg">مشاهده لیست دانش‌آموزان و ثبت حضور و غیاب</p>
      </motion.div>

      <Card className="clay-card mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">انتخاب کلاس</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="کلاس را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">تاریخ</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 p-2 rounded-md bg-slate-800 text-white border border-slate-700"
                />
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-3 flex items-center">
                  {toPersianDate(selectedDate)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
          <Card className="clay-card mb-6">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white flex items-center justify-between">
                <span>لیست دانش‌آموزان</span>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {classStudents.length} نفر
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 p-6">
                {classStudents.map((student, index) => (
                  <motion.div
                    key={student.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="clay-card p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: student.avatar_color || "#8B5CF6" }}
                      >
                        {(student.full_name || "؟").charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{student.full_name}</div>
                        <div className="text-sm text-gray-400">{student.grade}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={attendance[student.user_id] === "present" ? "default" : "outline"}
                        onClick={() => setAttendance({...attendance, [student.user_id]: "present"})}
                        className={attendance[student.user_id] === "present" ? "bg-green-600" : "border-slate-700"}
                      >
                        <Check className="w-4 h-4" />
                        حاضر
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={attendance[student.user_id] === "absent" ? "default" : "outline"}
                        onClick={() => setAttendance({...attendance, [student.user_id]: "absent"})}
                        className={attendance[student.user_id] === "absent" ? "bg-red-600" : "border-slate-700"}
                      >
                        <X className="w-4 h-4" />
                        غایب
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={attendance[student.user_id] === "late" ? "default" : "outline"}
                        onClick={() => setAttendance({...attendance, [student.user_id]: "late"})}
                        className={attendance[student.user_id] === "late" ? "bg-yellow-600" : "border-slate-700"}
                      >
                        <Clock className="w-4 h-4" />
                        تاخیر
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={attendance[student.user_id] === "excused" ? "default" : "outline"}
                        onClick={() => setAttendance({...attendance, [student.user_id]: "excused"})}
                        className={attendance[student.user_id] === "excused" ? "bg-blue-600" : "border-slate-700"}
                      >
                        مرخصی
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {classStudents.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>هیچ دانش‌آموزی در این کلاس یافت نشد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {classStudents.length > 0 && (
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleSaveAttendance}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 ml-2" />
                ذخیره حضور و غیاب
              </Button>
            </div>
          )}
        </>
      )}

      {!selectedClass && (
        <Card className="clay-card">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              لطفا کلاس و تاریخ را انتخاب کنید
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}