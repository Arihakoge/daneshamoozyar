import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Calendar, Users, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { toPersianNumber } from "@/components/utils";

const STATUS_CONFIG = {
  "حاضر": { color: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle },
  "غایب": { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
  "تاخیر": { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Clock },
  "مرخصی": { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: FileText }
};

export default function TeacherAttendance() {
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSchedule) {
      loadStudentsAndAttendance();
    }
  }, [selectedSchedule, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allSchedules, allClasses] = await Promise.all([
        base44.entities.Schedule.filter({ teacher_id: currentUser.id, is_active: true }),
        base44.entities.Class.list()
      ]);

      setSchedules(allSchedules);
      setClasses(allClasses);
    } catch (error) {
      console.error("خطا در بارگیری:", error);
      toast.error("خطا در بارگیری داده‌ها");
    }
    setLoading(false);
  };

  const loadStudentsAndAttendance = async () => {
    if (!selectedSchedule) return;

    try {
      const [allStudents, todayAttendances] = await Promise.all([
        base44.entities.PublicProfile.filter({ 
          student_role: "student", 
          class_id: selectedSchedule.class_id 
        }),
        base44.entities.Attendance.filter({ 
          schedule_id: selectedSchedule.id,
          date: selectedDate
        })
      ]);

      setStudents(allStudents);
      setAttendances(todayAttendances);

      const data = {};
      todayAttendances.forEach(att => {
        data[att.student_id] = { status: att.status, note: att.note || "", id: att.id };
      });
      setAttendanceData(data);
    } catch (error) {
      console.error("خطا در بارگیری دانش‌آموزان:", error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceData({
      ...attendanceData,
      [studentId]: { 
        status, 
        note: attendanceData[studentId]?.note || "",
        id: attendanceData[studentId]?.id
      }
    });
  };

  const handleNoteChange = (studentId, note) => {
    setAttendanceData({
      ...attendanceData,
      [studentId]: { 
        ...attendanceData[studentId],
        status: attendanceData[studentId]?.status || "حاضر",
        note
      }
    });
  };

  const saveAttendance = async () => {
    if (!selectedSchedule || !user) return;

    try {
      const updates = Object.keys(attendanceData).map(async (studentId) => {
        const data = attendanceData[studentId];
        const recordData = {
          date: selectedDate,
          schedule_id: selectedSchedule.id,
          class_id: selectedSchedule.class_id,
          student_id: studentId,
          status: data.status,
          teacher_id: user.id,
          note: data.note || ""
        };

        if (data.id) {
          await base44.entities.Attendance.update(data.id, recordData);
        } else {
          await base44.entities.Attendance.create(recordData);
        }
      });

      await Promise.all(updates);
      toast.success("حضور غیاب ثبت شد");
      loadStudentsAndAttendance();
    } catch (error) {
      console.error("خطا در ذخیره:", error);
      toast.error("خطا در ثبت حضور غیاب");
    }
  };

  const markAllPresent = () => {
    const newData = {};
    students.forEach(student => {
      newData[student.user_id] = { 
        status: "حاضر", 
        note: "",
        id: attendanceData[student.user_id]?.id
      };
    });
    setAttendanceData(newData);
  };

  const getAttendanceStats = () => {
    const stats = { حاضر: 0, غایب: 0, تاخیر: 0, مرخصی: 0 };
    Object.values(attendanceData).forEach(data => {
      if (data.status) stats[data.status]++;
    });
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const stats = selectedSchedule ? getAttendanceStats() : null;
  const classInfo = selectedSchedule ? classes.find(c => c.id === selectedSchedule.class_id) : null;

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <UserCheck className="w-10 h-10 text-purple-500" />
          حضور و غیاب
        </h1>
        <p className="text-gray-300 text-lg">ثبت حضور غیاب دانش‌آموزان</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="clay-card">
          <CardHeader>
            <CardTitle className="text-white text-lg">انتخاب جلسه درسی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {schedules.length === 0 ? (
              <p className="text-gray-400 text-sm">برنامه درسی تعریف نشده</p>
            ) : (
              schedules.map(schedule => {
                const cls = classes.find(c => c.id === schedule.class_id);
                return (
                  <button
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className={`w-full text-right p-3 rounded-lg transition-colors ${
                      selectedSchedule?.id === schedule.id
                        ? 'bg-purple-500/20 border-2 border-purple-500'
                        : 'clay-button hover:bg-white/5'
                    }`}
                  >
                    <div className="text-sm font-bold text-white">{schedule.subject}</div>
                    <div className="text-xs text-gray-400">{cls?.name || "نامشخص"}</div>
                    <div className="text-xs text-purple-400">{schedule.day_of_week} - {schedule.start_time}</div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {selectedSchedule && (
          <>
            <Card className="clay-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">اطلاعات جلسه</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">درس</p>
                  <p className="text-white font-bold">📚 {selectedSchedule.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">کلاس</p>
                  <p className="text-white font-bold">{classInfo?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">تعداد دانش‌آموزان</p>
                  <p className="text-white font-bold">{toPersianNumber(students.length)} نفر</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">تاریخ</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full p-2 rounded bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">آمار حضور</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.keys(STATUS_CONFIG).map(status => {
                  const Icon = STATUS_CONFIG[status].icon;
                  return (
                    <div key={status} className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-white text-sm">{status}</span>
                      </div>
                      <span className="text-white font-bold">{toPersianNumber(stats[status])}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {selectedSchedule && students.length > 0 && (
        <Card className="clay-card">
          <CardHeader className="border-b border-white/10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                لیست دانش‌آموزان - {classInfo?.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={markAllPresent} variant="outline" className="clay-button text-white">
                  <CheckCircle className="w-4 h-4 ml-2" />
                  همه حاضر
                </Button>
                <Button onClick={saveAttendance} className="clay-button bg-purple-500 text-white">
                  ذخیره حضور غیاب
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/10">
              {students.map((student, index) => {
                const attendance = attendanceData[student.user_id] || { status: "حاضر", note: "" };
                return (
                  <div key={student.user_id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-gray-400 font-bold">{toPersianNumber(index + 1)}</div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: student.avatar_color || "#8B5CF6" }}
                      >
                        {student.full_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold">{student.full_name}</p>
                        <p className="text-sm text-gray-400">{student.display_name}</p>
                      </div>
                      <div className="flex gap-2">
                        {Object.keys(STATUS_CONFIG).map(status => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(student.user_id, status)}
                            className={`px-3 py-1 rounded-lg text-sm transition-all ${
                              attendance.status === status
                                ? STATUS_CONFIG[status].color + " border"
                                : "clay-button text-gray-400"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="یادداشت..."
                        value={attendance.note}
                        onChange={e => handleNoteChange(student.user_id, e.target.value)}
                        className="w-48 p-2 rounded bg-slate-800 border-slate-700 text-white text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSchedule && students.length === 0 && (
        <Card className="clay-card">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">هیچ دانش‌آموزی در این کلاس یافت نشد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}