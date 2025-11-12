import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Class } from "@/entities/Class";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, PlusCircle, Users, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ClassForm from "../components/teacher/ClassForm";
import ManageStudents from "../components/teacher/ManageStudents";

export default function TeacherClasses() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, data: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      console.log("معلم فعلی:", currentUser);
      
      const teacherClasses = await Class.filter({ teacher_id: currentUser.id }, "-created_date");
      console.log("کلاس‌های معلم:", teacherClasses);
      setClasses(teacherClasses);
      
      // دریافت تمام دانش‌آموزان
      const allUsers = await User.list();
      const allStudents = allUsers.filter(u => u.student_role === 'student');
      console.log("تمام دانش‌آموزان:", allStudents);
      setStudents(allStudents);
      
    } catch (error) {
      console.error("خطا در بارگیری کلاس‌ها:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleModalClose = () => {
    setModalState({ type: null, data: null });
    loadData();
  };
  
  const handleDeleteClass = async (classId) => {
    if (window.confirm("آیا از حذف این کلاس مطمئن هستید؟ تمام دانش‌آموزان و تکالیف مرتبط با آن نیز تحت تاثیر قرار خواهند گرفت.")) {
      try {
        await Class.delete(classId);
        loadData();
      } catch (error) {
        console.error("خطا در حذف کلاس:", error);
      }
    }
  };

  const getClassStudentsCount = (classId) => {
    return students.filter(s => s.class_id === classId).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">در حال بارگیری کلاس‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <GraduationCap className="w-10 h-10 text-purple-500" />
            مدیریت کلاس‌ها
          </h1>
          <p className="text-gray-300 text-lg">ایجاد، ویرایش و مدیریت دانش‌آموزان کلاس‌های شما</p>
        </div>
        <Button 
          onClick={() => setModalState({ type: 'create' })} 
          className="clay-button bg-gradient-to-r from-purple-500 to-blue-500 text-white"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> کلاس جدید
        </Button>
      </motion.div>

      {classes.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="clay-card p-12 text-center"
        >
          <GraduationCap className="w-24 h-24 text-gray-500 mx-auto mb-4"/>
          <h3 className="text-2xl font-bold text-white mb-2">هنوز کلاسی نساخته‌اید!</h3>
          <p className="text-gray-400 mb-6">با کلیک بر روی "کلاس جدید"، اولین کلاس خود را بسازید.</p>
          <Button 
            onClick={() => setModalState({ type: 'create' })} 
            className="clay-button bg-gradient-to-r from-purple-500 to-blue-500 text-white"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> کلاس جدید
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem, index) => (
          <motion.div 
            key={classItem.id} 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: index * 0.1 }}
          >
            <Card className="clay-card h-full flex flex-col justify-between">
              <div>
                <CardHeader>
                  <CardTitle className="text-xl text-white">{classItem.name}</CardTitle>
                  <p className="text-sm text-gray-400">{classItem.grade || 'پایه نامشخص'}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{classItem.description || "بدون توضیحات"}</p>
                  <div className="clay-card p-3 bg-blue-500/10">
                    <p className="text-blue-300 text-sm">
                      👥 {getClassStudentsCount(classItem.id)} دانش‌آموز
                    </p>
                  </div>
                </CardContent>
              </div>
              <div className="p-4 space-y-2">
                 <Button 
                   onClick={() => setModalState({ type: 'manage_students', data: classItem })} 
                   className="w-full clay-button text-white"
                 >
                  <Users className="mr-2 h-4 w-4" /> مدیریت دانش‌آموزان
                </Button>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setModalState({ type: 'edit', data: classItem })} 
                    variant="outline" 
                    className="flex-1 clay-button text-white"
                  >
                    <Edit className="mr-2 h-4 w-4" /> ویرایش
                  </Button>
                  <Button 
                    onClick={() => handleDeleteClass(classItem.id)} 
                    variant="destructive" 
                    className="flex-1 clay-button bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> حذف
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {(modalState.type === 'create' || modalState.type === 'edit') && (
          <ClassForm 
            isOpen={true} 
            onClose={handleModalClose} 
            classData={modalState.data}
            teacherId={user.id}
          />
        )}
        {modalState.type === 'manage_students' && (
          <ManageStudents 
            isOpen={true} 
            onClose={handleModalClose} 
            classItem={modalState.data}
          />
        )}
      </AnimatePresence>
    </div>
  );
}