import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@/entities/User";
import { Plus, Minus } from "lucide-react";

export default function ManageStudents({ isOpen, onClose, classItem }) {
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const users = await User.list();
        setAllStudents(users.filter(u => u.student_role === 'student'));
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
      setLoading(false);
    }
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);
  
  const handleToggleStudent = async (student) => {
    const isInClass = student.class_id === classItem.id;
    try {
      await User.update(student.id, { class_id: isInClass ? null : classItem.id });
      setAllStudents(prevStudents => 
        prevStudents.map(s => 
          s.id === student.id ? { ...s, class_id: isInClass ? null : classItem.id } : s
        )
      );
    } catch(error) {
      console.error("Failed to update student class", error);
    }
  };
  
  const filteredStudents = useMemo(() => {
    return allStudents.filter(s =>
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allStudents, searchTerm]);

  if (!isOpen) return null;

  return (
     <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="clay-card p-6 max-w-2xl w-full flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">مدیریت دانش‌آموزان: {classItem.name}</h2>
        <Input
          placeholder="جستجوی دانش‌آموز..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="clay-card mb-4"
        />
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {loading ? <p>در حال بارگیری...</p> : (
            filteredStudents.map(student => {
              const isInClass = student.class_id === classItem.id;
              return (
                <div key={student.id} className="clay-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{backgroundColor: student.avatar_color}}>
                        {student.full_name?.charAt(0) || '?'}
                     </div>
                     <div>
                       <p className="font-semibold text-gray-800">{student.full_name}</p>
                       <p className="text-sm text-gray-500">{student.email}</p>
                     </div>
                  </div>
                  <Button onClick={() => handleToggleStudent(student)} size="icon" className={`clay-button ${isInClass ? 'bg-red-100' : 'bg-green-100'}`}>
                    {isInClass ? <Minus className="h-5 w-5 text-red-600"/> : <Plus className="h-5 w-5 text-green-600"/>}
                  </Button>
                </div>
              );
            })
          )}
          {!loading && filteredStudents.length === 0 && <p className="text-center text-gray-500 py-8">دانش‌آموزی یافت نشد.</p>}
        </div>
         <div className="pt-4">
            <Button onClick={onClose} className="w-full clay-button">بستن</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}