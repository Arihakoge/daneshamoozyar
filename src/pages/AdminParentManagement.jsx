import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, X, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AdminParentManagement() {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [relationship, setRelationship] = useState("مادر");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProfiles, allRelationships] = await Promise.all([
        base44.entities.PublicProfile.list(),
        base44.entities.ParentChild.list()
      ]);

      const parentProfiles = allProfiles.filter(p => p.student_role === "parent");
      const studentProfiles = allProfiles.filter(p => p.student_role === "student");

      setParents(parentProfiles);
      setStudents(studentProfiles);
      setRelationships(allRelationships);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("خطا در بارگیری اطلاعات");
    }
    setLoading(false);
  };

  const openAddChildModal = (parent) => {
    setSelectedParent(parent);
    setSelectedStudent("");
    setRelationship("مادر");
    setShowModal(true);
  };

  const handleAddChild = async () => {
    if (!selectedParent || !selectedStudent) {
      toast.error("لطفاً تمام فیلدها را پر کنید");
      return;
    }

    try {
      // Check if relationship already exists
      const existing = relationships.find(
        r => r.parent_user_id === selectedParent.user_id && r.child_user_id === selectedStudent
      );

      if (existing) {
        toast.error("این فرزند قبلاً به این والد اضافه شده است");
        return;
      }

      await base44.entities.ParentChild.create({
        parent_user_id: selectedParent.user_id,
        child_user_id: selectedStudent,
        relationship: relationship
      });

      toast.success("فرزند با موفقیت اضافه شد");
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Error adding child:", error);
      toast.error("خطا در افزودن فرزند");
    }
  };

  const handleRemoveChild = async (relationshipId) => {
    if (!confirm("آیا از حذف این ارتباط اطمینان دارید؟")) return;

    try {
      await base44.entities.ParentChild.delete(relationshipId);
      toast.success("ارتباط با موفقیت حذف شد");
      loadData();
    } catch (error) {
      console.error("Error removing relationship:", error);
      toast.error("خطا در حذف ارتباط");
    }
  };

  const getChildrenForParent = (parentId) => {
    const childIds = relationships
      .filter(r => r.parent_user_id === parentId)
      .map(r => r.child_user_id);
    return students.filter(s => childIds.includes(s.user_id));
  };

  const getRelationshipId = (parentId, childId) => {
    const rel = relationships.find(
      r => r.parent_user_id === parentId && r.child_user_id === childId
    );
    return rel?.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-500" />
          مدیریت والدین و فرزندان
        </h1>
        <p className="text-gray-400 text-lg">تعریف ارتباط بین والدین و دانش‌آموزان</p>
      </motion.div>

      {parents.length === 0 ? (
        <Card className="clay-card p-12 text-center">
          <Users className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">هیچ والدی ثبت نشده است</h2>
          <p className="text-gray-400">ابتدا کاربرانی با نقش "والدین" ایجاد کنید</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parents.map((parent, index) => {
            const children = getChildrenForParent(parent.user_id);
            return (
              <motion.div
                key={parent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="clay-card">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: parent.avatar_color || "#8B5CF6" }}
                      >
                        {(parent.display_name || parent.full_name || "؟").charAt(0)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg text-white">
                          {parent.display_name || parent.full_name}
                        </CardTitle>
                        <Badge className="bg-purple-100 text-purple-800">والدین</Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => openAddChildModal(parent)}
                      size="sm"
                      className="w-full clay-button bg-gradient-to-r from-green-500 to-blue-500 text-white"
                    >
                      <UserPlus className="w-4 h-4 ml-2" />
                      افزودن فرزند
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {children.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">
                        هنوز فرزندی تعریف نشده
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 mb-2">فرزندان:</p>
                        {children.map(child => (
                          <div key={child.user_id} className="clay-card p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                style={{ backgroundColor: child.avatar_color || "#8B5CF6" }}
                              >
                                {(child.display_name || child.full_name || "؟").charAt(0)}
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">
                                  {child.display_name || child.full_name}
                                </p>
                                <p className="text-gray-400 text-xs">پایه {child.grade}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveChild(getRelationshipId(parent.user_id, child.user_id))}
                              className="clay-button text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="clay-card p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">افزودن فرزند</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    والد: {selectedParent?.display_name || selectedParent?.full_name}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    انتخاب دانش‌آموز:
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full clay-card p-3 text-white"
                  >
                    <option value="">انتخاب کنید...</option>
                    {students.map(student => (
                      <option key={student.user_id} value={student.user_id}>
                        {student.display_name || student.full_name} - پایه {student.grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    نسبت:
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full clay-card p-3 text-white"
                  >
                    <option value="پدر">پدر</option>
                    <option value="مادر">مادر</option>
                    <option value="سرپرست">سرپرست</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setShowModal(false)}
                    variant="outline"
                    className="flex-1 clay-button text-white"
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={handleAddChild}
                    className="flex-1 clay-button bg-gradient-to-r from-green-500 to-blue-500 text-white"
                  >
                    افزودن
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}